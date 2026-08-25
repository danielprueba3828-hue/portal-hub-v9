import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTiendaStore } from '../store/tiendaStore';
import { supabase } from '../lib/supabaseClient';
import {
  ClipboardCheck,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  X,
  Plus,
  Settings,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';

const NINE_BOX_CLASSES = {
  'Alto/Alto': { label: 'Alto Potencial / Alto Desempeño (Superestrella)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  'Alto/Medio': { label: 'Alto Potencial / Medio Desempeño (Estrella en Ascenso)', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  'Alto/Bajo': { label: 'Alto Potencial / Bajo Desempeño (Enigma)', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  'Medio/Alto': { label: 'Medio Potencial / Alto Desempeño (Alto Potencial)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  'Medio/Medio': { label: 'Medio Potencial / Medio Desempeño (Talento Clave)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  'Medio/Bajo': { label: 'Medio Potencial / Bajo Desempeño (Dilema)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  'Bajo/Alto': { label: 'Bajo Potencial / Alto Desempeño (Estrella Funcional)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  'Bajo/Medio': { label: 'Bajo Potencial / Medio Desempeño (Eficaz)', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  'Bajo/Bajo': { label: 'Bajo Potencial / Bajo Desempeño (En Riesgo)', color: 'bg-red-500/10 text-red-400 border-red-500/30' }
};

export default function EvaluacionesAdmin() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tiendaSeleccionada } = useTiendaStore();
  const rol = user?.user_metadata?.rol || 'empleado';
  const cargo = user?.user_metadata?.cargo || 'Asesor de Ventas';
  const userCedula = user?.user_metadata?.cedula;

  const isTercero = cargo && (cargo.toLowerCase().includes('tercer') || cargo === 'Tercero a bordo');
  const esJefe = rol === 'admin' || rol === 'supervisor' || rol === 'superadmin' || isTercero || 
    (cargo && (cargo.toLowerCase().includes('jefe') || cargo.toLowerCase().includes('subjefe')));

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('Todos');
  const [filtroCuadrante, setFiltroCuadrante] = useState('Todos');
  const [selectedEval, setSelectedEval] = useState(null);
  const [empleadosMap, setEmpleadosMap] = useState({});

  const { theme: activeTheme } = useThemeStore();
  const employeeTheme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '', user?.user_metadata?.cargo_anterior || '');
  const tc = getThemeClasses(activeTheme, employeeTheme);

  // Obtener lista de períodos disponibles
  const periodos = ['Todos', ...new Set(evaluaciones.map(e => e.periodo))];

  // Fetch de empleados de la tienda para mapear nombres
  const fetchEmpleados = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('empleados').select('cedula, nombres, apellidos, cargo');
      if (!error && data) {
        const map = {};
        data.forEach(emp => {
          map[emp.cedula] = {
            nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
            cargo: emp.cargo
          };
        });
        setEmpleadosMap(map);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEvaluaciones = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('evaluaciones_ninebox').select('*');
      
      // Si no es jefe, solo puede ver sus propias evaluaciones
      if (!esJefe) {
        query = query.eq('evaluado_cedula', userCedula);
      } else if (tiendaSeleccionada) {
        // En un entorno real, las evaluaciones tienen tienda_id
        // Si no lo tienen, las filtramos por la tienda del colaborador
        // En mock se inyecta tienda_id directamente
        query = query.eq('tienda_id', tiendaSeleccionada.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        setEvaluaciones(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [esJefe, userCedula, tiendaSeleccionada]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmpleados().then(fetchEvaluaciones);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEmpleados, fetchEvaluaciones]);

  const handleRefresh = () => {
    fetchEvaluaciones();
  };

  const getQuadrantInfo = (pot, des) => {
    const key = `${pot}/${des}`;
    return NINE_BOX_CLASSES[key] || { label: 'Sin Definir', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
  };

  const filteredEvaluaciones = evaluaciones.filter(item => {
    const evaluado = empleadosMap[item.evaluado_cedula] || { nombreCompleto: '', cargo: '' };
    const matchesBusqueda = isNaN(busqueda)
      ? evaluado.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) || (item.motivo && item.motivo.toLowerCase().includes(busqueda.toLowerCase()))
      : item.evaluado_cedula.includes(busqueda);
    const matchesPeriodo = filtroPeriodo === 'Todos' || item.periodo === filtroPeriodo;
    const matchesCuadrante = filtroCuadrante === 'Todos' || `${item.potencial}/${item.desempeno}` === filtroCuadrante;
    return matchesBusqueda && matchesPeriodo && matchesCuadrante;
  });

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${tc.mainBg}`} style={tc.mainBgStyle}>
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3 font-title uppercase">
              <ClipboardCheck className="w-8 h-8 text-orange-500" />
              Matriz Nine Box & Evaluaciones
            </h1>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
              V8 Edition
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {esJefe 
              ? `Monitoreo de potencial, desempeño y planes de desarrollo en local ${tiendaSeleccionada?.nombre || ''}`
              : 'Consulta tus retroalimentaciones, metas de desarrollo y planes de acción.'}
          </p>
        </div>
        
        {esJefe && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/evaluaciones/config')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-semibold"
            >
              <Settings className="w-4 h-4" />
              Configurar Preguntas
            </button>
            <button
              onClick={() => navigate('/evaluaciones/nueva')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </button>
          </div>
        )}
      </div>

      {/* Controles de Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        {esJefe && (
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por colaborador o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Período:</span>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:border-orange-500 focus:outline-none transition-colors"
            >
              {periodos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cuadrante:</span>
            <select
              value={filtroCuadrante}
              onChange={(e) => setFiltroCuadrante(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:border-orange-500 focus:outline-none transition-colors"
            >
              <option value="Todos">Todos los cuadrantes</option>
              {Object.keys(NINE_BOX_CLASSES).map(key => (
                <option key={key} value={key}>{NINE_BOX_CLASSES[key].label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition-colors ml-auto"
            title="Refrescar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de Evaluaciones */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-slate-400 text-sm">Cargando evaluaciones...</p>
        </div>
      ) : filteredEvaluaciones.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No se encontraron evaluaciones</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {esJefe 
              ? 'No hay registros de evaluación que coincidan con la búsqueda. Puedes iniciar una nueva evaluación utilizando el botón superior.'
              : 'Aún no se han registrado evaluaciones en tu historial.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvaluaciones.map(item => {
            const evaluado = empleadosMap[item.evaluado_cedula] || { nombreCompleto: 'Colaborador', cargo: 'Asesor' };
            const qInfo = getQuadrantInfo(item.potencial, item.desempeno);
            const initials = evaluado.nombreCompleto
              .split(' ')
              .map(n => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
            const tempTheme = getEmployeeTheme(evaluado.cargo, evaluado.nombreCompleto);

            return (
              <div 
                key={item.id}
                onClick={() => setSelectedEval(item)}
                className="bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-md shadow-slate-950/20 group"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white ${tempTheme === 'rojo' ? 'bg-red-500' : tempTheme === 'esmeralda' ? 'bg-teal-500' : tempTheme === 'ambar' ? 'bg-amber-500' : tempTheme === 'rosa' ? 'bg-pink-500' : tempTheme === 'azul' ? 'bg-blue-600' : 'bg-slate-600'}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate group-hover:text-orange-400 transition-colors">
                      {evaluado.nombreCompleto}
                    </h3>
                    <p className="text-slate-400 text-xs truncate">{evaluado.cargo}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mb-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.fecha}
                    </span>
                    <span className="text-slate-400 font-semibold px-2 py-0.5 bg-slate-950 rounded-full">
                      {item.periodo}
                    </span>
                  </div>
                  {item.motivo && (
                    <div className="text-slate-300 text-xs bg-slate-950/50 p-2 rounded border border-slate-800/50 truncate">
                      <strong className="text-slate-500">Motivo:</strong> {item.motivo}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cuadrante Nine Box:</span>
                  <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${qInfo.color} truncate`}>
                    {qInfo.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle */}
      {selectedEval && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50 sticky top-0 backdrop-blur">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Reporte de Retroalimentación Nine Box
              </h2>
              <button 
                onClick={() => setSelectedEval(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 space-y-6">
              {/* Bloque Info General */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/50 p-4 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Colaborador</span>
                  <strong className="text-white text-sm">
                    {empleadosMap[selectedEval.evaluado_cedula]?.nombreCompleto || 'Cargando...'}
                  </strong>
                  <span className="text-xs text-slate-400 block">
                    Cargo: {empleadosMap[selectedEval.evaluado_cedula]?.cargo || ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Evaluador (Jefe)</span>
                  <strong className="text-white text-sm">
                    {empleadosMap[selectedEval.evaluador_cedula]?.nombreCompleto || 'Cargando...'}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Fecha y Período</span>
                  <strong className="text-white text-sm block">{selectedEval.fecha}</strong>
                  <span className="text-xs text-orange-400">{selectedEval.periodo}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Motivo</span>
                  <strong className="text-white text-sm block truncate">{selectedEval.motivo || 'N/A'}</strong>
                </div>
              </div>

              {/* Seccion 1: Criterios de Desempeño */}
              <div>
                <h3 className="text-white font-bold border-b border-slate-850 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">1</span>
                  Criterios de Desempeño
                </h3>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <th className="p-4">Criterio de Evaluación</th>
                        <th className="p-4 text-center w-32">Autoevaluado</th>
                        <th className="p-4 text-center w-32">Evaluador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {selectedEval.respuestas_desempeno && selectedEval.respuestas_desempeno.map((resp, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/20 text-slate-200">
                          <td className="p-4 font-medium">{resp.pregunta}</td>
                          <td className="p-4 text-center font-bold text-orange-400 bg-orange-500/[0.02]">
                            {resp.evaluado} / 5
                          </td>
                          <td className="p-4 text-center font-bold text-emerald-400 bg-emerald-500/[0.02]">
                            {resp.evaluador} / 5
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedEval.observaciones_desempeno && (
                  <div className="mt-3 p-3 bg-slate-950/40 border border-slate-850 rounded-lg text-xs text-slate-300">
                    <strong className="text-slate-400 block mb-1">Observaciones de Desempeño:</strong>
                    {selectedEval.observaciones_desempeno}
                  </div>
                )}
              </div>

              {/* Seccion 2: Preguntas Poderosas (Conocimientos) */}
              <div>
                <h3 className="text-white font-bold border-b border-slate-850 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">2</span>
                  Evaluación de Conocimientos y Ejecución (Preguntas Poderosas)
                </h3>
                <div className="space-y-4">
                  {selectedEval.respuestas_conocimientos && selectedEval.respuestas_conocimientos.map((resp, idx) => (
                    <div key={idx} className="bg-slate-950/30 border border-slate-850 rounded-xl p-4 space-y-3">
                      <h4 className="font-semibold text-white text-sm border-b border-slate-900 pb-1.5">
                        {resp.pregunta}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Respuesta del Evaluado:</span>
                          <p className="text-slate-300 text-xs italic">"{resp.evaluado || 'Sin respuesta.'}"</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Comentario del Evaluador:</span>
                          <p className="text-slate-300 text-xs italic">"{resp.evaluador || 'Sin comentario.'}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedEval.observaciones_conocimientos && (
                  <div className="mt-3 p-3 bg-slate-950/40 border border-slate-850 rounded-lg text-xs text-slate-300">
                    <strong className="text-slate-400 block mb-1">Observaciones de Conocimientos:</strong>
                    {selectedEval.observaciones_conocimientos}
                  </div>
                )}
              </div>

              {/* Seccion 3: Nine Box Matrix & Plan de Accion */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-bold border-b border-slate-850 pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">3</span>
                    Ubicación Matriz Nine Box
                  </h3>
                  
                  {/* Grid 3x3 */}
                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 flex flex-col items-center">
                    <div className="grid grid-cols-4 gap-1 w-full max-w-[340px]">
                      {/* Eje Y (Potencial) */}
                      <div className="flex flex-col justify-around text-right text-[10px] font-bold text-slate-500 pr-2">
                        <span>POTENCIAL<br/>ALTO</span>
                        <span>POTENCIAL<br/>MEDIO</span>
                        <span>POTENCIAL<br/>BAJO</span>
                      </div>
                      
                      {/* Cajas 3x3 */}
                      <div className="col-span-3 grid grid-cols-3 gap-1 aspect-square">
                        {['Alto', 'Medio', 'Bajo'].map(pot => (
                          <Fragment key={pot}>
                            {['Bajo', 'Medio', 'Alto'].map(des => {
                              const isSelected = selectedEval.potencial === pot && selectedEval.desempeno === des;
                              let label = '';
                              if (pot === 'Alto' && des === 'Alto') label = 'Superestrella';
                              else if (pot === 'Alto' && des === 'Medio') label = 'Estrella Asc.';
                              else if (pot === 'Alto' && des === 'Bajo') label = 'Enigma';
                              else if (pot === 'Medio' && des === 'Alto') label = 'Alto Pot.';
                              else if (pot === 'Medio' && des === 'Medio') label = 'Clave';
                              else if (pot === 'Medio' && des === 'Bajo') label = 'Dilema';
                              else if (pot === 'Bajo' && des === 'Alto') label = 'Funcional';
                              else if (pot === 'Bajo' && des === 'Medio') label = 'Eficaz';
                              else if (pot === 'Bajo' && des === 'Bajo') label = 'En Riesgo';

                              return (
                                <div
                                  key={des}
                                  className={`border flex flex-col items-center justify-center text-[8px] font-bold rounded p-1 text-center transition-all duration-300 ${
                                    isSelected
                                      ? 'bg-orange-500 border-orange-400 text-white scale-105 shadow-md shadow-orange-500/20'
                                      : 'bg-slate-900 border-slate-800 text-slate-500'
                                  }`}
                                >
                                  {label}
                                </div>
                              );
                            })}
                          </Fragment>
                        ))}
                      </div>
                      
                      {/* Eje X (Desempeño) */}
                      <div></div>
                      <div className="col-span-3 grid grid-cols-3 text-center text-[10px] font-bold text-slate-500 mt-2">
                        <span>DESEMPEÑO<br/>BAJO</span>
                        <span>DESEMPEÑO<br/>MEDIO</span>
                        <span>DESEMPEÑO<br/>ALTO</span>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <span className="text-slate-400 text-xs font-semibold block mb-1">Cuadrante Seleccionado:</span>
                      <span className="inline-block text-xs font-bold px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">
                        {getQuadrantInfo(selectedEval.potencial, selectedEval.desempeno).label}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold border-b border-slate-850 pb-2 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">4</span>
                    Plan de Acción y Compromisos
                  </h3>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 min-h-[180px] text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedEval.plan_accion ? (
                      selectedEval.plan_accion
                    ) : (
                      <span className="text-slate-500 italic">No se registró un plan de acción para esta evaluación.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end">
              <button
                onClick={() => setSelectedEval(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
