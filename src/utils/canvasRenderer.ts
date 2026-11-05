import getStroke from 'perfect-freehand';
import { Point, Stroke } from '../types/canvas';

/**
 * Converts an array of polygon outline points from `perfect-freehand`
 * into a smooth quadratic Bézier SVG path string (`M ... Q ... Z`).
 */
export function getSvgPathFromStroke(points: number[][], closed = true): string {
  const len = points.length;
  if (len < 4) {
    return '';
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2
  )},${b[1].toFixed(2)} ${((b[0] + c[0]) / 2).toFixed(2)},${(
    (b[1] + c[1]) / 2
  ).toFixed(2)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${((a[0] + b[0]) / 2).toFixed(2)},${(
      (a[1] + b[1]) / 2
    ).toFixed(2)} `;
  }

  if (closed) {
    result += 'Z';
  }

  return result;
}

/**
 * Generates the `perfect-freehand` polygon outline for a given stroke.
 */
export function getFreehandOutline(stroke: Stroke): number[][] {
  const inputPoints = stroke.points.map((pt) => [pt.x, pt.y, pt.pressure ?? 0.5]);

  return getStroke(inputPoints, {
    size: stroke.size,
    thinning: stroke.tool === 'eraser' ? 0 : stroke.thinning,
    smoothing: stroke.smoothing,
    streamline: stroke.streamline,
    simulatePressure: stroke.tool === 'eraser' ? false : stroke.simulatePressure,
    last: true,
  });
}

/**
 * Renders a single `Stroke` onto a 2D Canvas rendering context.
 * Supports freehand brush (`perfect-freehand`), destination-out eraser,
 * straight line, rectangle, and circle/ellipse.
 */
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  const { points, tool, color, size, opacity, filled } = stroke;
  if (points.length === 0) return;

  ctx.save();

  // Configure common stroke caps & joins as required
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = size;

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }

    ctx.restore();
    return;
  }

  // Standard drawing mode
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;

  switch (tool) {
    case 'brush': {
      const outlinePoints = getFreehandOutline(stroke);
      const pathData = getSvgPathFromStroke(outlinePoints);
      if (pathData) {
        const path = new Path2D(pathData);
        ctx.fill(path);
      } else if (points.length >= 1) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'line': {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      break;
    }

    case 'rectangle': {
      const start = points[0];
      const end = points[points.length - 1];
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);

      ctx.beginPath();
      if (filled) {
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.strokeRect(x, y, w, h);
      }
      break;
    }

    case 'circle': {
      const start = points[0];
      const end = points[points.length - 1];
      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const radiusX = Math.max(0.5, Math.abs(end.x - start.x) / 2);
      const radiusY = Math.max(0.5, Math.abs(end.y - start.y) / 2);

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      if (filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Renders the entire pipeline of committed strokes + optional active in-progress stroke.
 * Designed to be executed inside a `requestAnimationFrame` cycle at 60+ FPS.
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: Stroke[],
  activeStroke: Stroke | null,
  erasedIdsPreview?: Set<string>
): void {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    if (erasedIdsPreview && erasedIdsPreview.has(stroke.id)) {
      // Dim stroke that is about to be erased in Object Eraser mode
      ctx.save();
      ctx.globalAlpha = 0.2;
      renderStroke(ctx, stroke);
      ctx.restore();
    } else {
      renderStroke(ctx, stroke);
    }
  }

  if (activeStroke && activeStroke.points.length > 0) {
    renderStroke(ctx, activeStroke);
  }
}

/**
 * Computes minimum distance from point P to segment AB.
 */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * (b.x - a.x);
  const projY = a.y + t * (b.y - a.y);
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Geometric hit-detection for Object Eraser mode (`eraserMode === 'object'`).
 * Checks if `point` with `eraserRadius` collides with `stroke`.
 */
export function doesPointCollideWithStroke(
  point: Point,
  stroke: Stroke,
  eraserRadius: number
): boolean {
  if (stroke.tool === 'eraser' || stroke.points.length === 0) return false;

  const threshold = eraserRadius + stroke.size / 2 + 4;
  const pts = stroke.points;

  if (stroke.tool === 'brush') {
    for (let i = 0; i < pts.length; i++) {
      if (Math.hypot(point.x - pts[i].x, point.y - pts[i].y) <= threshold) {
        return true;
      }
      if (i > 0 && distanceToSegment(point, pts[i - 1], pts[i]) <= threshold) {
        return true;
      }
    }
    return false;
  }

  if (stroke.tool === 'line') {
    const start = pts[0];
    const end = pts[pts.length - 1];
    return distanceToSegment(point, start, end) <= threshold;
  }

  if (stroke.tool === 'rectangle') {
    const start = pts[0];
    const end = pts[pts.length - 1];
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    if (stroke.filled) {
      return (
        point.x >= minX - threshold &&
        point.x <= maxX + threshold &&
        point.y >= minY - threshold &&
        point.y <= maxY + threshold
      );
    }

    const tl: Point = { x: minX, y: minY, pressure: 0.5 };
    const tr: Point = { x: maxX, y: minY, pressure: 0.5 };
    const br: Point = { x: maxX, y: maxY, pressure: 0.5 };
    const bl: Point = { x: minX, y: maxY, pressure: 0.5 };

    return (
      distanceToSegment(point, tl, tr) <= threshold ||
      distanceToSegment(point, tr, br) <= threshold ||
      distanceToSegment(point, br, bl) <= threshold ||
      distanceToSegment(point, bl, tl) <= threshold
    );
  }

  if (stroke.tool === 'circle') {
    const start = pts[0];
    const end = pts[pts.length - 1];
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.max(1, Math.abs(end.x - start.x) / 2);
    const ry = Math.max(1, Math.abs(end.y - start.y) / 2);

    const normDist = Math.hypot((point.x - cx) / rx, (point.y - cy) / ry);
    const tol = threshold / Math.min(rx, ry);

    if (stroke.filled) {
      return normDist <= 1 + tol;
    }
    return Math.abs(normDist - 1) <= tol;
  }

  return false;
}
