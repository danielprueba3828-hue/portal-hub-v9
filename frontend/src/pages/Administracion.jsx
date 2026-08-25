import { useState, useEffect } from 'react';
import { useHorarioStore } from '../store/horarioStore';
import { useAuthStore } from '../store/authStore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Key, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText, 
  History,
  Lock,
  Calendar
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';

export default function Administracion() {
  const { user: currentUser } = useAuthStore();
  const myCedula = currentUser?.user_metadata?.cedula;

  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(currentUser?.user_metadata?.cargo || 'Asesor de Ventas', currentUser?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  const {
    empleados,
    turnos,
    solicitudes,
    logAuditoria,
    fetchEmpleados,
    fetchTurnos,
    fetchSolicitudes,
    fetchLogAccesos,
    fetchLogAuditoria,
    resetPassword,
    changeEmpleadoRol,
    procesarSolicitud
  } = useHorarioStore();

  // Estados de vista
  const [adminTab, setAdminTab] = useState('solicitudes'); // 'solicitudes', 'roles', 'reportes', 'logs'
  
  // Estado para reset clave
  const [selectedEmp, setSelectedEmp] = useState('');
  const [tempPass, setTempPass] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Estado para cambio de rol
  const [selectedRoleEmp, setSelectedRoleEmp] = useState('');
  const [newRol, setNewRol] = useState('empleado');
  const [roleSuccess, setRoleSuccess] = useState(false);

  // Estados de procesamiento de solicitudes
  const [comentarios, setComentarios] = useState({});

  // Estados de filtro de logs
  const [logSearch, setLogSearch] = useState('');
  const [logDate, setLogDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);



  // Rango de fechas para reportes
  const [reportStart, setReportStart] = useState('2026-06-01');
  const [reportEnd, setReportEnd] = useState('2026-06-30');

  useEffect(() => {
    fetchEmpleados();
    fetchTurnos();
    fetchSolicitudes();
    fetchLogAccesos();
    fetchLogAuditoria();
  }, [fetchEmpleados, fetchTurnos, fetchSolicitudes, fetchLogAccesos, fetchLogAuditoria]);

  // Restablecer contraseña temporal
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetSuccess(false);

    if (!selectedEmp || !tempPass) {
      alert("Por favor seleccione un empleado e ingrese una contraseña temporal.");
      return;
    }

    const res = await resetPassword(selectedEmp, tempPass);
    if (res.success) {
      setResetSuccess(true);
      setTempPass('');
      setTimeout(() => setResetSuccess(false), 2000);
    } else {
      alert("Error al restablecer contraseña: " + res.error);
    }
  };

  // Modificar rol de empleado
  const handleChangeRole = async (e) => {
    e.preventDefault();
    setRoleSuccess(false);

    if (!selectedRoleEmp || !newRol) return;

    const res = await changeEmpleadoRol(selectedRoleEmp, newRol);
    if (res.success) {
      setRoleSuccess(true);
      setTimeout(() => setRoleSuccess(false), 2000);
    } else {
      alert("Error al modificar rol: " + res.error);
    }
  };

  // Procesar Solicitud (Aprobar o Rechazar)
  const handleProcesar = async (id, estado) => {
    const comentario = comentarios[id] || '';
    
    const res = await procesarSolicitud(id, estado, comentario, myCedula);
    if (res.success) {
      setComentarios(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchLogAuditoria();
    } else {
      alert("Error al procesar la solicitud: " + res.error);
    }
  };

  // --- EXPORTACIÓN DE REPORTES ---
  const handleExportMatrizMensualExcel = () => {
    const start = new Date(reportStart + 'T00:00:00');
    const end = new Date(reportEnd + 'T00:00:00');
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    const dataReport = empleados.filter(e => e.activo && e.rol?.toLowerCase() !== 'supervisor' && e.cargo?.toLowerCase() !== 'supervisor').map(emp => {
      const row = {
        'Cédula': emp.cedula,
        'Colaborador': `${emp.apellidos}, ${emp.nombres}`,
        'Cargo': emp.cargo
      };

      days.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        const shift = turnos.find(t => t.empleado_cedula === emp.cedula && t.fecha === dateStr);
        if (shift) {
          row[dateStr] = shift.tipo_turno === 'Descanso' ? 'Descanso' : `${shift.tipo_turno} (${shift.hora_inicio} - ${shift.hora_fin})${shift.motivo_cambio ? ' [Cambio: ' + shift.motivo_cambio + ']' : ''}`;
        } else {
          row[dateStr] = 'Sin Turno';
        }
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataReport);
    
    const colWidths = [{ wch: 15 }, { wch: 30 }, { wch: 20 }];
    days.forEach(() => colWidths.push({ wch: 22 }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz de Horarios');
    XLSX.writeFile(wb, `Planificacion_Mensual_Marathon_${reportStart}_a_${reportEnd}.xlsx`);
  };

  const handleExportHorasExcel = () => {
    const activeStaff = empleados.filter(e => e.activo && e.rol?.toLowerCase() !== 'supervisor' && e.cargo?.toLowerCase() !== 'supervisor');
    const dataReport = activeStaff.map(emp => {
      const empShifts = turnos.filter(t => 
        t.empleado_cedula === emp.cedula && 
        t.fecha >= reportStart && 
        t.fecha <= reportEnd &&
        (t.tipo_turno === 'Mañana' || t.tipo_turno === 'Tarde')
      );

      const horasTrabajadas = empShifts.length * 8;
      const metaMes = 160;

      return {
        'Cédula': emp.cedula,
        'Empleado': `${emp.apellidos}, ${emp.nombres}`,
        'Cargo': emp.cargo,
        'Turnos Laborados': empShifts.length,
        'Horas Trabajadas': horasTrabajadas,
        'Horas Meta Mensual': metaMes,
        '% de Cumplimiento': `${Math.round((horasTrabajadas / metaMes) * 100)}%`
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataReport);
    ws['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Horas');
    XLSX.writeFile(wb, `Reporte_Horas_Marathon_${reportStart}_a_${reportEnd}.xlsx`);
  };

  const handleExportAusentismoExcel = () => {
    const dataReport = solicitudes
      .filter(s => s.estado === 'Aprobado' && s.fecha_inicio >= reportStart && s.fecha_inicio <= reportEnd)
      .map(sol => {
        const emp = empleados.find(e => e.cedula === sol.empleado_cedula);
        
        const totalDias = sol.duracion_tipo === 'Horas'
          ? 0.5
          : Math.ceil(Math.abs(new Date(sol.fecha_fin) - new Date(sol.fecha_inicio)) / (1000 * 60 * 60 * 24)) + 1;

        return {
          'Cédula': sol.empleado_cedula,
          'Empleado': emp ? `${emp.apellidos}, ${emp.nombres}` : 'Desconocido',
          'Tipo Permiso': sol.tipo,
          'Modalidad': sol.duracion_tipo || 'Días',
          'Fecha Inicio': sol.fecha_inicio,
          'Fecha Fin': sol.fecha_fin,
          'Tiempo': sol.duracion_tipo === 'Horas' ? `${sol.hora_inicio} a ${sol.hora_fin}` : `${totalDias} días`,
          'Justificación / Motivo': sol.motivo,
          'Aprobado Por': sol.procesado_por
        };
      });

    const ws = XLSX.utils.json_to_sheet(dataReport);
    ws['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 40 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ausentismos');
    XLSX.writeFile(wb, `Reporte_Ausentismo_PortalHub_${reportStart}_a_${reportEnd}.xlsx`);
  };

  const handleExportHorarioSemanalPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFillColor(0, 75, 202); // Azul `#004BCA`
    doc.rect(0, 0, 297, 24, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PORTAL HUB — PORTAL SHOPPING', 15, 16);
    
    doc.setTextColor(100, 116, 139);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Reporte de Horario Semanal de Personal (Semana del ${reportStart})`, 15, 32);

    const start = new Date(reportStart + 'T00:00:00');
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }

    const tableHeaders = ['Empleado', ...days.map(d => `${d.toLocaleDateString('es-EC', { weekday: 'short' }).toUpperCase()} ${d.getDate()}`)];
    
    const activeStaff = empleados.filter(e => e.activo && e.rol?.toLowerCase() !== 'supervisor' && e.cargo?.toLowerCase() !== 'supervisor');
    const tableRows = activeStaff.map(emp => {
      const row = [`${emp.apellidos}, ${emp.nombres}\n(${emp.cargo})`];
      
      days.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        const shift = turnos.find(t => t.empleado_cedula === emp.cedula && t.fecha === dateStr);
        if (shift) {
          row.push(`${shift.tipo_turno}\n[${shift.tipo_turno === 'Descanso' ? '00:00' : shift.hora_inicio}]`);
        } else {
          row.push('SIN TURN.\n[--:--]');
        }
      });
      return row;
    });

    autoTable(doc, {
      startY: 38,
      head: [tableHeaders],
      body: tableRows,
      headStyles: {
        fillColor: [0, 75, 202],
        textColor: [255, 255, 255],
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        valign: 'middle'
      },
      columnStyles: {
        0: { fontStyle: 'bold', minCellWidth: 45 }
      },
      theme: 'grid'
    });

    doc.save(`Horario_Semanal_Equipo_Marathon_${reportStart}.pdf`);
  };



  const filteredAuditLogs = logAuditoria.filter(l => 
    (l.usuario_cedula.includes(logSearch) || l.accion.toLowerCase().includes(logSearch.toLowerCase()) || l.detalles.toLowerCase().includes(logSearch.toLowerCase())) &&
    (!logDate || l.fecha_hora.startsWith(logDate))
  );

  // Paginación local de auditoría
  const logsPerPage = 12;
  const totalPages = Math.ceil(filteredAuditLogs.length / logsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const indexOfLastLog = activePage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredAuditLogs.slice(indexOfFirstLog, indexOfLastLog);

  const pendingSolicitudes = solicitudes.filter(s => s.estado === 'Pendiente');

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div>
        <h2 className={`text-3xl font-title font-black uppercase tracking-tight ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Panel de Administración Exclusivo</h2>
        <p className={`text-sm font-bold ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Control de seguridad, aprobación de permisos de personal y reportería de tienda (Versión V2).</p>
      </div>

      {/* Menú de Tabs Internas Responsivo con Scroll en Celular */}
      <div className={`flex p-1 rounded-2xl shadow-sm max-w-4xl overflow-x-auto whitespace-nowrap scrollbar-none md:overflow-x-visible border ${tc.cardBg || 'bg-white border-marathon-light'}`}>
        <button
          onClick={() => setAdminTab('solicitudes')}
          className={`flex-shrink-0 sm:flex-1 py-3 px-4 sm:px-1.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer 
            ${adminTab === 'solicitudes' 
              ? 'bg-[#004BCA] text-white shadow-sm' 
              : activeTheme === 'oscuro' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-marathon-medium'
            }`}
        >
          <Clock className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Bandeja de Permisos ({pendingSolicitudes.length})</span>
        </button>
        <button
          onClick={() => setAdminTab('roles')}
          className={`flex-shrink-0 sm:flex-1 py-3 px-4 sm:px-1.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer
            ${adminTab === 'roles' 
              ? 'bg-[#004BCA] text-white shadow-sm' 
              : activeTheme === 'oscuro' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-marathon-medium'
            }`}
        >
          <Key className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Credenciales</span>
        </button>
        <button
          onClick={() => setAdminTab('reportes')}
          className={`flex-shrink-0 sm:flex-1 py-3 px-4 sm:px-1.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer
            ${adminTab === 'reportes' 
              ? 'bg-[#004BCA] text-white shadow-sm' 
              : activeTheme === 'oscuro' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-marathon-medium'
            }`}
        >
          <FileText className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Descargar Reportes</span>
        </button>
        <button
          onClick={() => setAdminTab('auditoria')}
          className={`flex-shrink-0 sm:flex-1 py-3 px-4 sm:px-1.5 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap cursor-pointer
            ${adminTab === 'auditoria' 
              ? 'bg-[#004BCA] text-white shadow-sm' 
              : activeTheme === 'oscuro' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-marathon-medium'
            }`}
        >
          <History className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Bitácora de Cambios</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 📥 TAB 1: APROBACIÓN DE SOLICITUDES 📥 */}
      {/* ========================================================================= */}
      {adminTab === 'solicitudes' && (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg || 'bg-white border-marathon-light'}`} style={tc.cardBgStyle}>
          <h3 className={`text-base font-bold uppercase tracking-wider border-b pb-3 flex justify-between items-center ${activeTheme === 'oscuro' ? 'border-slate-700/60 text-white' : 'border-slate-100 text-marathon-deep'}`}>
            <span>Bandeja de Permisos Pendientes de Aprobación</span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase border ${activeTheme === 'oscuro' ? 'bg-amber-950/20 text-amber-500 border-amber-900/35' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
              {pendingSolicitudes.length} Pendientes
            </span>
          </h3>

          {pendingSolicitudes.length > 0 ? (
            <div className="space-y-4">
              {pendingSolicitudes.map((sol, idx) => {
                const emp = empleados.find(e => e.cedula === sol.empleado_cedula);
                return (
                  <div key={idx} className={`p-6 border rounded-3xl space-y-4 shadow-sm transition-all ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                    
                    {/* Fila superior: Expediente */}
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 ${activeTheme === 'oscuro' ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div>
                        <h4 className={`font-bold text-sm ${activeTheme === 'oscuro' ? 'text-white' : 'text-slate-800'}`}>
                          {emp ? `${emp.apellidos}, ${emp.nombres}` : 'Empleado Desconocido'}
                        </h4>
                        <span className={`text-xs font-bold uppercase tracking-wide ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Cédula: {sol.empleado_cedula} | Cargo: <strong className="text-marathon-medium">{emp?.cargo}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold block px-3 py-1 rounded-full w-max md:ml-auto border ${activeTheme === 'oscuro' ? 'bg-blue-950/30 border-blue-900/60 text-blue-300' : 'bg-blue-100 border-blue-200 text-slate-700'}`}>
                          📂 Petición: {sol.tipo} {sol.duracion_tipo === 'Horas' ? '⏱️ (Por Horas)' : '📅 (Días Completo)'}
                        </span>
                      </div>
                    </div>

                    {/* Fila del Cuerpo: Fechas y Motivos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-semibold text-slate-700 leading-normal">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Tiempo Solicitado</span>
                        <div className={`flex flex-col space-y-1 font-mono font-bold text-xs ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{sol.fecha_inicio} {sol.duracion_tipo === 'Días' ? `al ${sol.fecha_fin}` : ''}</span>
                          </div>
                          {sol.duracion_tipo === 'Horas' && (
                            <span className={`text-[10px] border px-2.5 py-0.5 rounded-xl w-max mt-1 font-sans font-black ${activeTheme === 'oscuro' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-600'}`}>⏱️ {sol.hora_inicio} a {sol.hora_fin}</span>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Justificación / Motivo</span>
                        <p className={`italic p-3 rounded-2xl border ${activeTheme === 'oscuro' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>"{sol.motivo}"</p>
                      </div>
                    </div>

                    {/* Acciones de Aprobación */}
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t ${activeTheme === 'oscuro' ? 'border-slate-800' : 'border-slate-200'}`}>
                      
                      {/* Campo comentario */}
                      <div className="flex-1 max-w-lg">
                        <input
                          type="text"
                          placeholder="Escriba un comentario o nota de justificación..."
                          value={comentarios[sol.id] || ''}
                          onChange={(e) => setComentarios({ ...comentarios, [sol.id]: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-xl text-xs placeholder-slate-400 outline-none ${tc.inputBg || 'bg-white border-slate-200 text-slate-900'}`}
                        />
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleProcesar(sol.id, 'Rechazado')}
                          className="flex items-center space-x-1.5 px-4 py-2.5 bg-red-50 hover:bg-marathon-red border border-red-200 hover:border-marathon-red text-marathon-red hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                        <button
                          onClick={() => handleProcesar(sol.id, 'Aprobado')}
                          className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Aprobar Permiso</span>
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 font-bold italic text-sm">
              No existen solicitudes de permisos ni vacaciones pendientes por revisar actualmente.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔐 TAB 2: GESTIÓN DE ROLES Y CREDENCIALES 🔐 */}
      {/* ========================================================================= */}
      {adminTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          
          {/* Panel 1: Resetear Contraseñas */}
          <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${tc.cardBg || 'bg-white border-marathon-light'}`} style={tc.cardBgStyle}>
            <div className={`flex items-center space-x-2.5 border-b pb-3 ${activeTheme === 'oscuro' ? 'border-slate-700/60' : 'border-slate-100'}`}>
              <Lock className="w-5 h-5 text-marathon-red" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Restablecer Contraseña</h3>
            </div>
            
            <p className={`text-xs leading-normal ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>
              Permite forzar el restablecimiento de credenciales de cualquier empleado. Al confirmar, se guardará la contraseña temporal y el usuario deberá cambiarla de forma obligatoria en su primer ingreso.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700 flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>¡Contraseña temporal guardada y bloqueo desactivado con éxito!</span>
                </div>
              )}

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Seleccione Empleado</label>
                <select
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold ${tc.inputBg || 'bg-slate-50 border-slate-200 text-slate-800 focus:border-marathon-medium'}`}
                >
                  <option value="">Seleccione personal...</option>
                  {empleados.map((emp, idx) => (
                    <option key={idx} value={emp.cedula}>
                      {emp.apellidos}, {emp.nombres} ({emp.cedula}) {emp.bloqueado ? '⚠️ BLOQUEADO' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Nueva Contraseña Temporal</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={tempPass}
                    onChange={(e) => setTempPass(e.target.value)}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border outline-none text-xs font-mono font-semibold ${tc.inputBg || 'bg-white border-slate-200 text-slate-800'}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const temp = Math.random().toString(36).substring(2, 10).toUpperCase();
                      setTempPass(temp);
                    }}
                    className={`font-bold px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer border ${activeTheme === 'oscuro' ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-705'}`}
                  >
                    Generar
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-marathon-red hover:bg-red-800 text-white font-bold py-3 px-4 rounded-xl border-b-4 border-red-700 hover:border-red-900 transition-all duration-150 text-xs uppercase tracking-wider cursor-pointer"
              >
                Confirmar Re-inicialización
              </button>
            </form>
          </div>

          {/* Panel 2: Cambiar Roles del Sistema */}
          <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${tc.cardBg || 'bg-white border-marathon-light'}`} style={tc.cardBgStyle}>
            <div className={`flex items-center space-x-2.5 border-b pb-3 ${activeTheme === 'oscuro' ? 'border-slate-700/60' : 'border-slate-100'}`}>
              <ShieldCheck className="w-5 h-5 text-marathon-medium" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Modificar Roles de Acceso</h3>
            </div>
            
            <p className={`text-xs leading-normal ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>
              Permite reestructurar la jerarquía de los trabajadores. Un cambio de rol asigna permisos inmediatos para ver sidebars administrativos y procesar solicitudes.
            </p>

            <form onSubmit={handleChangeRole} className="space-y-4">
              {roleSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700 flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>¡Rol de usuario actualizado con éxito!</span>
                </div>
              )}

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Seleccione Empleado</label>
                <select
                  value={selectedRoleEmp}
                  onChange={(e) => {
                    setSelectedRoleEmp(e.target.value);
                    const emp = empleados.find(emp => emp.cedula === e.target.value);
                    if (emp) setNewRol(emp.rol);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold ${tc.inputBg || 'bg-slate-50 border-slate-200 text-slate-800 focus:border-marathon-medium'}`}
                >
                  <option value="">Seleccione personal...</option>
                  {empleados.map((emp, idx) => (
                    <option key={idx} value={emp.cedula}>
                      {emp.apellidos}, {emp.nombres} [Rol actual: {emp.rol}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Asignar Nuevo Rol</label>
                <select
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs font-semibold ${tc.inputBg || 'bg-slate-50 border-slate-200 text-slate-800 focus:border-marathon-medium'}`}
                >
                  <option value="empleado">Empleado (Asesor/Cajero)</option>
                  <option value="supervisor">Supervisor de Tienda</option>
                  <option value="admin">Administrador General</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-marathon-medium hover:bg-marathon-deep text-white font-bold py-3 px-4 rounded-xl border-b-4 border-blue-700 hover:border-blue-900 transition-all duration-150 text-xs uppercase tracking-wider cursor-pointer"
              >
                Confirmar Cambio de Rol
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB 3: GENERACIÓN Y EXPORTACIÓN DE REPORTES 📊 */}
      {/* ========================================================================= */}
      {adminTab === 'reportes' && (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg || 'bg-white border-marathon-light'}`} style={tc.cardBgStyle}>
          
          <div className={`flex items-center space-x-2.5 border-b pb-3 ${activeTheme === 'oscuro' ? 'border-slate-700/60' : 'border-slate-100'}`}>
            <FileText className="w-5 h-5 text-[#004BCA]" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Módulo de Exportación de Datos</h3>
          </div>

          <p className={`text-xs max-w-3xl leading-relaxed ${tc.textSecondary}`}>
            Filtre el período de fechas de su planificación para descargar la reportería correspondiente de efectividad de tienda, horas de personal o cuadrar las planillas oficiales.
          </p>

          {/* Filtro Rango de Fechas */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl p-4 rounded-2xl border ${activeTheme === 'oscuro' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Fecha de Inicio</label>
              <input
                type="date"
                value={reportStart}
                onChange={(e) => setReportStart(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg border outline-none text-xs font-mono font-semibold ${tc.inputBg || 'bg-white border-slate-200 text-slate-800'}`}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>Fecha de Fin</label>
              <input
                type="date"
                value={reportEnd}
                onChange={(e) => setReportEnd(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg border outline-none text-xs font-mono font-semibold ${tc.inputBg || 'bg-white border-slate-200 text-slate-800'}`}
              />
            </div>
          </div>

          {/* Caja de Botones de Exportar */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-4">
            
            {/* Reporte Matriz Mensual (Excel) */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-blue-50/20 hover:border-marathon-light'}`}>
              <div className="space-y-1.5">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Matriz de Horarios</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Genera la matriz completa de planificación de la tienda, mostrando por cada día del mes qué turno tiene asignado cada empleado (con notas de cambios).
                </p>
              </div>
              <button
                onClick={handleExportMatrizMensualExcel}
                className="w-full flex items-center justify-center space-x-1.5 bg-blue-50 hover:bg-[#004BCA] text-[#004BCA] hover:text-white font-bold py-2 px-3 rounded-xl border border-blue-200 transition-colors uppercase text-[9px] tracking-widest cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Matriz Excel</span>
              </button>
            </div>

            {/* Reporte Horas Trabajadas (Excel) */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-blue-50/20 hover:border-marathon-light'}`}>
              <div className="space-y-1.5">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Horas e Cumplimiento</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Genera una plantilla en formato Excel conteniendo las horas totales laboradas de todo el personal en el rango, cruzados contra la meta mensual de 160h.
                </p>
              </div>
              <button
                onClick={handleExportHorasExcel}
                className="w-full flex items-center justify-center space-x-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold py-2 px-3 rounded-xl border border-emerald-200 transition-colors uppercase text-[9px] tracking-widest cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Horas Excel</span>
              </button>
            </div>

            {/* Reporte Ausentismo y Permisos (Excel) */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-blue-50/20 hover:border-marathon-light'}`}>
              <div className="space-y-1.5">
                <FileSpreadsheet className="w-8 h-8 text-amber-500" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Ausentismo y Permisos</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Genera una plantilla Excel de auditoría listando todas las solicitudes de días libres, vacaciones y justificaciones médicas aprobadas.
                </p>
              </div>
              <button
                onClick={handleExportAusentismoExcel}
                className="w-full flex items-center justify-center space-x-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white font-bold py-2 px-3 rounded-xl border border-amber-200 transition-colors uppercase text-[9px] tracking-widest cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Permisos Excel</span>
              </button>
            </div>

            {/* Reporte Horario Semanal PDF */}
            <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${activeTheme === 'oscuro' ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-blue-50/20 hover:border-marathon-light'}`}>
              <div className="space-y-1.5">
                <FileText className="w-8 h-8 text-marathon-red" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>Horario Semanal PDF</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Genera un PDF oficial de alta definición en formato horizontal, que incluye la matriz completa de planificación y turnos semanales de todo el equipo de tienda.
                </p>
              </div>
              <button
                onClick={handleExportHorarioSemanalPDF}
                className="w-full flex items-center justify-center space-x-1.5 bg-red-50 hover:bg-marathon-red text-marathon-red hover:text-white font-bold py-2 px-3 rounded-xl border border-red-200 transition-colors uppercase text-[9px] tracking-widest cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Exportar Horario PDF</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 TAB 4: BITÁCORA DE AUDITORÍA Y CAMBIOS 📜 */}
      {/* ========================================================================= */}
      {adminTab === 'auditoria' && (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${activeTheme === 'oscuro' ? 'bg-[#131C33] border-slate-800/80' : 'bg-white border-slate-100'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4 ${activeTheme === 'oscuro' ? 'border-slate-800/80' : 'border-slate-100'}`}>
            <div className="flex items-center space-x-2.5">
              <History className="w-5 h-5 text-[#004BCA]" />
              <h3 className={`text-base font-bold uppercase tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-marathon-deep'}`}>
                Bitácora de Auditoría de Horarios
              </h3>
            </div>
            
            {/* Buscador y Filtro Interno */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Buscar por cédula o acción..."
                value={logSearch}
                onChange={(e) => { setLogSearch(e.target.value); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  activeTheme === 'oscuro' 
                    ? 'bg-[#070D1E] border-slate-700/70 text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:ring-slate-400/10' 
                    : 'bg-slate-50/60 border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-slate-400/10'
                }`}
              />
              <input
                type="date"
                value={logDate}
                onChange={(e) => { setLogDate(e.target.value); setCurrentPage(1); }}
                className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-semibold outline-none transition-all ${
                  activeTheme === 'oscuro' 
                    ? 'bg-[#070D1E] border-slate-700/70 text-slate-100 placeholder-slate-500 focus:border-slate-400 focus:ring-slate-400/10' 
                    : 'bg-slate-50/60 border-slate-200 text-slate-800 focus:border-slate-400 focus:ring-slate-400/10'
                }`}
              />
            </div>
          </div>

          <p className={`text-xs ${tc.textSecondary}`}>
            Historial de auditoría oficial de la plataforma. Registra qué Jefe o Administrador realizó modificaciones de horarios individuales, cargas masivas de Excel, aprobaciones de permisos, o cambios en expedientes.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/50">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className={`${activeTheme === 'oscuro' ? 'bg-[#0E172C] text-slate-100' : 'bg-slate-50 text-slate-700'} font-title font-extrabold uppercase text-[10px] tracking-wider border-b ${activeTheme === 'oscuro' ? 'border-slate-800' : 'border-slate-200'}`}>
                  <th className="p-4 w-44">FECHA Y HORA</th>
                  <th className="p-4 w-36">EJECUTOR (CÉDULA)</th>
                  <th className="p-4 w-48">ACCIÓN REALIZADA</th>
                  <th className="p-4">DETALLES DE MODIFICACIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentLogs.length > 0 ? (
                  currentLogs.map((log, idx) => (
                    <tr 
                      key={idx} 
                      className={`transition-colors ${
                        activeTheme === 'oscuro' 
                          ? 'hover:bg-slate-800/40 text-slate-200 divide-slate-800/80' 
                          : 'hover:bg-slate-50/50 text-slate-700 divide-slate-100'
                      }`}
                    >
                      <td className="p-4 font-mono font-bold">
                        {new Date(log.fecha_hora).toLocaleString('es-EC', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md font-bold uppercase ${
                          activeTheme === 'oscuro' 
                            ? 'bg-slate-800 text-slate-300' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.usuario_cedula}
                        </span>
                      </td>
                      <td className="p-4 font-bold">
                        <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          log.accion.includes('Excel')
                            ? activeTheme === 'oscuro' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.accion.includes('Horario')
                            ? activeTheme === 'oscuro' ? 'bg-blue-950/20 text-blue-400 border-blue-900/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                            : activeTheme === 'oscuro' ? 'bg-purple-950/20 text-purple-400 border-purple-900/40' : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {log.accion}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-xs leading-relaxed max-w-md break-words">
                        {log.detalles}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 font-semibold uppercase text-[10px] tracking-widest">
                      No se encontraron registros de auditoría que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación Premium */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/60 text-xs font-semibold">
              <span className={activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}>
                Mostrando <strong className="text-marathon-medium">{indexOfFirstLog + 1}</strong> a <strong className="text-marathon-medium">{Math.min(indexOfLastLog, filteredAuditLogs.length)}</strong> de <strong className="text-marathon-medium">{filteredAuditLogs.length}</strong> registros
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-xl border font-bold uppercase text-[9px] tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                >
                  ◀ Ant.
                </button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - activePage) <= 1) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7.5 h-7.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                            activePage === pageNum
                              ? 'bg-[#004BCA] text-white shadow-sm border border-[#004BCA]'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="text-slate-400 px-0.5">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  type="button"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-xl border font-bold uppercase text-[9px] tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                >
                  Sig. ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
