import { ExportConfig, Stroke } from '../types/canvas';
import {
  getFreehandOutline,
  getSvgPathFromStroke,
  renderStroke,
} from './canvasRenderer';

/**
 * Triggers a browser download for a given Blob and filename.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Exports the current strokes to PNG or JPEG using an offscreen HTML5 Canvas + Blob API.
 * Preserves `'destination-out'` erasures cleanly without erasing the chosen background color.
 */
export async function exportRasterImage(
  strokes: Stroke[],
  width: number,
  height: number,
  config: ExportConfig
): Promise<void> {
  const { format, background, scale, filename } = config;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  // 1. Render all strokes + eraser masks onto an isolated transparent layer
  const strokeCanvas = document.createElement('canvas');
  strokeCanvas.width = targetWidth;
  strokeCanvas.height = targetHeight;
  const strokeCtx = strokeCanvas.getContext('2d');
  if (!strokeCtx) {
    throw new Error('Falha ao inicializar contexto 2D para exportação.');
  }

  strokeCtx.scale(scale, scale);
  for (const stroke of strokes) {
    renderStroke(strokeCtx, stroke);
  }

  // 2. Composite background + stroke layer onto final export canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) {
    throw new Error('Falha ao inicializar contexto final de exportação.');
  }

  // JPEG does not support alpha channel; default transparent to white for JPEG
  const effectiveBg =
    format === 'jpeg' && background === 'transparent' ? 'white' : background;

  if (effectiveBg === 'white') {
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (effectiveBg === 'dark') {
    finalCtx.fillStyle = '#0F172A';
    finalCtx.fillRect(0, 0, targetWidth, targetHeight);
  }

  finalCtx.drawImage(strokeCanvas, 0, 0);

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpeg' ? 0.94 : undefined;
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const safeName = filename.trim() || 'web-paint-engine-artwork';

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao gerar Blob da imagem.'));
          return;
        }
        triggerBlobDownload(blob, `${safeName}.${ext}`);
        resolve();
      },
      mimeType,
      quality
    );
  });
}

/**
 * Converts a single non-eraser stroke into an SVG element string.
 */
function strokeToSvgElement(stroke: Stroke): string {
  const { points, tool, color, size, opacity, filled } = stroke;
  if (points.length === 0) return '';

  const alphaAttr = opacity < 1 ? ` opacity="${opacity.toFixed(2)}"` : '';

  switch (tool) {
    case 'brush': {
      const outline = getFreehandOutline(stroke);
      const pathData = getSvgPathFromStroke(outline);
      if (!pathData) {
        const pt = points[0];
        return `<circle cx="${pt.x.toFixed(2)}" cy="${pt.y.toFixed(2)}" r="${(
          size / 2
        ).toFixed(2)}" fill="${color}"${alphaAttr} />`;
      }
      return `<path d="${pathData}" fill="${color}"${alphaAttr} />`;
    }

    case 'line': {
      const start = points[0];
      const end = points[points.length - 1];
      return `<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(
        2
      )}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(
        2
      )}" stroke="${color}" stroke-width="${size}" stroke-linecap="round" stroke-linejoin="round"${alphaAttr} />`;
    }

    case 'rectangle': {
      const start = points[0];
      const end = points[points.length - 1];
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      if (filled) {
        return `<rect x="${x.toFixed(2)}" y="${y.toFixed(
          2
        )}" width="${w.toFixed(2)}" height="${h.toFixed(
          2
        )}" fill="${color}"${alphaAttr} />`;
      }
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(
        2
      )}" height="${h.toFixed(
        2
      )}" fill="none" stroke="${color}" stroke-width="${size}" stroke-linecap="round" stroke-linejoin="round"${alphaAttr} />`;
    }

    case 'circle': {
      const start = points[0];
      const end = points[points.length - 1];
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.max(0.5, Math.abs(end.x - start.x) / 2);
      const ry = Math.max(0.5, Math.abs(end.y - start.y) / 2);
      if (filled) {
        return `<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(
          2
        )}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(
          2
        )}" fill="${color}"${alphaAttr} />`;
      }
      return `<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(
        2
      )}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(
        2
      )}" fill="none" stroke="${color}" stroke-width="${size}"${alphaAttr} />`;
    }

    default:
      return '';
  }
}

/**
 * Converts an eraser stroke into a black mask SVG path for SVG `<mask>` composition.
 */
function eraserStrokeToMaskElement(stroke: Stroke): string {
  const { points, size } = stroke;
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `<circle cx="${points[0].x.toFixed(2)}" cy="${points[0].y.toFixed(
      2
    )}" r="${(size / 2).toFixed(2)}" fill="black" />`;
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(
      2
    )} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;

  return `<path d="${d}" fill="none" stroke="black" stroke-width="${size}" stroke-linecap="round" stroke-linejoin="round" />`;
}

/**
 * Exports the current strokes to a scalable Vector SVG document via Blob API.
 * Supports sequential eraser masks (`destination-out` equivalent in SVG).
 */
export function exportVectorSvg(
  strokes: Stroke[],
  width: number,
  height: number,
  config: ExportConfig
): void {
  const { background, scale, filename } = config;
  const outWidth = Math.max(1, Math.round(width * scale));
  const outHeight = Math.max(1, Math.round(height * scale));

  const defs: string[] = [];
  let bodyContent = '';
  let maskCounter = 0;

  for (const stroke of strokes) {
    if (stroke.tool === 'eraser') {
      if (!bodyContent) continue;
      maskCounter++;
      const maskId = `eraser-mask-${maskCounter}`;
      const maskPath = eraserStrokeToMaskElement(stroke);
      defs.push(
        `<mask id="${maskId}">` +
          `<rect x="0" y="0" width="${width}" height="${height}" fill="white" />` +
          maskPath +
          `</mask>`
      );
      bodyContent = `<g mask="url(#${maskId})">\n${bodyContent}\n</g>`;
    } else {
      const el = strokeToSvgElement(stroke);
      if (el) {
        bodyContent += `  ${el}\n`;
      }
    }
  }

  let bgRect = '';
  if (background === 'white') {
    bgRect = `  <rect width="100%" height="100%" fill="#FFFFFF" />\n`;
  } else if (background === 'dark') {
    bgRect = `  <rect width="100%" height="100%" fill="#0F172A" />\n`;
  }

  const defsBlock =
    defs.length > 0 ? `  <defs>\n    ${defs.join('\n    ')}\n  </defs>\n` : '';

  const svgContent =
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${outWidth}" height="${outHeight}">\n` +
    defsBlock +
    bgRect +
    bodyContent +
    `</svg>`;

  const safeName = filename.trim() || 'web-paint-engine-artwork';
  const blob = new Blob([svgContent], {
    type: 'image/svg+xml;charset=utf-8',
  });
  triggerBlobDownload(blob, `${safeName}.svg`);
}

/**
 * Unified export entry point supporting PNG, JPEG, and SVG.
 */
export async function exportArtwork(
  strokes: Stroke[],
  width: number,
  height: number,
  config: ExportConfig
): Promise<void> {
  if (config.format === 'svg') {
    exportVectorSvg(strokes, width, height, config);
    return;
  }
  await exportRasterImage(strokes, width, height, config);
}
