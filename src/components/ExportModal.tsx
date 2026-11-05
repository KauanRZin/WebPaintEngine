import React, { useState } from 'react';
import {
  Download,
  X,
  FileImage,
  FileCode,
  Sparkles,
  Check,
} from 'lucide-react';
import { useDrawingStore } from '../store/useDrawingStore';
import {
  ExportBackground,
  ExportFormat,
} from '../types/canvas';
import { exportArtwork } from '../utils/exportHelpers';

interface ExportModalProps {
  canvasWidth: number;
  canvasHeight: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  canvasWidth,
  canvasHeight,
}) => {
  const isOpen = useDrawingStore((state) => state.isExportModalOpen);
  const strokes = useDrawingStore((state) => state.strokes);
  const setExportModalOpen = useDrawingStore(
    (state) => state.setExportModalOpen
  );

  const [format, setFormat] = useState<ExportFormat>('png');
  const [background, setBackground] = useState<ExportBackground>('white');
  const [scale, setScale] = useState<1 | 2>(2);
  const [filename, setFilename] = useState('web-paint-engine-arte');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsExporting(true);
      await exportArtwork(strokes, canvasWidth, canvasHeight, {
        format,
        background,
        scale,
        filename,
      });
      setExportModalOpen(false);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-sm font-bold text-white">
                Exportar Desenho
              </h3>
              <p className="text-xs text-slate-400">
                Salve sua arte em alta resolução ou vetor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExportModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleExport} className="p-5 space-y-5">
          {/* Filename */}
          <div className="space-y-1.5">
            <label
              htmlFor="export-filename"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Nome do Arquivo
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 focus-within:border-blue-500 rounded-xl px-3 py-2">
              <input
                id="export-filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="web-paint-engine-arte"
                className="w-full bg-transparent text-sm text-slate-100 font-mono outline-none"
              />
              <span className="text-xs font-mono text-slate-500 select-none">
                .{format === 'jpeg' ? 'jpg' : format}
              </span>
            </div>
          </div>

          {/* Format Selection: PNG, JPEG, SVG */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Formato de Saída
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    id: 'png',
                    title: 'PNG',
                    desc: 'Sem perda / Alpha',
                    icon: FileImage,
                  },
                  {
                    id: 'jpeg',
                    title: 'JPEG',
                    desc: 'Compacto / Foto',
                    icon: FileImage,
                  },
                  {
                    id: 'svg',
                    title: 'SVG',
                    desc: 'Vetorial Escalável',
                    icon: FileCode,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = format === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFormat(item.id);
                      if (item.id === 'jpeg' && background === 'transparent') {
                        setBackground('white');
                      }
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mb-1.5 ${
                        active ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold">{item.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Selection: Branco, Transparente, Escuro */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Plano de Fundo
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    id: 'white',
                    label: 'Branco',
                    previewClass: 'bg-white border-slate-300',
                    disabled: false,
                  },
                  {
                    id: 'transparent',
                    label: 'Transparente',
                    previewClass: 'checkerboard-bg border-slate-600',
                    disabled: format === 'jpeg',
                  },
                  {
                    id: 'dark',
                    label: 'Escuro',
                    previewClass: 'bg-slate-900 border-slate-700',
                    disabled: false,
                  },
                ] as const
              ).map((bg) => {
                const active = background === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    disabled={bg.disabled}
                    onClick={() => setBackground(bg.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      bg.disabled
                        ? 'opacity-35 cursor-not-allowed border-slate-800 bg-slate-900'
                        : active
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md border shrink-0 flex items-center justify-center ${bg.previewClass}`}
                    >
                      {active && (
                        <Check
                          className={`w-3 h-3 ${
                            bg.id === 'white' ? 'text-slate-900' : 'text-blue-400'
                          }`}
                        />
                      )}
                    </span>
                    <span className="truncate">{bg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution Multiplier (1x vs 2x Retina) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Escala de Resolução
              </span>
              <span className="text-xs font-mono text-slate-400">
                {Math.round(canvasWidth * scale)} ×{' '}
                {Math.round(canvasHeight * scale)} px
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScale(1)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  scale === 1
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                1x • Padrão ({canvasWidth}×{canvasHeight})
              </button>
              <button
                type="button"
                onClick={() => setScale(2)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  scale === 2
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>2x • HiDPI Retina</span>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setExportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'Exportando...'
                  : `Baixar ${format.toUpperCase()}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
