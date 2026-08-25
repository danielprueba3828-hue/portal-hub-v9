import { useState, useEffect } from 'react';
import { useHorarioStore } from '../store/horarioStore';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import Navbar from '../components/layout/Navbar';
import { sendN8nEvent } from '../services/n8nService';
import { 
  UserPlus, 
  Search, 
  UserCheck, 
  UserX, 
  Trash2,
  Key,
  Users,
  AlertTriangle,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Cake,
  Unlock,
  Shield,
  Briefcase
} from 'lucide-react';

export default function Personal() {
  const { user: currentUser } = useAuthStore();
  const myRol = currentUser?.user_metadata?.rol || 'empleado';
  const { theme } = useThemeStore();
  const isLight = theme === 'clasico';

  const { 
    empleados, 
    fetchEmpleados, 
    addEmpleado, 
    updateEmpleado,
    bajaEmpleado, 
    activarEmpleado,
    eliminarEmpleado,
    resetPasswordEmpleado,
    desbloquearEmpleado,
    loading 
  } = useHorarioStore();

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('Todos');
  const [filterZona, setFilterZona] = useState('Todos');
  const [filterEstado, setFilterEstado] = useState('Activos');

  // Estados de Alta
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    cargo: 'Asesor de Ventas',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    email: '',
    telefono: '',
    cumpleanos: '',
    rol: 'asesor',
    password: '',
    zona: 'CATEGORIZACION',
    tienda_id: '7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b'
  });
  const [formError, setFormError] = useState('');

  // Estados de Edición (Modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editError, setEditError] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  useEffect(() => {
    fetchEmpleados('todos');
  }, [fetchEmpleados]);

  // Sincronización en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('realtime-personal-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empleados' },
        () => {
          fetchEmpleados('todos');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmpleados]);

  const showFeedback = (msg, type = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Alta de Colaborador
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.cedula || formData.cedula.length < 9) {
      setFormError('Por favor ingresa un número de cédula válido.');
      return;
    }

    let dbRol = 'empleado';
    let dbCargo = 'Asesor de Ventas';

    if (formData.rol === 'asesor') { dbRol = 'empleado'; dbCargo = 'Asesor de Ventas'; }
    else if (formData.rol === 'cajero') { dbRol = 'empleado'; dbCargo = 'Cajero'; }
    else if (formData.rol === 'bodeguero') { dbRol = 'empleado'; dbCargo = 'Bodeguero'; }
    else if (formData.rol === 'operativo') { dbRol = 'empleado'; dbCargo = 'Asistente Operativo'; }
    else if (formData.rol === 'tercer_a_bordo') { dbRol = 'admin'; dbCargo = 'Tercero a bordo'; }
    else if (formData.rol === 'subjefe') { dbRol = 'admin'; dbCargo = 'Subjefe de Tienda'; }
    else if (formData.rol === 'admin') { dbRol = 'admin'; dbCargo = 'Jefe de Tienda'; }

    const newEmp = {
      cedula: formData.cedula.trim(),
      nombres: formData.nombres.trim().toUpperCase(),
      apellidos: formData.apellidos.trim().toUpperCase(),
      cargo: dbCargo,
      email: formData.email.trim().toLowerCase() || `${formData.cedula}@marathon.ec`,
      telefono: formData.telefono.trim(),
      cumpleanos: formData.cumpleanos,
      rol: dbRol,
      password_hash: formData.password.trim() || formData.cedula.trim(),
      zona: formData.zona || 'CATEGORIZACION',
      tienda_id: '7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b',
      activo: true,
      bloqueado: false,
      debe_cambiar_password: false
    };

    const res = await addEmpleado(newEmp);
    if (res.success) {
      // Disparar Webhook Automático hacia n8n
      sendN8nEvent('PERSONAL_REGISTRADO', {
        nombres: newEmp.nombres,
        apellidos: newEmp.apellidos,
        cargo: newEmp.cargo,
        cedula: newEmp.cedula,
        zona: newEmp.zona,
        email: newEmp.email
      }, currentUser?.user_metadata);

      showFeedback(`Colaborador ${newEmp.nombres} registrado con éxito.`);
      setFormData({
        cedula: '',
        nombres: '',
        apellidos: '',
        cargo: 'Asesor de Ventas',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        email: '',
        telefono: '',
        cumpleanos: '',
        rol: 'asesor',
        password: '',
        zona: 'CATEGORIZACION',
        tienda_id: '7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b'
      });
      setShowAddForm(false);
    } else {
      setFormError('Error al guardar: ' + res.error);
    }
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (emp) => {
    let selectedRolVal = emp.rol;
    if (emp.rol === 'empleado') {
      if (emp.cargo === 'Cajero') selectedRolVal = 'cajero';
      else if (emp.cargo === 'Bodeguero') selectedRolVal = 'bodeguero';
      else if (emp.cargo === 'Asesor de Ventas') selectedRolVal = 'asesor';
      else if (emp.cargo.includes('Operat')) selectedRolVal = 'operativo';
    } else if (emp.cargo === 'Tercero a bordo') {
      selectedRolVal = 'tercer_a_bordo';
    } else if (emp.cargo.includes('Subjefe')) {
      selectedRolVal = 'subjefe';
    } else if (emp.cargo.includes('Jefe')) {
      selectedRolVal = 'admin';
    }

    setEditData({
      cedula: emp.cedula,
      nombres: emp.nombres,
      apellidos: emp.apellidos,
      cargo: emp.cargo,
      email: emp.email || '',
      telefono: emp.telefono || '',
      cumpleanos: emp.cumpleanos || '',
      rol: selectedRolVal,
      zona: emp.zona || 'CATEGORIZACION',
      tienda_id: emp.tienda_id || '7b1c4e92-3a8f-4d6e-9b2c-1f5e8d4a7c3b',
      activo: emp.activo !== false,
      bloqueado: emp.bloqueado === true
    });
    setEditError('');
    setShowEditModal(true);
  };

  // Guardar Edición
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    let dbRol = 'empleado';
    let dbCargo = editData.cargo;

    if (editData.rol === 'asesor') { dbRol = 'empleado'; dbCargo = 'Asesor de Ventas'; }
    else if (editData.rol === 'cajero') { dbRol = 'empleado'; dbCargo = 'Cajero'; }
    else if (editData.rol === 'bodeguero') { dbRol = 'empleado'; dbCargo = 'Bodeguero'; }
    else if (editData.rol === 'operativo') { dbRol = 'empleado'; dbCargo = 'Asistente Operativo'; }
    else if (editData.rol === 'tercer_a_bordo') { dbRol = 'admin'; dbCargo = 'Tercero a bordo'; }
    else if (editData.rol === 'subjefe') { dbRol = 'admin'; dbCargo = 'Subjefe de Tienda'; }
    else if (editData.rol === 'admin') { dbRol = 'admin'; dbCargo = 'Jefe de Tienda'; }

    const cleanEdit = {
      cedula: editData.cedula,
      nombres: editData.nombres.trim().toUpperCase(),
      apellidos: editData.apellidos.trim().toUpperCase(),
      email: editData.email.trim().toLowerCase(),
      telefono: editData.telefono.trim(),
      cumpleanos: editData.cumpleanos,
      rol: dbRol,
      cargo: dbCargo,
      zona: editData.zona || 'CATEGORIZACION',
      tienda_id: editData.tienda_id
    };

    const res = await updateEmpleado(cleanEdit);
    if (res.success) {
      showFeedback(`Expediente de ${cleanEdit.nombres} actualizado.`);
      setShowEditModal(false);
    } else {
      setEditError('Error al actualizar: ' + res.error);
    }
  };

  // Restablecer Contraseña
  const handleResetPassword = async (cedula, nombre) => {
    if (window.confirm(`¿Restablecer la contraseña de ${nombre} a su cédula (${cedula})?`)) {
      const res = await resetPasswordEmpleado(cedula);
      if (res.success) {
        showFeedback(`Contraseña de ${nombre} restablecida a su cédula (${cedula}).`);
      }
    }
  };

  // Baja lógica / Reactivación
  const handleToggleEstado = async (emp) => {
    if (emp.activo) {
      if (window.confirm(`¿Dar de baja a ${emp.nombres} ${emp.apellidos}? Su perfil pasará a inactivo y se excluirá de todas las bitácoras y check-ins.`)) {
        await bajaEmpleado(emp.cedula);
        showFeedback(`Colaborador ${emp.nombres} dado de baja.`, 'warning');
      }
    } else {
      await activarEmpleado(emp.cedula);
      showFeedback(`Colaborador ${emp.nombres} reactivado exitosamente.`);
    }
  };

  // Eliminación definitiva de la base de datos
  const handleEliminarDefinitivo = async (emp) => {
    if (window.confirm(`⚠️ ¿ELIMINAR DEFINITIVAMENTE a ${emp.nombres} ${emp.apellidos}?\n\nEsta acción borrará al usuario por completo de la base de datos, horarios y registros asociados.`)) {
      const res = await eliminarEmpleado(emp.cedula);
      if (res.success) {
        showFeedback(`Colaborador ${emp.nombres} eliminado permanentemente.`, 'warning');
      } else {
        showFeedback(`Error al eliminar: ${res.error}`, 'error');
      }
    }
  };

  // Métricas rápidas de nómina
  const totalActivos = empleados.filter(e => e.activo).length;
  const totalAsesores = empleados.filter(e => e.activo && (e.cargo || '').includes('Asesor')).length;
  const totalBodega = empleados.filter(e => e.activo && (e.cargo || '').includes('Bodeg')).length;
  const totalLideresCaja = empleados.filter(e => e.activo && ((e.cargo || '').includes('Jefe') || (e.cargo || '').includes('Tercer') || (e.cargo || '').includes('Cajer'))).length;

  // Filtrado de colaboradores
  const filteredEmpleados = empleados.filter(emp => {
    const fullName = `${emp.nombres || ''} ${emp.apellidos || ''}`.toLowerCase();
    const cedula = String(emp.cedula || '');
    const matchesSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase()) || cedula.includes(searchTerm);
    const matchesCargo = filterCargo === 'Todos' || emp.cargo === filterCargo;
    const matchesZona = filterZona === 'Todos' || (emp.zona || 'CATEGORIZACION') === filterZona;
    const matchesEstado = 
      filterEstado === 'Todos' || 
      (filterEstado === 'Activos' && emp.activo) || 
      (filterEstado === 'Inactivos' && !emp.activo);

    return matchesSearch && matchesCargo && matchesZona && matchesEstado;
  });

  const getCargoStyle = (cargo) => {
    const c = (cargo || '').toLowerCase();
    if (c.includes('supervisor')) return { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', avatar: 'bg-gradient-to-tr from-purple-600 to-indigo-600' };
    if (c.includes('subjefe')) return { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', avatar: 'bg-gradient-to-tr from-amber-600 to-orange-500' };
    if (c.includes('jefe')) return { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30', avatar: 'bg-gradient-to-tr from-rose-600 to-red-600' };
    if (c.includes('tercer')) return { badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30', avatar: 'bg-gradient-to-tr from-pink-600 to-rose-500' };
    if (c.includes('cajer')) return { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', avatar: 'bg-gradient-to-tr from-emerald-600 to-teal-600' };
    if (c.includes('bodeg')) return { badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', avatar: 'bg-gradient-to-tr from-cyan-600 to-blue-600' };
    return { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', avatar: 'bg-gradient-to-tr from-blue-600 to-indigo-600' };
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#060b17] text-white'
    }`}>
      
      {/* Shared Navbar */}
      <Navbar />

      {/* Toast Notification */}
      {actionNotice && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-fade-in ${
          actionNotice.type === 'warning'
            ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          <Sparkles className="w-4 h-4" />
          <span>{actionNotice.msg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* Header de Gestión de Personal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-title font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Gestión de Personal
                </h1>
                <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nómina oficial de colaboradores, credenciales y asignación de zonas de tienda.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Cerrar Formulario' : 'Nuevo Colaborador'}</span>
          </button>
        </div>

        {/* KPI Cards de Resumen de Nómina */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Nómina</span>
            <span className="text-2xl font-black text-blue-500 mt-1 block">{totalActivos}</span>
            <span className="text-[10px] text-slate-400">Colaboradores activos</span>
          </div>

          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Asesores de Piso</span>
            <span className="text-2xl font-black text-indigo-400 mt-1 block">{totalAsesores}</span>
            <span className="text-[10px] text-slate-400">Ventas y servicio</span>
          </div>

          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bodega</span>
            <span className="text-2xl font-black text-cyan-400 mt-1 block">{totalBodega}</span>
            <span className="text-[10px] text-slate-400">Inventario y calzado</span>
          </div>

          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Liderazgo & Caja</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">{totalLideresCaja}</span>
            <span className="text-[10px] text-slate-400">Jefes, Terceros y Cajas</span>
          </div>
        </div>

        {/* Formulario de Alta Expandible */}
        {showAddForm && (
          <div className={`p-6 rounded-3xl border shadow-xl animate-fade-in ${
            isLight ? 'bg-white border-slate-200 shadow-slate-200/50 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className={`flex items-center gap-2 pb-4 border-b mb-4 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <UserPlus className="w-5 h-5 text-blue-500" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Registrar Nuevo Colaborador
              </h3>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cédula *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Ej: 1714768486"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs outline-none focus:border-blue-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/70 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: JUAN CARLOS"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-blue-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/70 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PEREZ LOPEZ"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-blue-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950/70 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cargo / Función</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    <option value="asesor">👟 Asesor de Ventas</option>
                    <option value="cajero">💰 Cajero</option>
                    <option value="bodeguero">📦 Bodeguero</option>
                    <option value="operativo">⚙️ Asistente Operativo</option>
                    <option value="tercer_a_bordo">🎖️ Tercero a bordo</option>
                    <option value="subjefe">⭐ Subjefe de Tienda</option>
                    <option value="admin">👔 Jefe de Tienda</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Zona Asignada</label>
                  <select
                    value={formData.zona}
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    <option value="CATEGORIZACION">CATEGORIZACIÓN</option>
                    <option value="ZONA HOMBRE">ZONA HOMBRE</option>
                    <option value="ZONA MUJER">ZONA MUJER</option>
                    <option value="BODEGA">BODEGA</option>
                    <option value="CAJA">CAJA</option>
                    <option value="JEFATURA">JEFATURA</option>
                    <option value="OPERATIVO">OPERATIVO</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 0998765432"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-blue-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Guardar Colaborador
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Toolbar de Búsqueda y Filtros */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o cédula..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 font-medium ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white' 
                  : 'bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {/* Filtro Cargo */}
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer transition ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800' 
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="Todos">Todos los Cargos</option>
              <option value="Jefe de Tienda">👔 Jefe de Tienda</option>
              <option value="Subjefe de Tienda">⭐ Subjefe de Tienda</option>
              <option value="Tercero a bordo">🎖️ Tercero a bordo</option>
              <option value="Cajero">💰 Cajero</option>
              <option value="Bodeguero">📦 Bodeguero</option>
              <option value="Asesor de Ventas">👟 Asesor de Ventas</option>
              <option value="Asistente Operativo">⚙️ Operativo</option>
            </select>

            {/* Filtro Zona */}
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer transition ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800' 
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="Todos">Todas las Zonas</option>
              <option value="CATEGORIZACION">CATEGORIZACIÓN</option>
              <option value="ZONA HOMBRE">ZONA HOMBRE</option>
              <option value="ZONA MUJER">ZONA MUJER</option>
              <option value="BODEGA">BODEGA</option>
              <option value="CAJA">CAJA</option>
              <option value="JEFATURA">JEFATURA</option>
            </select>

            {/* Filtro Estado */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer transition ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800' 
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="Activos">Solo Activos</option>
              <option value="Inactivos">Bajas</option>
              <option value="Todos">Todos</option>
            </select>
          </div>
        </div>

        {/* Grid de Colaboradores Oficiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmpleados.map(emp => {
            const style = getCargoStyle(emp.cargo);
            const initials = `${(emp.nombres || '').charAt(0)}${(emp.apellidos || '').charAt(0)}`;

            return (
              <div
                key={emp.cedula}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-lg ${
                  isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md shrink-0 ${style.avatar}`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className={`font-black text-sm leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {emp.nombres} {emp.apellidos}
                        </h3>
                        <span className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${style.badge}`}>
                          {emp.cargo}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      emp.activo ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {emp.activo ? 'Activo' : 'Baja'}
                    </span>
                  </div>

                  {/* Datos del colaborador */}
                  <div className={`space-y-1.5 py-3 border-y text-xs ${
                    isLight ? 'border-slate-100 text-slate-600' : 'border-slate-800 text-slate-300'
                  }`}>
                    <div className="flex justify-between">
                      <span className={`${isLight ? 'text-slate-400' : 'text-slate-400'} text-[11px]`}>Cédula:</span>
                      <span className="font-mono font-bold">{emp.cedula}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isLight ? 'text-slate-400' : 'text-slate-400'} text-[11px]`}>Zona:</span>
                      <span className="font-bold text-indigo-500">{emp.zona || 'CATEGORIZACION'}</span>
                    </div>
                    {emp.telefono && (
                      <div className="flex justify-between">
                        <span className={`${isLight ? 'text-slate-400' : 'text-slate-400'} text-[11px]`}>Teléfono:</span>
                        <span className="font-mono">{emp.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-3 flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer text-center ${
                      isLight 
                        ? 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800' 
                        : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={() => handleResetPassword(emp.cedula, `${emp.nombres} ${emp.apellidos}`)}
                    title="Restablecer contraseña a su cédula"
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                      isLight 
                        ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600' 
                        : 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleEstado(emp)}
                    title={emp.activo ? 'Dar de baja' : 'Reactivar'}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                      emp.activo 
                        ? isLight 
                          ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' 
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' 
                        : isLight 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {emp.activo ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleEliminarDefinitivo(emp)}
                    title="Eliminar definitivamente de la base de datos"
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                      isLight 
                        ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100' 
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal de Edición */}
        {showEditModal && editData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
            <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ✏️ Modificar: {editData.nombres}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`text-xs px-2.5 py-1 rounded-xl cursor-pointer transition ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  ✕ Cerrar
                </button>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cédula</label>
                    <input
                      type="text"
                      disabled
                      value={editData.cedula}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-xs cursor-not-allowed ${
                        isLight ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Zona</label>
                    <select
                      value={editData.zona}
                      onChange={(e) => setEditData({ ...editData, zona: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none font-semibold ${
                        isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-slate-700 bg-slate-950 text-white'
                      }`}
                    >
                      <option value="CATEGORIZACION">CATEGORIZACIÓN</option>
                      <option value="ZONA HOMBRE">ZONA HOMBRE</option>
                      <option value="ZONA MUJER">ZONA MUJER</option>
                      <option value="BODEGA">BODEGA</option>
                      <option value="CAJA">CAJA</option>
                      <option value="JEFATURA">JEFATURA</option>
                      <option value="OPERATIVO">OPERATIVO</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nombres</label>
                    <input
                      type="text"
                      required
                      value={editData.nombres}
                      onChange={(e) => setEditData({ ...editData, nombres: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 ${
                        isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-slate-700 bg-slate-950 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Apellidos</label>
                    <input
                      type="text"
                      required
                      value={editData.apellidos}
                      onChange={(e) => setEditData({ ...editData, apellidos: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 ${
                        isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-slate-700 bg-slate-950 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cargo / Rol</label>
                    <select
                      value={editData.rol}
                      onChange={(e) => setEditData({ ...editData, rol: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none font-semibold ${
                        isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-slate-700 bg-slate-950 text-white'
                      }`}
                    >
                      <option value="asesor">👟 Asesor de Ventas</option>
                      <option value="cajero">💰 Cajero</option>
                      <option value="bodeguero">📦 Bodeguero</option>
                      <option value="operativo">⚙️ Asistente Operativo</option>
                      <option value="tercer_a_bordo">🎖️ Tercero a bordo</option>
                      <option value="subjefe">⭐ Subjefe de Tienda</option>
                      <option value="admin">👔 Jefe de Tienda</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Teléfono</label>
                    <input
                      type="text"
                      value={editData.telefono}
                      onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 ${
                        isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white' : 'border-slate-700 bg-slate-950 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className={`flex justify-end gap-2 pt-3 border-t ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
