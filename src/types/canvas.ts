export type ToolType = 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle';

export type EraserMode = 'mask' | 'object';

export interface Point {
  x: number;
  y: number;
  pressure: number;
}

export interface BrushSettings {
  color: string;
  size: number; // 1px to 50px
  opacity: number; // 0.05 to 1.0
  thinning: number; // 0 to 1 (perfect-freehand pressure sensitivity)
  smoothing: number; // 0 to 1
  streamline: number; // 0 to 1
  simulatePressure: boolean;
  filledShape: boolean;
  eraserMode: EraserMode;
}

export interface Stroke {
  id: string;
  tool: ToolType;
  points: Point[];
  color: string;
  size: number;
  opacity: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  simulatePressure: boolean;
  filled?: boolean;
  timestamp: number;
}

export type CanvasBackgroundMode = 'white' | 'grid' | 'dots' | 'transparent' | 'dark';

export type ExportFormat = 'png' | 'jpeg' | 'svg';

export type ExportBackground = 'transparent' | 'white' | 'dark';

export interface ExportConfig {
  format: ExportFormat;
  background: ExportBackground;
  scale: 1 | 2;
  filename: string;
}

export interface ViewportMetrics {
  width: number;
  height: number;
  dpr: number;
  fps: number;
}
