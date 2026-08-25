import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTiendaStore } from '../store/tiendaStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, 
  Info, 
  Users, 
  Calendar, 
  Target, 
  Save, 
  Check, 
  Loader, 
  UserCheck, 
  AlertCircle,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function DetalleTienda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tiendas, editarTienda, borrarTienda, fetchSupervisoresTienda, asignarSupervisoresTienda } = useTiendaStore();
  
  const [tienda, setTienda] = useState(null);
  const [loadingTienda, setLoadingTienda] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Estados para Modal de Confirmación de Borrado
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteStore = async () => {
    if (!tienda) return;
    if (deleteConfirmName.trim().toLowerCase() !== tienda.nombre.trim().toLowerCase()) {
      setDeleteError('El nombre ingresado no coincide con el nombre de la tienda.');
      return;
    }

    setDeleting(true);
    setDeleteError('');
    const success = await borrarTienda(tienda.id);
    setDeleting(false);

    if (success) {
      setIsDeleteModalOpen(false);
      navigate('/selector-tienda', { replace: true });
    } else {
      setDeleteError('Ocurrió un error al intentar eliminar el local de la base de datos.');
    }
  };

  // Estados de la pestaña Info (Edición)
  const [formData, setFormData] = useState({
    nombre: '',
    concepto: 'marathon sports',
    ciudad: 'Quito',
    mall: '',
    province: 'Pichincha',
    address: '',
    phone: '',
    email: '',
    activo: true,
    logo: '',
    cover_image: ''
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [infoError, setInfoError] = useState('');

  // Estados de la pestaña Supervisores
  const [supervisoresDisponibles, setSupervisoresDisponibles] = useState([]);
  const [supervisoresAsignados, setSupervisoresAsignados] = useState([]);
  const [loadingSupervisores, setLoadingSupervisores] = useState(false);
  const [supervisoresSaving, setSupervisoresSaving] = useState(false);
  const [supervisoresSuccess, setSupervisoresSuccess] = useState(false);

  // Estados de la pestaña Personal
  const [personalTienda, setPersonalTienda] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const rol = user?.user_metadata?.rol || 'empleado';
  const isSuperadmin = rol === 'superadmin';
  const isAuthorized = rol === 'superadmin' || rol === 'regional_supervisor' || rol === 'admin';

  // Cargar datos de la tienda
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!isAuthorized) {
      navigate('/', { replace: true });
      return;
    }

    const t = tiendas.find(item => item.id === id);
    if (t) {
      setTimeout(() => {
        setTienda(t);
        setFormData({
          nombre: t.nombre || '',
          concepto: t.concepto || 'marathon sports',
          ciudad: t.ciudad || 'Quito',
          mall: t.mall || '',
          province: t.province || 'Pichincha',
          address: t.address || '',
          phone: t.phone || '',
          email: t.email || '',
          activo: t.activo !== false,
          logo: t.logo || '',
          cover_image: t.cover_image || ''
        });
        setLoadingTienda(false);
      }, 0);
    } else {
      // Intentar fetch unitario si no se encuentra en store
      const fetchUnit = async () => {
        setLoadingTienda(true);
        try {
          const { data, error } = await supabase
            .from('tiendas')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          if (data) {
            setTienda(data);
            setFormData({
              nombre: data.nombre || '',
              concepto: data.concepto || 'marathon sports',
              ciudad: data.ciudad || 'Quito',
              mall: data.mall || '',
              province: data.province || 'Pichincha',
              address: data.address || '',
              phone: data.phone || '',
              email: data.email || '',
              activo: data.activo !== false,
              logo: data.logo || '',
              cover_image: data.cover_image || ''
            });
          }
        } catch (e) {
          console.error("Error fetching store unit:", e);
        } finally {
          setLoadingTienda(false);
        }
      };
      fetchUnit();
    }
  }, [id, tiendas, user, isAuthorized, navigate]);

  // Cargar supervisores y asignaciones
  const loadSupervisoresData = useCallback(async () => {
    if (!tienda) return;
    setLoadingSupervisores(true);
    try {
      // 1. Obtener empleados con rol supervisor, regional_supervisor, admin o store_supervisor
      const { data: emps, error: empErr } = await supabase
        .from('empleados')
        .select('id, nombres, apellidos, rol, cargo')
        .in('rol', ['supervisor', 'admin', 'superadmin', 'regional_supervisor', 'store_supervisor']);
      
      if (empErr) throw empErr;
      setSupervisoresDisponibles(emps || []);

      // 2. Obtener asignaciones actuales
      const assignedIds = await fetchSupervisoresTienda(tienda.id);
      setSupervisoresAsignados(assignedIds);
    } catch (e) {
      console.error("Error loading supervisors tab data:", e);
    } finally {
      setLoadingSupervisores(false);
    }
  }, [tienda, fetchSupervisoresTienda]);

  // Cargar personal de la tienda
  const loadPersonalData = useCallback(async () => {
    if (!tienda) return;
    setLoadingPersonal(true);
    try {
      const { data: emps, error: empErr } = await supabase
        .from('empleados')
        .select('*')
        .eq('tienda_id', tienda.id)
        .order('apellidos', { ascending: true });
      if (empErr) throw empErr;
      const filtered = (emps || []).filter(e => e.cedula !== '0000000000');
      setPersonalTienda(filtered);
    } catch (e) {
      console.error("Error loading store staff:", e);
    } finally {
      setLoadingPersonal(false);
    }
  }, [tienda]);

  // Cargar datos según pestaña
  useEffect(() => {
    if (activeTab === 'supervisores' && tienda) {
      setTimeout(() => {
        loadSupervisoresData();
      }, 0);
    } else if (activeTab === 'personal' && tienda) {
      setTimeout(() => {
        loadPersonalData();
      }, 0);
    }
  }, [activeTab, tienda, loadSupervisoresData, loadPersonalData]);

  // Guardar pestaña Info
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoSaving(true);
    setInfoSuccess(false);
    setInfoError('');

    if (!formData.nombre.trim()) {
      setInfoError('El nombre de la tienda es obligatorio.');
      setInfoSaving(false);
      return;
    }

    const updated = await editarTienda(tienda.id, formData);
    if (updated) {
      setTienda(updated);
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } else {
      setInfoError('Error al guardar datos. Asegúrese de que el nombre sea único.');
    }
    setInfoSaving(false);
  };

  // Guardar asignación de supervisores
  const handleSupervisoresSave = async () => {
    setSupervisoresSaving(true);
    setSupervisoresSuccess(false);
    
    const ok = await asignarSupervisoresTienda(tienda.id, supervisoresAsignados);
    if (ok) {
      setSupervisoresSuccess(true);
      setTimeout(() => setSupervisoresSuccess(false), 3000);
    }
    setSupervisoresSaving(false);
  };

  const toggleSupervisorAssigned = (supId) => {
    setSupervisoresAsignados(prev => 
      prev.includes(supId) 
        ? prev.filter(id => id !== supId) 
        : [...prev, supId]
    );
  };

  if (loadingTienda) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020D20] space-y-4">
        <Loader className="w-12 h-12 text-[#004BCA] animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Cargando detalles de la tienda...</p>
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020D20] space-y-4 text-slate-200">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm font-semibold text-slate-400">No se encontró el local solicitado.</p>
        <button 
          onClick={() => navigate('/selector-tienda')}
          className="px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-xs font-bold"
        >
          Volver al Selector
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200 text-left">
      {/* Cabecera / Botón Atrás */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/selector-tienda')}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-750 text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white tracking-wider uppercase leading-none mb-1.5">
              {tienda.nombre}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-450 font-semibold uppercase">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                {tienda.concepto}
              </span>
              {tienda.mall && <span>• {tienda.mall}</span>}
              <span>• {tienda.ciudad}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-800/40 border border-slate-700/45 p-3 rounded-2xl backdrop-blur-md self-start sm:self-auto">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Estado de Local:</span>
          <span className={`font-black uppercase ${tienda.activo !== false ? 'text-emerald-400' : 'text-red-400'}`}>
            {tienda.activo !== false ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Navegación de Pestañas (Tabs) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-850 pb-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 border cursor-pointer ${
            activeTab === 'info' 
              ? 'bg-[#004BCA] text-white border-transparent shadow-[0_0_12px_rgba(0,75,202,0.3)]' 
              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Información</span>
        </button>

        <button
          onClick={() => setActiveTab('supervisores')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 border cursor-pointer ${
            activeTab === 'supervisores' 
              ? 'bg-[#004BCA] text-white border-transparent shadow-[0_0_12px_rgba(0,75,202,0.3)]' 
              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Supervisores</span>
        </button>

        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 border cursor-pointer ${
            activeTab === 'personal' 
              ? 'bg-[#004BCA] text-white border-transparent shadow-[0_0_12px_rgba(0,75,202,0.3)]' 
              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personal</span>
        </button>

        <button
          onClick={() => setActiveTab('horarios')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 border cursor-pointer ${
            activeTab === 'horarios' 
              ? 'bg-[#004BCA] text-white border-transparent shadow-[0_0_12px_rgba(0,75,202,0.3)]' 
              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Horarios</span>
        </button>

        <button
          onClick={() => setActiveTab('metas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 border cursor-pointer ${
            activeTab === 'metas' 
              ? 'bg-[#004BCA] text-white border-transparent shadow-[0_0_12px_rgba(0,75,202,0.3)]' 
              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Metas</span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      <div className="bg-[#0b1328]/45 border border-slate-850/80 rounded-[32px] p-6 shadow-xl backdrop-blur-md">
        
        {/* PESTAÑA 1: INFORMACIÓN */}
        {activeTab === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
              <Info className="w-5 h-5 text-[#004BCA]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Editar Datos del Local</h3>
            </div>

            {infoSuccess && (
              <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-xs font-bold flex items-center space-x-2">
                <Check className="w-4.5 h-4.5" />
                <span>¡La tienda se actualizó con éxito!</span>
              </div>
            )}

            {infoError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold">
                {infoError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Nombre de la Tienda *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Marca / Concepto</label>
                <select
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                >
                  <option value="marathon sports">Marathon Sports</option>
                  <option value="marathons outlets">Marathon Outlet</option>
                  <option value="taff">Taff</option>
                  <option value="explorer">Explorer</option>
                  <option value="explorer outlet">Explorer Outlet</option>
                  <option value="teleshop">Teleshop</option>
                  <option value="bodegas deportivas">Bodegas Deportivas</option>
                  <option value="cikla">Cikla</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Ciudad</label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Centro Comercial (Mall)</label>
                <input
                  type="text"
                  value={formData.mall}
                  onChange={(e) => setFormData({ ...formData, mall: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Provincia</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Correo Electrónico Oficial</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Dirección Física</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none resize-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">URL del Logotipo</label>
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">URL de la Portada</label>
                <input
                  type="text"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-bold outline-none focus:border-[#004BCA] transition-all"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-800 bg-[#050b18]/65 text-[#004BCA] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="activo" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                  Tienda activa y operativa
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={infoSaving}
                className="px-5 py-3 bg-[#004BCA] hover:bg-[#005cff] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 shadow-[0_0_12px_rgba(0,92,255,0.3)] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{infoSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

            {isSuperadmin && (
              <div className="mt-8 border-t border-red-500/20 pt-6">
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Zona de Peligro</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                      Eliminar permanentemente este local comercial. Todos los horarios, metas y estadísticas asociadas serán borrados de forma definitiva.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmName('');
                      setDeleteError('');
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-red-600/10 border border-red-555/20 hover:bg-red-650 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer self-start md:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Tienda</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* PESTAÑA 2: SUPERVISORES */}
        {activeTab === 'supervisores' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-5 h-5 text-[#004BCA]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Asignar Supervisores</h3>
              </div>
              <button
                onClick={handleSupervisoresSave}
                disabled={supervisoresSaving}
                className="px-4 py-2 bg-[#004BCA] hover:bg-[#005cff] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-[0_0_12px_rgba(0,92,255,0.3)] cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{supervisoresSaving ? 'Guardando...' : 'Guardar Asignaciones'}</span>
              </button>
            </div>

            {supervisoresSuccess && (
              <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
                <Check className="w-4.5 h-4.5" />
                <span>¡Asignación de supervisores guardada con éxito!</span>
              </div>
            )}

            {loadingSupervisores ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-8 h-8 text-[#004BCA] animate-spin mb-3" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Consultando supervisores...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supervisoresDisponibles.length === 0 ? (
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">No se encontraron empleados con rol de supervisor o admin.</p>
                ) : (
                  supervisoresDisponibles.map(sup => {
                    const isAssigned = supervisoresAsignados.includes(sup.id);
                    return (
                      <div
                        key={sup.id}
                        onClick={() => toggleSupervisorAssigned(sup.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isAssigned 
                            ? 'border-[#004BCA]/50 bg-[#004BCA]/5 text-white' 
                            : 'border-slate-850 hover:border-slate-750 text-slate-300'
                        }`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-black uppercase">{sup.nombres} {sup.apellidos}</p>
                          <span className="text-[9px] bg-slate-800 text-slate-450 px-2 py-0.5 rounded-md font-bold uppercase mt-1 inline-block">
                            {sup.rol === 'superadmin' ? 'Superadmin' : sup.rol === 'regional_supervisor' ? 'Regional' : 'Tienda'} • {sup.cargo}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isAssigned ? 'bg-[#004BCA] border-[#004BCA]' : 'border-slate-700 bg-transparent'
                        }`}>
                          {isAssigned && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: PERSONAL */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-[#004BCA]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Asesores y Colaboradores en Local</h3>
            </div>

            {loadingPersonal ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-8 h-8 text-[#004BCA] animate-spin mb-3" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando personal de la tienda...</p>
              </div>
            ) : personalTienda.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-2xl">
                <Users className="w-10 h-10 mb-2 text-slate-700" />
                <p className="text-xs font-black uppercase tracking-wider">Sin personal registrado</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Asigne empleados a esta tienda en la sección de Gestión de Personal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-850 rounded-2xl shadow-inner">
                <table className="w-full text-left text-sm border-collapse bg-[#0c1427]/10 text-slate-300">
                  <thead>
                    <tr className="bg-[#050b18]/65 border-b border-slate-850 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                      <th className="p-4">Colaborador</th>
                      <th className="p-4">Cédula</th>
                      <th className="p-4">Cargo</th>
                      <th className="p-4">Rol</th>
                      <th className="p-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalTienda.map((emp) => (
                      <tr key={emp.id} className="border-b border-slate-850/60 hover:bg-slate-800/10 text-xs">
                        <td className="p-4 font-black uppercase text-white">{emp.nombres} {emp.apellidos}</td>
                        <td className="p-4 font-mono font-bold text-slate-400">{emp.cedula}</td>
                        <td className="p-4 font-semibold text-slate-350">{emp.cargo}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md font-bold uppercase text-[9px]">
                            {emp.rol}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            emp.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {emp.activo ? 'Activo' : 'De Baja'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 4: HORARIOS */}
        {activeTab === 'horarios' && (
          <div className="space-y-6 text-center py-8">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-slate-850/50 border border-slate-800 rounded-3xl w-16 h-16 flex items-center justify-center mx-auto text-[#004BCA]">
                <Calendar className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">Módulo de Horarios de la Tienda</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Este módulo le permitirá estructurar, revisar y publicar los turnos semanales de los asesores en esta tienda, así como calcular horas extras y días libres automáticos.
              </p>
              <div className="inline-block px-4 py-2 bg-slate-850/50 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Próxima Fase Integrada • store_id: {tienda.id.substring(0,8)}...
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: METAS */}
        {activeTab === 'metas' && (
          <div className="space-y-6 text-center py-8">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-slate-850/50 border border-slate-800 rounded-3xl w-16 h-16 flex items-center justify-center mx-auto text-[#004BCA]">
                <Target className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">Módulo de Metas Comerciales</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Este módulo le permitirá asignar las metas globales de ventas de este local, configurar presupuestos diarios para cada asesor de ventas y verificar el cumplimiento comercial diario en tiempo real.
              </p>
              <div className="inline-block px-4 py-2 bg-slate-850/50 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Próxima Fase Integrada • store_id: {tienda.id.substring(0,8)}...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ELIMINAR TIENDA (CONFIRMACIÓN DE SEGURIDAD) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0c1427] border border-slate-800 rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Confirmación de Seguridad
                </h3>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-slate-350 leading-relaxed">
                ¿Está seguro de que desea eliminar permanentemente la tienda <strong className="text-white">"{tienda.nombre}"</strong>?
              </p>

              <div className="p-3 bg-red-500/5 border border-red-550/15 text-red-400 rounded-xl text-[10px] md:text-xs leading-normal">
                <strong className="block text-red-355 uppercase tracking-widest font-black text-[9px] mb-1">⚠️ ¡ATENCIÓN!</strong>
                Esta acción eliminará de forma irreversible el local, todas sus estadísticas de venta asociadas y desvinculará a los empleados asignados. Esta acción no se puede deshacer.
              </div>

              {deleteError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold text-center">
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-2">
                  Escriba el nombre del local para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={tienda.nombre}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-red-550 focus:ring-2 focus:ring-red-500/10 transition-all animate-pulse-slow"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-900/35 border-t border-slate-800/80 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmName.trim().toLowerCase() !== tienda.nombre.trim().toLowerCase() || deleting}
                onClick={handleDeleteStore}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
                  deleteConfirmName.trim().toLowerCase() === tienda.nombre.trim().toLowerCase() && !deleting
                    ? 'bg-red-600 hover:bg-red-550 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                }`}
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar local</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
