import React, { useState } from 'react';
import { Sliders, ChevronUp, ChevronDown } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { StrokeSlider } from './StrokeSlider';
import { useDrawingStore } from '../store/useDrawingStore';

const TOOL_LABELS: Record<string, string> = {
  brush: 'Pincel Livre',
  eraser: 'Borracha',
  line: 'Linha Reta',
  rectangle: 'Retângulo',
  circle: 'Círculo / Elipse',
};

export const ToolSettingsPanel: React.FC = () => {
  const activeTool = useDrawingStore((state) => state.activeTool);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      aria-label="Painel de Configurações da Ferramenta"
      className="fixed top-16 right-4 z-20 w-72 max-w-[calc(100vw-2rem)] bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-floating-dark text-slate-100 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-100 leading-tight">
              Propriedades do Traço
            </h2>
            <p className="text-[11px] text-slate-400">
              {TOOL_LABELS[activeTool] ?? activeTool}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expandir painel' : 'Recolher painel'}
        >
          {collapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
          {activeTool !== 'eraser' && (
            <>
              <ColorPicker />
              <div className="h-px bg-slate-800/80" />
            </>
          )}
          <StrokeSlider />
        </div>
      )}
    </aside>
  );
};
