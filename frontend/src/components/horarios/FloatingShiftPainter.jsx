import React from 'react';
import { SHIFT_PRESETS } from '../../services/scheduleEngine';
import { 
  Paintbrush, 
  Sparkles, 
  X, 
  Check, 
  Wand2, 
  Layers
} from 'lucide-react';

export default function FloatingShiftPainter({
  activePaintShift,
  onSelectPaintShift,
  isDirectivo,
  onRunAutoSchedule,
  saving,
  theme = 'oscuro'
}) {
  if (!isDirectivo) return null;

  const isLight = theme === 'clasico';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
      <div className={`backdrop-blur-2xl border rounded-full px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-3.5 transition-all ${
        isLight 
          ? 'bg-white/90 border-slate-300 text-slate-900 shadow-slate-300/60' 
          : 'bg-slate-900/90 border-slate-700/80 text-white shadow-black/90'
      }`}>
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/60">
          <div className="p-1.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30">
            <Paintbrush className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Pintar:</span>
        </div>

        {/* Shift selector pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[340px] sm:max-w-none py-0.5">
          {SHIFT_PRESETS.slice(0, 8).map(preset => {
            const isSelected = activePaintShift?.code === preset.code;
            let pillClass = '';

            if (preset.color === 'emerald') {
              pillClass = isSelected 
                ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300' 
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25';
            } else if (preset.color === 'teal') {
              pillClass = isSelected 
                ? 'bg-teal-500 text-slate-950 font-black border-teal-400 shadow-lg shadow-teal-500/40 ring-2 ring-teal-300' 
                : 'bg-teal-500/15 text-teal-300 border-teal-500/30 hover:bg-teal-500/25';
            } else if (preset.color === 'amber') {
              pillClass = isSelected 
                ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25';
            } else if (preset.color === 'blue') {
              pillClass = isSelected 
                ? 'bg-blue-500 text-white font-black border-blue-400 shadow-lg shadow-blue-500/40 ring-2 ring-blue-300' 
                : 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25';
            } else if (preset.color === 'rose') {
              pillClass = isSelected 
                ? 'bg-rose-500 text-white font-black border-rose-400 shadow-lg shadow-rose-500/40 ring-2 ring-rose-300' 
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25';
            } else {
              pillClass = isSelected 
                ? 'bg-slate-600 text-white font-black border-slate-400 shadow-lg ring-2 ring-slate-300' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750';
            }

            return (
              <button
                key={preset.code}
                onClick={() => onSelectPaintShift(isSelected ? null : preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono border transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${pillClass}`}
                title={`${preset.label} (${preset.start} - ${preset.end})`}
              >
                <span>{preset.code}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Clear selection or Auto-schedule trigger */}
        {activePaintShift ? (
          <button
            onClick={() => onSelectPaintShift(null)}
            className="p-1.5 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
            title="Desactivar modo pincel"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onRunAutoSchedule}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-500/30 transition active:scale-95 cursor-pointer"
            title="Generar propuesta inteligente de horarios con IA"
          >
            <Wand2 className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden md:inline">Auto-Equilibrar (IA)</span>
          </button>
        )}
      </div>
    </div>
  );
}
