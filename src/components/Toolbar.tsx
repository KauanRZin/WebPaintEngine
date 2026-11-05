import React from 'react';
import {
  Brush,
  Eraser,
  Minus,
  Square,
  Circle,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Grid,
  Keyboard,
  Palette,
} from 'lucide-react';
import { useDrawingStore } from '../store/useDrawingStore';
import { CanvasBackgroundMode, ToolType } from '../types/canvas';

interface ToolOption {
  id: ToolType;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolOption[] = [
  { id: 'brush', label: 'Pincel Livre', shortcut: 'B', icon: Brush },
  { id: 'eraser', label: 'Borracha', shortcut: 'E', icon: Eraser },
  { id: 'line', label: 'Linha Reta', shortcut: 'L', icon: Minus },
  { id: 'rectangle', label: 'Retângulo', shortcut: 'R', icon: Square },
  { id: 'circle', label: 'Círculo', shortcut: 'C', icon: Circle },
];

const BG_MODES: { id: CanvasBackgroundMode; label: string }[] = [
  { id: 'grid', label: 'Grade' },
  { id: 'white', label: 'Branco' },
  { id: 'dark', label: 'Escuro' },
  { id: 'transparent', label: 'Transp.' },
];

export const Toolbar: React.FC = () => {
  const activeTool = useDrawingStore((state) => state.activeTool);
  const canUndo = useDrawingStore((state) => state.past.length > 0);
  const canRedo = useDrawingStore((state) => state.future.length > 0);
  const hasStrokes = useDrawingStore((state) => state.strokes.length > 0);
  const strokeCount = useDrawingStore((state) => state.strokes.length);
  const backgroundMode = useDrawingStore((state) => state.backgroundMode);

  const setTool = useDrawingStore((state) => state.setTool);
  const undo = useDrawingStore((state) => state.undo);
  const redo = useDrawingStore((state) => state.redo);
  const setBackgroundMode = useDrawingStore((state) => state.setBackgroundMode);
  const setClearConfirmOpen = useDrawingStore(
    (state) => state.setClearConfirmOpen
  );
  const setExportModalOpen = useDrawingStore(
    (state) => state.setExportModalOpen
  );
  const setShowShortcutsHelp = useDrawingStore(
    (state) => state.setShowShortcutsHelp
  );

  const cycleBackgroundMode = () => {
    const idx = BG_MODES.findIndex((m) => m.id === backgroundMode);
    const next = BG_MODES[(idx + 1) % BG_MODES.length];
    setBackgroundMode(next.id);
  };

  const currentBgLabel =
    BG_MODES.find((m) => m.id === backgroundMode)?.label ?? 'Grade';

  return (
    <>
      {/* Top Studio Header Bar */}
      <header className="fixed top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Brand & Telemetry */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 px-3.5 py-2 rounded-2xl shadow-floating-dark">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">
                Web<span className="text-blue-400">PaintEngine</span>
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300">
              {strokeCount} {strokeCount === 1 ? 'traço' : 'traços'}
            </span>
          </div>
        </div>

        {/* Right Quick Actions (Background, Shortcuts, Export) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 p-1.5 rounded-2xl shadow-floating-dark">
          <button
            type="button"
            onClick={cycleBackgroundMode}
            title="Alternar fundo da tela de visualização"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Grid className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Fundo:</span>
            <span className="font-mono text-[11px] text-slate-200">
              {currentBgLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowShortcutsHelp(true)}
            title="Atalhos de Teclado (?)"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            title="Exportar Arte (Ctrl+E)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>
      </header>

      {/* Floating Bottom / Left Main Tool Dock */}
      <nav
        aria-label="Ferramentas de Desenho"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 p-2 rounded-2xl shadow-floating-dark"
      >
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setTool(tool.id)}
                title={`${tool.label} (${tool.shortcut})`}
                aria-label={tool.label}
                aria-pressed={isActive}
                className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-105'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="sr-only">{tool.label}</span>
                {/* Subtle shortcut badge on desktop */}
                <span
                  className={`hidden sm:block absolute bottom-1 right-1 text-[9px] font-mono leading-none ${
                    isActive ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {tool.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-7 bg-slate-800 mx-1" />

        {/* History Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            aria-label="Desfazer"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y / Ctrl+Shift+Z)"
            aria-label="Refazer"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-7 bg-slate-800 mx-1" />

        {/* Clear Canvas Action */}
        <button
          type="button"
          onClick={() => setClearConfirmOpen(true)}
          disabled={!hasStrokes}
          title="Limpar tela inteira"
          aria-label="Limpar tela inteira"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </nav>
    </>
  );
};
