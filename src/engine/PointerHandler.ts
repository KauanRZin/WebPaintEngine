import { Point, ToolType } from '../types/canvas';

/**
 * Extracts normalized canvas-relative coordinates and hardware pen/touch pressure
 * from a native PointerEvent.
 */
export function extractNormalizedPoint(
  event: PointerEvent | React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // For mouse events, event.pressure is typically 0.5 when button is pressed;
  // for pen/stylus or pressure-capable touch, use hardware pressure (0.0 -> 1.0).
  const isPenOrTouch =
    event.pointerType === 'pen' || event.pointerType === 'touch';
  const rawPressure = event.pressure;
  const pressure =
    isPenOrTouch && rawPressure > 0 && rawPressure !== 0.5
      ? rawPressure
      : 0.5;

  return { x, y, pressure };
}

/**
 * Applies geometric constraints when Shift key is held down during shape creation:
 * - Line: Snaps to 45-degree increments (0°, 45°, 90°, 135°, 180°, etc.)
 * - Rectangle: Constrains width and height to a 1:1 square
 * - Circle: Constrains bounding box to a 1:1 circle
 */
export function applyShapeShiftConstraint(
  start: Point,
  current: Point,
  tool: ToolType,
  shiftKey: boolean
): Point {
  if (!shiftKey) return current;

  const dx = current.x - start.x;
  const dy = current.y - start.y;

  if (tool === 'line') {
    const angle = Math.atan2(dy, dx);
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const dist = Math.hypot(dx, dy);
    return {
      x: start.x + Math.cos(snapAngle) * dist,
      y: start.y + Math.sin(snapAngle) * dist,
      pressure: current.pressure,
    };
  }

  if (tool === 'rectangle' || tool === 'circle') {
    const size = Math.max(Math.abs(dx), Math.abs(dy));
    return {
      x: start.x + Math.sign(dx || 1) * size,
      y: start.y + Math.sign(dy || 1) * size,
      pressure: current.pressure,
    };
  }

  return current;
}
