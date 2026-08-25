import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTiendaStore } from '../store/tiendaStore';
import { useAuthStore } from '../store/authStore';
import { 
  Store, 
  Search, 
  ArrowRight, 
  Loader, 
  Plus, 
  Edit2, 
  X, 
  Settings,
  MapPin,
  Sliders,
  Tag,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function SelectorTienda() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    tiendas, 
    loading, 
    error, 
    fetchTiendas, 
    seleccionarTienda, 
    crearTienda, 
    editarTienda,
    borrarTienda
  } = useTiendaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [conceptFilter, setConceptFilter] = useState('todos');
  const [cityFilter, setCityFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('activas'); // 'activas' | 'inactivas' | 'todas'
  const [adminMode, setAdminMode] = useState(false);

  // Estados para Modal de Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null); // null para Crear, objeto tienda para Editar
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
  const [formError, setFormError] = useState('');

  // Estados para Modal de Confirmación de Borrado
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleOpenDeleteModal = (e, tienda) => {
    e.stopPropagation(); // Evitar seleccionar la tienda
    setStoreToDelete(tienda);
    setDeleteConfirmName('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    if (deleteConfirmName.trim().toLowerCase() !== storeToDelete.nombre.trim().toLowerCase()) {
      setDeleteError('El nombre ingresado no coincide con el nombre de la tienda.');
      return;
    }

    setDeleting(true);
    setDeleteError('');
    const success = await borrarTienda(storeToDelete.id);
    setDeleting(false);

    if (success) {
      setIsDeleteModalOpen(false);
      setStoreToDelete(null);
      fetchTiendas(user);
    } else {
      setDeleteError('Ocurrió un error al intentar eliminar el local de la base de datos.');
    }
  };

  const rol = user?.user_metadata?.rol || 'empleado';
  const isAuthorizedToAdmin = rol === 'superadmin' || rol === 'regional_supervisor' || rol === 'admin';

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Solo permitir Supervisor, Admin, Regional Supervisor y Superadmin
    if (rol !== 'supervisor' && rol !== 'admin' && rol !== 'superadmin' && rol !== 'regional_supervisor' && rol !== 'store_supervisor') {
      navigate('/', { replace: true });
      return;
    }

    fetchTiendas(user);
  }, [user, fetchTiendas, navigate, rol]);

  const handleSelectTienda = (tienda) => {
    if (adminMode) {
      // En modo administración, hacer clic en la tarjeta redirige al detalle de la tienda
      navigate(`/tienda/${tienda.id}`);
    } else {
      seleccionarTienda(tienda);
      navigate('/', { replace: true });
    }
  };

  // Abrir modal para Crear
  const handleOpenCreateModal = () => {
    setEditingStore(null);
    setFormData({
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
    setFormError('');
    setIsModalOpen(true);
  };

  // Abrir modal para Editar
  const handleOpenEditModal = (e, tienda) => {
    e.stopPropagation(); // Evitar disparar handleSelectTienda
    setEditingStore(tienda);
    setFormData({
      nombre: tienda.nombre || '',
      concepto: tienda.concepto || 'marathon sports',
      ciudad: tienda.ciudad || 'Quito',
      mall: tienda.mall || '',
      province: tienda.province || 'Pichincha',
      address: tienda.address || '',
      phone: tienda.phone || '',
      email: tienda.email || '',
      activo: tienda.activo !== false,
      logo: tienda.logo || '',
      cover_image: tienda.cover_image || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Enviar formulario
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nombre.trim()) {
      setFormError('El nombre de la tienda es obligatorio.');
      return;
    }

    let result;
    if (editingStore) {
      result = await editarTienda(editingStore.id, formData);
    } else {
      result = await crearTienda(formData);
    }

    if (result) {
      setIsModalOpen(false);
      // Recargar tiendas
      fetchTiendas(user);
    } else {
      setFormError('Ocurrió un error al guardar los datos de la tienda. Asegúrese de que el nombre sea único.');
    }
  };

  // Extraer ciudades únicas para filtro
  const ciudadesDisponibles = ['todos', ...new Set(tiendas.map(t => t.ciudad).filter(Boolean))];

  // Filtrar tiendas
  const filteredTiendas = tiendas.filter((tienda) => {
    const matchesSearch = 
      tienda.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (tienda.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tienda.mall || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesConcept = conceptFilter === 'todos' || 
      tienda.concepto.toLowerCase() === conceptFilter.toLowerCase();

    const matchesCity = cityFilter === 'todos' ||
      tienda.ciudad.toLowerCase() === cityFilter.toLowerCase();

    const matchesStatus = 
      statusFilter === 'todas' || 
      (statusFilter === 'activas' && tienda.activo !== false) ||
      (statusFilter === 'inactivas' && tienda.activo === false);
    
    return matchesSearch && matchesConcept && matchesCity && matchesStatus;
  });

  const conceptos = [
    { key: 'todos', label: 'Ver Todas', color: 'bg-slate-700/50 hover:bg-slate-700 text-slate-200' },
    { key: 'marathon sports', label: 'Marathon Sports', color: 'bg-blue-650/40 border border-blue-500/35 hover:bg-blue-600 text-blue-200' },
    { key: 'marathons outlets', label: 'Marathon Outlet', color: 'bg-cyan-650/40 border border-cyan-500/35 hover:bg-cyan-600 text-cyan-200' },
    { key: 'taff', label: 'Taff', color: 'bg-teal-650/40 border border-teal-500/35 hover:bg-teal-600 text-teal-200' },
    { key: 'explorer', label: 'Explorer', color: 'bg-orange-650/40 border border-orange-500/35 hover:bg-orange-600 text-orange-200' },
    { key: 'explorer outlet', label: 'Explorer Outlet', color: 'bg-yellow-650/40 border border-yellow-500/35 hover:bg-yellow-600 text-yellow-200' },
    { key: 'teleshop', label: 'Teleshop', color: 'bg-purple-650/40 border border-purple-500/35 hover:bg-purple-600 text-purple-200' },
    { key: 'bodegas deportivas', label: 'Bodegas Deportivas', color: 'bg-indigo-650/40 border border-indigo-500/35 hover:bg-indigo-600 text-indigo-200' },
    { key: 'cikla', label: 'Cikla', color: 'bg-green-650/40 border border-green-500/35 hover:bg-green-600 text-green-200' }
  ];

  const getConceptBadgeStyles = (concepto) => {
    switch (concepto?.toLowerCase()) {
      case 'marathon sports':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'marathons outlets':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'taff':
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      case 'explorer':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'explorer outlet':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'teleshop':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'bodegas deportivas':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'cikla':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#020D20] via-[#081229] to-[#010816] px-4 py-8 relative overflow-hidden font-sans text-slate-200">
      {/* Orbes decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#004BCA]/8 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#E30613]/5 blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col z-10 relative">
        {/* Cabecera */}
        <div className="text-center md:text-left mb-6 md:flex md:items-center md:justify-between border-b border-slate-800/60 pb-6">
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
              <div className="p-2 bg-[#004BCA]/20 border border-[#004BCA]/30 rounded-xl">
                <Store className="w-6 h-6 text-[#005cff]" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-wider uppercase">
                {adminMode ? 'Administración de Locales' : 'Panel de Locales'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              {adminMode ? 'Configure e ingrese detalles de cada punto de venta' : 'Seleccione la tienda que desea gestionar hoy'}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center gap-3">
            {isAuthorizedToAdmin && (
              <button
                onClick={() => {
                  setAdminMode(!adminMode);
                  // Si salimos de admin, quitar filtros de inactivos
                  if (adminMode) setStatusFilter('activas');
                }}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 border cursor-pointer ${
                  adminMode 
                    ? 'bg-amber-600 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:bg-amber-500' 
                    : 'bg-slate-800/65 border-slate-700 text-slate-350 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span>{adminMode ? 'Salir de Edición' : 'Administrar Locales'}</span>
              </button>
            )}

            {adminMode && (rol === 'superadmin') && (
              <button
                onClick={handleOpenCreateModal}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#004BCA] hover:bg-[#005cff] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 shadow-[0_0_12px_rgba(0,92,255,0.4)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Tienda</span>
              </button>
            )}

            <div className="text-center sm:text-right text-[10px] bg-slate-800/40 border border-slate-700/45 p-2.5 rounded-xl backdrop-blur-md min-w-[150px]">
              <span className="text-slate-450 block font-bold uppercase tracking-wider">Usuario Activo</span>
              <span className="text-white font-extrabold block truncate">{user?.user_metadata?.nombres}</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#0b1328]/40 border border-slate-850/80 p-5 rounded-3xl mb-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Buscador */}
            <div className="md:col-span-5 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar tienda por nombre, centro comercial o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs placeholder-slate-500 outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all font-semibold"
              />
            </div>

            {/* Filtro de Ciudades */}
            <div className="md:col-span-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] transition-all"
              >
                <option value="todos">Todas las Ciudades</option>
                {ciudadesDisponibles.filter(c => c !== 'todos').map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Estados (Admin únicamente) */}
            {adminMode && (
              <div className="md:col-span-4 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] transition-all"
                >
                  <option value="activas">Solo Tiendas Activas</option>
                  <option value="inactivas">Solo Tiendas Inactivas</option>
                  <option value="todas">Todos los Estados</option>
                </select>
              </div>
            )}
          </div>

          {/* Filtros rápidos de concepto */}
          <div className="flex flex-wrap gap-2 items-center justify-start overflow-x-auto pb-1 max-w-full">
            <div className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 mr-2 flex-shrink-0">
              <Tag className="w-3.5 h-3.5" />
              <span>Concepto / Marca:</span>
            </div>
            {conceptos.map((concept) => (
              <button
                key={concept.key}
                onClick={() => setConceptFilter(concept.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all duration-200 cursor-pointer ${
                  conceptFilter === concept.key
                    ? 'bg-[#004BCA] text-white shadow-[0_0_12px_rgba(0,75,202,0.4)] scale-105 border border-transparent'
                    : concept.color
                }`}
              >
                {concept.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de Tiendas */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <Loader className="w-10 h-10 text-[#004BCA] animate-spin mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando base de locales...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-center">
            <span>Error: {error}</span>
          </div>
        ) : filteredTiendas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-850 rounded-3xl bg-[#0c1427]/15">
            <Store className="w-16 h-16 mb-4 text-slate-700" />
            <p className="text-sm font-bold uppercase tracking-wider mb-1">No se encontraron locales</p>
            <p className="text-xs font-semibold">Intente reajustar los filtros de búsqueda o de conceptos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTiendas.map((tienda) => (
              <div
                key={tienda.id}
                onClick={() => handleSelectTienda(tienda)}
                className={`group cursor-pointer bg-[#0c1427]/40 backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)] flex flex-col justify-between h-56 relative overflow-hidden ${
                  tienda.activo === false 
                    ? 'border-slate-800 opacity-60 hover:opacity-85' 
                    : 'border-slate-850 hover:border-[#004BCA]/50 hover:bg-[#004BCA]/5'
                }`}
              >
                {/* Fondo decorativo */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#004BCA]/5 rounded-full blur-2xl group-hover:bg-[#004BCA]/15 transition-all duration-300"></div>

                <div className="space-y-4 z-10">
                  {/* Badge de Concepto y Estado */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getConceptBadgeStyles(tienda.concepto)}`}>
                      {tienda.concepto}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {tienda.activo === false && (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[8px] font-black uppercase">
                          Inactivo
                        </span>
                      )}
                      <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">
                        {tienda.ciudad}
                      </span>
                    </div>
                  </div>

                  {/* Nombre y Centro comercial */}
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-[#005cff] transition-colors leading-tight mb-1">
                      {tienda.nombre}
                    </h3>
                    {tienda.mall && (
                      <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center space-x-1">
                        <Store className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{tienda.mall}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Pie de tarjeta */}
                <div className="flex items-center justify-between border-t border-slate-850/60 pt-4 mt-4 z-10">
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-widest">
                    {adminMode ? 'Configurar Tienda' : 'Ingresar a tienda'}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {adminMode && (rol === 'superadmin' || rol === 'regional_supervisor') && (
                      <button
                        onClick={(e) => handleOpenEditModal(e, tienda)}
                        title="Editar Datos"
                        className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-amber-600 hover:border-amber-500 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {adminMode && rol === 'superadmin' && (
                      <button
                        onClick={(e) => handleOpenDeleteModal(e, tienda)}
                        title="Eliminar Tienda"
                        className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-red-650 hover:border-red-500 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="p-1.5 bg-slate-800/80 group-hover:bg-[#004BCA] rounded-xl text-slate-450 group-hover:text-white transition-all transform group-hover:translate-x-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR TIENDA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0c1427] border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#004BCA]/20 border border-[#004BCA]/30 rounded-xl">
                  <Store className="w-5 h-5 text-[#005cff]" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {editingStore ? 'Editar Tienda' : 'Agregar Nueva Tienda'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Nombre de la Tienda *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Marathon Sports Portal"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* Marca / Concepto */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Marca / Concepto</label>
                  <select
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] transition-all"
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

                {/* Ciudad */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Ej. Quito"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* Centro Comercial */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Centro Comercial (Mall)</label>
                  <input
                    type="text"
                    value={formData.mall}
                    onChange={(e) => setFormData({ ...formData, mall: e.target.value })}
                    placeholder="Ej. Portal Shopping"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* Provincia */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Provincia</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Ej. Pichincha"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Teléfono de la Tienda</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej. 02-3824400"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Correo Electrónico Oficial</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ej. sports.portal@marathon.com.ec"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* Dirección física */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Dirección Completa</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, número, oficina/local..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none resize-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* URL del logotipo */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">URL del Logotipo</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* URL de la Portada */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">URL de la Portada</label>
                  <input
                    type="text"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="https://ejemplo.com/portada.png"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-[#050b18]/65 text-slate-200 text-xs font-semibold outline-none focus:border-[#004BCA] focus:ring-2 focus:ring-[#004BCA]/15 transition-all"
                  />
                </div>

                {/* Estado Activo */}
                <div className="flex items-center space-x-3 pt-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-800 bg-[#050b18]/65 text-[#004BCA] focus:ring-0 focus:ring-offset-0"
                  />
                  <label htmlFor="activo" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                    Punto de venta activo (las tiendas inactivas no son visibles para empleados)
                  </label>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#004BCA] hover:bg-[#005cff] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,92,255,0.3)] cursor-pointer"
                >
                  {editingStore ? 'Actualizar Tienda' : 'Guardar Tienda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL ELIMINAR TIENDA (CONFIRMACIÓN DE SEGURIDAD) */}
      {isDeleteModalOpen && storeToDelete && (
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
                ¿Está seguro de que desea eliminar permanentemente la tienda <strong className="text-white">"{storeToDelete.nombre}"</strong>?
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
                  placeholder={storeToDelete.nombre}
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
                disabled={deleteConfirmName.trim().toLowerCase() !== storeToDelete.nombre.trim().toLowerCase() || deleting}
                onClick={handleDeleteStore}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
                  deleteConfirmName.trim().toLowerCase() === storeToDelete.nombre.trim().toLowerCase() && !deleting
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
