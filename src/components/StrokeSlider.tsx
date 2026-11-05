import React from 'react';
import { Sparkles, Eraser, Square, CheckSquare } from 'lucide-react';
import { useDrawingStore } from '../store/useDrawingStore';

const SIZE_PRESETS = [2, 6, 12, 24, 42];

export const StrokeSlider: React.FC = () => {
  const activeTool = useDrawingStore((state) => state.activeTool);
  const size = useDrawingStore((state) => state.settings.size);
  const opacity = useDrawingStore((state) => state.settings.opacity);
  const color = useDrawingStore((state) => state.settings.color);
  const thinning = useDrawingStore((state) => state.settings.thinning);
  const smoothing = useDrawingStore((state) => state.settings.smoothing);
  const simulatePressure = useDrawingStore(
    (state) => state.settings.simulatePressure
  );
  const filledShape = useDrawingStore((state) => state.settings.filledShape);
  const eraserMode = useDrawingStore((state) => state.settings.eraserMode);

  const setSize = useDrawingStore((state) => state.setSize);
  const setOpacity = useDrawingStore((state) => state.setOpacity);
  const setThinning = useDrawingStore((state) => state.setThinning);
  const setSmoothing = useDrawingStore((state) => state.setSmoothing);
  const setSimulatePressure = useDrawingStore(
    (state) => state.setSimulatePressure
  );
  const setFilledShape = useDrawingStore((state) => state.setFilledShape);
  const setEraserMode = useDrawingStore((state) => state.setEraserMode);

  const isShapeWithFill =
    activeTool === 'rectangle' || activeTool === 'circle';

  return (
    <div className="space-y-4">
      {/* Live Brush Tip / Size Preview */}
      <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2.5 h-16">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">
            Preview da Ponta
          </span>
          <span className="text-xs font-mono text-slate-200">
            {size}px • {activeTool === 'eraser' ? '100%' : `${Math.round(opacity * 100)}%`}
          </span>
        </div>
        <div className="flex items-center justify-center w-14 h-14">
          <div
            className="rounded-full transition-all duration-75 shadow-sm"
            style={{
              width: `${Math.max(3, Math.min(50, size))}px`,
              height: `${Math.max(3, Math.min(50, size))}px`,
              backgroundColor:
                activeTool === 'eraser' ? 'transparent' : color,
              opacity: activeTool === 'eraser' ? 1 : opacity,
              border:
                activeTool === 'eraser'
                  ? '2px dashed #94A3B8'
                  : color.toUpperCase() === '#0F172A'
                  ? '1px solid rgba(255,255,255,0.25)'
                  : 'none',
            }}
          />
        </div>
      </div>

      {/* Stroke Thickness (1px - 50px) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="stroke-size-slider"
            className="text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Espessura
          </label>
          <span className="font-mono text-xs text-blue-400 font-medium">
            {size} px
          </span>
        </div>

        <input
          id="stroke-size-slider"
          type="range"
          min={1}
          max={50}
          step={1}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        {/* Quick Size Presets */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {SIZE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setSize(preset)}
              className={`flex-1 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                size === preset
                  ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 font-semibold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity Slider (Alpha Channel) */}
      {activeTool !== 'eraser' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="stroke-opacity-slider"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Opacidade
            </label>
            <span className="font-mono text-xs text-blue-400 font-medium">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          <input
            id="stroke-opacity-slider"
            type="range"
            min={5}
            max={100}
            step={1}
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      {/* Perfect-Freehand Dynamics for Brush */}
      {activeTool === 'brush' && (
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Dinâmica Freehand</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Afinamento por Pressão</span>
              <span className="font-mono text-slate-300">
                {Math.round(thinning * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={95}
              step={5}
              value={Math.round(thinning * 100)}
              onChange={(e) => setThinning(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Suavização Vetorial</span>
              <span className="font-mono text-slate-300">
                {Math.round(smoothing * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(smoothing * 100)}
              onChange={(e) => setSmoothing(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setSimulatePressure(!simulatePressure)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition-colors"
          >
            <span>Pressão Simulada (Velocidade)</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                simulatePressure
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {simulatePressure ? 'Ativo' : 'Off'}
            </span>
          </button>
        </div>
      )}

      {/* Eraser Mode Selector: Destination-Out vs Object Collision */}
      {activeTool === 'eraser' && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Eraser className="w-3.5 h-3.5 text-blue-400" />
            <span>Modo da Borracha</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setEraserMode('mask')}
              className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                eraserMode === 'mask'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold">Máscara Pixel</div>
              <div className="text-[10px] opacity-75">destination-out</div>
            </button>

            <button
              type="button"
              onClick={() => setEraserMode('object')}
              className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                eraserMode === 'object'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold">Por Colisão</div>
              <div className="text-[10px] opacity-75">Apaga o traço</div>
            </button>
          </div>
        </div>
      )}

      {/* Shape Fill Option for Rectangle & Circle */}
      {isShapeWithFill && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => setFilledShape(!filledShape)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              {filledShape ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Preencher Forma (Atalho: F)</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                filledShape
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {filledShape ? 'Sim' : 'Contorno'}
            </span>
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Dica: Segure <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Shift</kbd> ao arrastar para manter proporção 1:1.
          </p>
        </div>
      )}

      {activeTool === 'line' && (
        <div className="pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Dica: Segure <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Shift</kbd> para travar ângulos em múltiplos de 45°.
          </p>
        </div>
      )}
    </div>
  );
};
