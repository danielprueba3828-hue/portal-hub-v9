import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  FileText, 
  Check, 
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function SolicitudesHorario({
  solicitudes,
  employees,
  currentUser,
  isDirectivo,
  onAddSolicitud,
  onProcesarSolicitud,
  saving
}) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [tipo, setTipo] = useState('Día Libre');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [selectedCedula, setSelectedCedula] = useState(currentUser?.user_metadata?.cedula || '');

  const [adminComment, setAdminComment] = useState({});

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      alert('Por favor ingresa el motivo de la solicitud.');
      return;
    }

    const payload = {
      empleado_cedula: isDirectivo && selectedCedula ? selectedCedula : currentUser?.user_metadata?.cedula,
      tipo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      motivo,
      duracion_tipo: 'Días Completos'
    };

    const res = await onAddSolicitud(payload);
    if (res.success) {
      setShowNewModal(false);
      setMotivo('');
    }
  };

  const handleAction = async (id, estado) => {
    const comentario = adminComment[id] || (estado === 'Aprobado' ? 'Aprobado por jefatura' : 'Rechazado por operatividad');
    await onProcesarSolicitud(id, estado, comentario, currentUser?.user_metadata?.cedula);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-black text-white">Bandeja de Solicitudes y Permisos</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de días libres solicitados, vacaciones y licencias especiales con sincronización automática en el calendario.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>Nueva Solicitud</span>
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {solicitudes.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">No hay solicitudes registradas</p>
            <p className="text-xs text-slate-500 mt-1">Las solicitudes enviadas por los colaboradores aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudes.map(sol => {
              const emp = employees.find(e => e.cedula === sol.empleado_cedula);
              const empName = emp ? `${emp.nombres} ${emp.apellidos}` : sol.empleado_cedula;

              let statusBadge = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
              if (sol.estado === 'Aprobado') statusBadge = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
              if (sol.estado === 'Rechazado') statusBadge = 'bg-rose-500/15 text-rose-300 border-rose-500/30';

              return (
                <div 
                  key={sol.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{empName}</span>
                      <span className="text-xs text-slate-400">({emp?.cargo || 'Colaborador'})</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                        {sol.estado}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {sol.tipo}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1 text-blue-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{sol.fecha_inicio} {sol.fecha_fin && sol.fecha_fin !== sol.fecha_inicio ? `al ${sol.fecha_fin}` : ''}</span>
                      </div>
                      <div className="text-slate-400">
                        Motivo: <span className="text-slate-200">{sol.motivo}</span>
                      </div>
                    </div>

                    {sol.comentario_admin && (
                      <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                        💬 Respuesta Jefatura: <span className="text-slate-300">{sol.comentario_admin}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for Directivos on Pending Requests */}
                  {isDirectivo && sol.estado === 'Pendiente' && (
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      <input
                        type="text"
                        placeholder="Comentario opcional..."
                        value={adminComment[sol.id] || ''}
                        onChange={(e) => setAdminComment({ ...adminComment, [sol.id]: e.target.value })}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-40"
                      />
                      <button
                        onClick={() => handleAction(sol.id, 'Aprobado')}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar</span>
                      </button>
                      <button
                        onClick={() => handleAction(sol.id, 'Rechazado')}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Crear Nueva Solicitud</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              {isDirectivo && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Colaborador
                  </label>
                  <select
                    value={selectedCedula}
                    onChange={(e) => setSelectedCedula(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.cedula} value={emp.cedula}>
                        {emp.nombres} {emp.apellidos} ({emp.cargo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Tipo de Solicitud
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Día Libre">Día Libre / Descanso</option>
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Permiso Médico">Permiso Médico</option>
                  <option value="Compensación">Compensación de Horas</option>
                  <option value="Calamidad Doméstica">Calamidad Doméstica</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Motivo / Justificación
                </label>
                <textarea
                  rows="3"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Detalla el motivo de la solicitud..."
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition active:scale-95"
                >
                  {saving ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
