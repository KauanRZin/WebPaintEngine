import React from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useDrawingStore } from '../store/useDrawingStore';
import { ExportModal } from './ExportModal';

export const Canvas: React.FC = () => {
  const {
    containerRef,
    canvasRef,
    cursorRef,
    dimensions,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
  } = useCanvas();

  const backgroundMode = useDrawingStore((state) => state.backgroundMode);
  const activeTool = useDrawingStore((state) => state.activeTool);

  const getBackgroundClass = () => {
    switch (backgroundMode) {
      case 'white':
        return 'bg-white';
      case 'dark':
        return 'bg-slate-900';
      case 'transparent':
        return 'checkerboard-canvas';
      case 'grid':
      default:
        return 'bg-slate-50 canvas-dot-grid';
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-screen h-screen overflow-hidden select-none touch-none transition-colors duration-200 ${getBackgroundClass()}`}
      >
        {/* Main Interactive HiDPI Drawing Surface */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'none' }}
          className="block w-full h-full touch-none cursor-crosshair"
        />

        {/* Custom Brush / Eraser Diameter Cursor Preview */}
        <div
          ref={cursorRef}
          aria-hidden="true"
          className={`pointer-events-none fixed top-0 left-0 z-10 rounded-full opacity-0 transition-opacity duration-75 ${
            activeTool === 'eraser'
              ? 'border-2 border-dashed border-rose-500 bg-rose-500/10'
              : 'border border-slate-900/70 ring-1 ring-white/70'
          }`}
          style={{ willChange: 'transform, width, height' }}
        />

        {/* Subtle Bottom-Left Viewport & HiDPI Telemetry Badge */}
        <div className="pointer-events-none fixed bottom-4 left-4 z-10 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 text-[11px] font-mono text-slate-400">
          <span>
            {dimensions.width} × {dimensions.height}px
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-400">{dimensions.dpr}x HiDPI</span>
        </div>
      </div>

      {/* Export Dialog wired with current Canvas Dimensions */}
      <ExportModal
        canvasWidth={dimensions.width}
        canvasHeight={dimensions.height}
      />
    </>
  );
};

export const CanvasContainer = Canvas;
export default Canvas;
