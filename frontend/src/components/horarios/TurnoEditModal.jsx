import React, { useState, useEffect } from 'react';
import { SHIFT_PRESETS, calculateShiftHours } from '../../services/scheduleEngine';
import { useThemeStore } from '../../store/themeStore';
import { 
  X, 
  Clock, 
  Calendar, 
  Trash2, 
  Save, 
  Sparkles, 
  User,
  Coffee,
  CheckCircle2
} from 'lucide-react';

export default function TurnoEditModal({
  isOpen,
  onClose,
  employee,
  dateStr,
  existingTurno,
  onSave,
  onDelete,
  saving
}) {
  const { theme } = useThemeStore();
  const isLight = theme === 'clasico';

  const [tipoTurno, setTipoTurno] = useState('Apertura');
  const [horaInicio, setHoraInicio] = useState('09:30');
  const [horaFin, setHoraFin] = useState('18:30');
  const [motivo, setMotivo] = useState('Ajuste de planificación');

  useEffect(() => {
    if (existingTurno) {
      setTipoTurno(existingTurno.tipo_turno || 'Apertura');
      setHoraInicio(existingTurno.hora_inicio || '09:30');
      setHoraFin(existingTurno.hora_fin || '18:30');
    } else {
      setTipoTurno('Apertura');
      setHoraInicio('09:30');
      setHoraFin('18:30');
    }
  }, [existingTurno, isOpen]);

  // Bloquear el scroll de fondo — MUST be before any conditional return
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !employee) return null;

  const handleApplyPreset = (preset) => {
    setTipoTurno(preset.type);
    setHoraInicio(preset.start);
    setHoraFin(preset.end);
  };

  const handleSave = async () => {
    const payload = {
      id: existingTurno?.id,
      empleado_cedula: employee.cedula,
      fecha: dateStr,
      tipo_turno: tipoTurno,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      motivo_cambio: motivo
    };

    const ok = await onSave(payload);
    if (ok) onClose();
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Seguro que deseas eliminar el turno de ${employee.nombres} para el día ${dateStr}?`)) {
      const ok = await onDelete(existingTurno?.id, employee.cedula, dateStr);
      if (ok) onClose();
    }
  };

  const currentHours = calculateShiftHours({
    tipo_turno: tipoTurno,
    hora_inicio: horaInicio,
    hora_fin: horaFin
  });

  const formatShortName = (n = '', a = '') => {
    const fn = (n || '').trim().split(/\s+/)[0] || '';
    const ln = (a || '').trim().split(/\s+/)[0] || '';
    return `${fn} ${ln}`.trim() || 'Colaborador';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overscroll-none touch-none">
      <div className={`border rounded-3xl w-full max-w-md max-h-[72vh] sm:max-h-[82vh] overflow-hidden shadow-2xl flex flex-col transition-all overscroll-contain touch-pan-y ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0a1120] border-slate-800 text-white'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Editar Jornada de Turno
              </h3>
              <p className="text-xs text-slate-400 font-mono">{dateStr}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* Employee Badge */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-sm">
                {(employee.nombres || '')[0]}{(employee.apellidos || '')[0]}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {employee.nombres} {employee.apellidos}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{employee.cargo} • {employee.zona || 'Sin Zona'}</p>
              </div>
            </div>
          </div>

          {/* Quick Presets Grid */}
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1.5">
              Plantillas Rápidas de Turno
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SHIFT_PRESETS.slice(0, 6).map(preset => {
                const isActive = horaInicio === preset.start && horaFin === preset.end && tipoTurno === preset.type;
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-102' 
                        : isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono">{preset.code}</span>
                      <span className={`text-[9px] px-1 rounded ${isActive ? 'bg-blue-700 text-white' : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'}`}>
                        {preset.type}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {preset.start} - {preset.end}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Special shifts row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
              {SHIFT_PRESETS.slice(6).map(preset => {
                const isActive = tipoTurno === preset.type;
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md' 
                        : isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-black block truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time pickers */}
          {tipoTurno !== 'Descanso' && tipoTurno !== 'Feriado/Novedad' && (
            <div className={`grid grid-cols-2 gap-3 p-3 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                  Hora de Ingreso
                </label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-black border focus:outline-none focus:border-blue-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">
                  Hora de Salida
                </label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-black border focus:outline-none focus:border-blue-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="col-span-2 flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/40">
                <span className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px]">1h Almuerzo incluida</span>
                </span>
                <span className="font-black text-emerald-500 font-mono text-xs">
                  {currentHours}h efectivas
                </span>
              </div>
            </div>
          )}

          {/* Motivo de cambio */}
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">
              Motivo del Cambio (Auditoría)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Cambio de turno, refuerzo de venta, etc."
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-blue-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950/60 border-slate-800 text-white placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          {existingTurno ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="p-2.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
              title="Eliminar turno"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : <div></div>}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Turno'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
