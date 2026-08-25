import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Trash,
  Settings,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';

export default function EvaluacionConfig() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cargo = user?.user_metadata?.cargo || 'Asesor de Ventas';

  const { theme: activeTheme } = useThemeStore();
  const employeeTheme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '', user?.user_metadata?.cargo_anterior || '');
  const tc = getThemeClasses(activeTheme, employeeTheme);

  // Estados
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estado para nueva pregunta
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevaSeccion, setNuevaSeccion] = useState('desempeno');
  const [guardando, setGuardando] = useState(false);

  const fetchPreguntas = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('preguntas_ninebox')
        .select('*')
        .order('seccion', { ascending: true })
        .order('created_at', { ascending: true });
      if (!error && data) {
        setPreguntas(data);
      } else if (error) {
        setError(error.message);
      }
    } catch (e) {
      setError('Error al conectar con la base de datos.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreguntas();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!nuevaPregunta.trim()) return;

    setGuardando(true);
    setError(null);
    setSuccess(null);

    const payload = {
      pregunta: nuevaPregunta.trim(),
      seccion: nuevaSeccion,
      active: true
    };

    try {
      const { error } = await supabase
        .from('preguntas_ninebox')
        .insert(payload);

      if (!error) {
        setNuevaPregunta('');
        setSuccess('Pregunta agregada con éxito.');
        fetchPreguntas();
      } else {
        setError(error.message);
      }
    } catch (e) {
      setError('Error al agregar la pregunta.');
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase
        .from('preguntas_ninebox')
        .update({ active: !currentActive })
        .eq('id', id);

      if (!error) {
        setSuccess('Estado de la pregunta actualizado.');
        fetchPreguntas();
      } else {
        setError(error.message);
      }
    } catch (e) {
      setError('Error al actualizar la pregunta.');
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta pregunta? Esto podría romper reportes antiguos si la pregunta ya fue usada.')) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase
        .from('preguntas_ninebox')
        .delete()
        .eq('id', id);

      if (!error) {
        setSuccess('Pregunta eliminada con éxito.');
        fetchPreguntas();
      } else {
        setError(error.message);
      }
    } catch (e) {
      setError('Error al eliminar la pregunta.');
      console.error(e);
    }
  };

  // Dividir preguntas por sección
  const preguntasDesempeno = preguntas.filter(p => p.seccion === 'desempeno');
  const preguntasConocimientos = preguntas.filter(p => p.seccion === 'conocimientos');

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${tc.mainBg}`} style={tc.mainBgStyle}>
      {/* Botón Volver */}
      <button
        onClick={() => navigate('/evaluaciones')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-semibold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Evaluaciones
      </button>

      {/* Título */}
      <div className="border-b border-slate-800 pb-6 mb-6">
        <h1 className="text-3xl font-title font-black text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-orange-500" />
          Configuración de Preguntas Nine Box
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Administra las preguntas y criterios de evaluación dinámicos disponibles en el formulario.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Error:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Operación exitosa:</strong>
            <p className="mt-0.5">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Agregar Pregunta */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit space-y-4">
          <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
            <Plus className="w-5 h-5 text-orange-500" />
            Nueva Pregunta / Criterio
          </h3>
          
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pregunta o Criterio:</label>
              <textarea
                rows="3"
                placeholder="Escribe aquí la pregunta o el nombre del criterio de evaluación..."
                value={nuevaPregunta}
                onChange={(e) => setNuevaPregunta(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-orange-500 focus:outline-none transition-colors placeholder:text-slate-600 font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sección del Formulario:</label>
              <select
                value={nuevaSeccion}
                onChange={(e) => setNuevaSeccion(e.target.value)}
                required
                className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg p-2.5 focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="desempeno">Criterios de Desempeño (Escala 1-5)</option>
                <option value="conocimientos">Preguntas Poderosas (Respuesta abierta)</option>
              </select>
            </div>

            <div className="bg-slate-950/50 border border-slate-850 rounded-lg p-3 text-[10px] text-slate-500 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <span>
                Las preguntas de <strong>Desempeño</strong> se calificarán numéricamente de 1 a 5. Las <strong>Preguntas Poderosas</strong> recibirán comentarios y compromisos en formato de texto libre.
              </span>
            </div>

            <button
              type="submit"
              disabled={guardando || !nuevaPregunta.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Agregar Pregunta
                </>
              )}
            </button>
          </form>
        </div>

        {/* Columna 2 & 3: Lista de Preguntas */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
              <span className="text-slate-400 text-sm">Cargando listado...</span>
            </div>
          ) : (
            <>
              {/* Sección Desempeño */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">1</span>
                  Criterios de Desempeño (Escala 1-5)
                </h3>

                {preguntasDesempeno.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No hay preguntas registradas en esta sección.</p>
                ) : (
                  <div className="space-y-3">
                    {preguntasDesempeno.map(p => (
                      <div
                        key={p.id}
                        className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${p.active ? 'text-slate-200 font-medium' : 'text-slate-500 line-through'}`}>
                            {p.pregunta}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => handleToggleActive(p.id, p.active)}
                            className="p-1 hover:bg-slate-800 rounded transition-colors"
                            title={p.active ? 'Desactivar pregunta' : 'Activar pregunta'}
                          >
                            {p.active ? (
                              <ToggleRight className="w-8 h-8 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-600" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded border border-red-500/20 transition-colors"
                            title="Eliminar pregunta"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección Conocimientos */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">2</span>
                  Preguntas Poderosas (Respuestas Abiertas)
                </h3>

                {preguntasConocimientos.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No hay preguntas registradas en esta sección.</p>
                ) : (
                  <div className="space-y-3">
                    {preguntasConocimientos.map(p => (
                      <div
                        key={p.id}
                        className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${p.active ? 'text-slate-200 font-medium' : 'text-slate-500 line-through'}`}>
                            {p.pregunta}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => handleToggleActive(p.id, p.active)}
                            className="p-1 hover:bg-slate-800 rounded transition-colors"
                            title={p.active ? 'Desactivar pregunta' : 'Activar pregunta'}
                          >
                            {p.active ? (
                              <ToggleRight className="w-8 h-8 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-600" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded border border-red-500/20 transition-colors"
                            title="Eliminar pregunta"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
