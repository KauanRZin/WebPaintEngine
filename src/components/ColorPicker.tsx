import React, { useEffect, useState } from 'react';
import { Pipette, Check } from 'lucide-react';
import { DEFAULT_PALETTE, useDrawingStore } from '../store/useDrawingStore';

export const ColorPicker: React.FC = () => {
  const color = useDrawingStore((state) => state.settings.color);
  const recentColors = useDrawingStore((state) => state.recentColors);
  const setColor = useDrawingStore((state) => state.setColor);

  const [hexInput, setHexInput] = useState(color.toUpperCase());

  useEffect(() => {
    setHexInput(color.toUpperCase());
  }, [color]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith('#')) {
      val = '#' + val.replace(/[^0-9A-F]/gi, '');
    } else {
      val = '#' + val.slice(1).replace(/[^0-9A-F]/gi, '');
    }
    val = val.slice(0, 7);
    setHexInput(val);

    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setColor(val);
    }
  };

  const handleHexBlur = () => {
    if (!/^#[0-9A-F]{6}$/i.test(hexInput)) {
      setHexInput(color.toUpperCase());
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Cor do Traço
        </span>
        <span className="font-mono text-xs text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/70">
          {color.toUpperCase()}
        </span>
      </div>

      {/* Hexadecimal Input & Native Color Picker */}
      <div className="flex items-center gap-2">
        <label
          className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-700 cursor-pointer overflow-hidden shadow-inner shrink-0 transition-transform active:scale-95"
          style={{ backgroundColor: color }}
          title="Escolher cor personalizada"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="sr-only"
          />
          <Pipette
             className={`w-4 h-4 drop-shadow ${
              color.toUpperCase() === '#FFFFFF' ? 'text-slate-900' : 'text-white'
            }`}
          />
        </label>

        <div className="relative flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            maxLength={7}
            aria-label="Código Hexadecimal da Cor"
            placeholder="#0F172A"
            className="w-full bg-slate-800/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Quick Studio Palette */}
      <div>
        <div className="grid grid-cols-6 gap-1.5">
          {DEFAULT_PALETTE.map((swatch) => {
            const isSelected = color.toUpperCase() === swatch.toUpperCase();
            const isWhite = swatch.toUpperCase() === '#FFFFFF';
            return (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                title={swatch}
                className={`group relative h-7 w-full rounded-lg border transition-all flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 scale-105 border-white/60'
                    : 'border-slate-700/60 hover:scale-105 hover:border-slate-500'
                }`}
                style={{ backgroundColor: swatch }}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 stroke-[2.5] ${
                      isWhite ? 'text-slate-900' : 'text-white'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div className="pt-1">
          <span className="block text-[11px] font-medium text-slate-400 mb-1.5">
            Recentes
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {recentColors.map((recent) => {
              const isSelected = color.toUpperCase() === recent.toUpperCase();
              return (
                <button
                  key={recent}
                  type="button"
                  onClick={() => setColor(recent)}
                  title={`Recente: ${recent}`}
                  className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-500/40'
                      : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: recent }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
