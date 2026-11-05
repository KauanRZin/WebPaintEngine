import { Stroke } from '../types/canvas';
import { renderScene } from '../utils/canvasRenderer';

/**
 * High-performance 2D Canvas Renderer with HiDPI scaling (`devicePixelRatio`)
 * and `requestAnimationFrame` pipeline scheduling.
 */
export class CanvasEngineRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private isDirty = true;

  private logicalWidth = 0;
  private logicalHeight = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    });
    if (!context) {
      throw new Error('CanvasRenderingContext2D não suportado pelo navegador.');
    }
    this.ctx = context;
  }

  /**
   * Configures physical pixel dimensions and scales the 2D context according to
   * `window.devicePixelRatio` to eliminate blurriness on Retina / HiDPI displays.
   */
  public resize(width: number, height: number): { width: number; height: number; dpr: number } {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const nextWidth = Math.max(1, Math.floor(width));
    const nextHeight = Math.max(1, Math.floor(height));

    if (
      this.logicalWidth === nextWidth &&
      this.logicalHeight === nextHeight &&
      this.dpr === dpr
    ) {
      return { width: this.logicalWidth, height: this.logicalHeight, dpr: this.dpr };
    }

    this.logicalWidth = nextWidth;
    this.logicalHeight = nextHeight;
    this.dpr = dpr;

    this.canvas.width = Math.floor(nextWidth * dpr);
    this.canvas.height = Math.floor(nextHeight * dpr);
    this.canvas.style.width = `${nextWidth}px`;
    this.canvas.style.height = `${nextHeight}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.isDirty = true;

    return { width: nextWidth, height: nextHeight, dpr };
  }

  public markDirty(): void {
    this.isDirty = true;
  }

  public getMetrics(): { width: number; height: number; dpr: number } {
    return {
      width: this.logicalWidth,
      height: this.logicalHeight,
      dpr: this.dpr,
    };
  }

  /**
   * Schedules a single `requestAnimationFrame` pass to redraw the scene if dirty.
   */
  public scheduleRender(
    strokes: Stroke[],
    activeStroke: Stroke | null,
    erasedIdsPreview?: Set<string>
  ): void {
    this.isDirty = true;
    if (this.rafId !== null) return;

    this.rafId = window.requestAnimationFrame(() => {
      this.rafId = null;
      if (!this.isDirty) return;
      this.isDirty = false;

      // Ensure transform matrix is always synced with current HiDPI factor
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      renderScene(
        this.ctx,
        this.logicalWidth,
        this.logicalHeight,
        strokes,
        activeStroke,
        erasedIdsPreview
      );
    });
  }

  /**
   * Forces an immediate synchronous redraw (useful right after resize to prevent flicker).
   */
  public renderImmediate(
    strokes: Stroke[],
    activeStroke: Stroke | null,
    erasedIdsPreview?: Set<string>
  ): void {
    this.isDirty = false;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    renderScene(
      this.ctx,
      this.logicalWidth,
      this.logicalHeight,
      strokes,
      activeStroke,
      erasedIdsPreview
    );
  }

  public destroy(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
