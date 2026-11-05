import React from 'react';
import { AlertTriangle, Keyboard, Trash2, X } from 'lucide-react';
import { useDrawingStore } from '../store/useDrawingStore';

export const ClearConfirmModal: React.FC = () => {
  const isClearConfirmOpen = useDrawingStore(
    (state) => state.isClearConfirmOpen
  );
  const showShortcutsHelp = useDrawingStore((state) => state.showShortcutsHelp);
  const strokeCount = useDrawingStore((state) => state.strokes.length);

  const clearCanvas = useDrawingStore((state) => state.clearCanvas);
  const setClearConfirmOpen = useDrawingStore(
    (state) => state.setClearConfirmOpen
  );
  const setShowShortcutsHelp = useDrawingStore(
    (state) => state.setShowShortcutsHelp
  );

  return (
    <>
      {/* Clear Canvas Confirmation Modal */}
      {isClearConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3
                  id="clear-modal-title"
                  className="text-sm font-bold text-white"
                >
                  Limpar toda a tela?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta ação removerá todos os{' '}
                  <strong className="text-slate-200">{strokeCount}</strong>{' '}
                  traços atuais da tela. Você ainda poderá recuperar o desenho
                  usando <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px] font-mono">Ctrl+Z</kbd>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/25 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Limpar Tela</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Reference Modal */}
      {showShortcutsHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-modal-title"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="shortcuts-modal-title"
                    className="text-sm font-bold text-white"
                  >
                    Atalhos de Teclado
                  </h3>
                  <p className="text-xs text-slate-400">
                    Produtividade rápida no estúdio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-2.5 text-xs">
              {[
                { label: 'Pincel Livre (Freehand)', keys: ['B'] },
                { label: 'Borracha (Máscara / Objeto)', keys: ['E'] },
                { label: 'Linha Reta', keys: ['L'] },
                { label: 'Retângulo', keys: ['R'] },
                { label: 'Círculo / Elipse', keys: ['C'] },
                { label: 'Alternar Forma Preenchida', keys: ['F'] },
                { label: 'Diminuir / Aumentar Espessura', keys: ['[', ']'] },
                {
                  label: 'Restringir Proporção / Ângulo 45°',
                  keys: ['Shift + Arrastar'],
                },
                { label: 'Desfazer (Undo)', keys: ['Ctrl', 'Z'] },
                { label: 'Refazer (Redo)', keys: ['Ctrl', 'Y'] },
                { label: 'Exportar Imagem', keys: ['Ctrl', 'E'] },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-none"
                >
                  <span className="text-slate-300">{row.label}</span>
                  <div className="flex items-center gap-1">
                    {row.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
