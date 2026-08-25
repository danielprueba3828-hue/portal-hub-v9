import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useHorarioStore } from '../store/horarioStore';
import { supabase } from '../lib/supabaseClient';
import {
  ClipboardCheck,
  User,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  Info,
  TrendingUp
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';

const NINE_BOX_DESCRIPTIONS = {
  'Alto/Alto': { label: 'Superestrella', desc: 'Alto potencial y alto desempeño. Futuro líder clave. Fomentar su retención y asignarle proyectos de alto impacto.' },
  'Alto/Medio': { label: 'Estrella en Ascenso', desc: 'Alto potencial con desempeño promedio. Desarrollar competencias clave para llevar su desempeño al máximo.' },
  'Alto/Bajo': { label: 'Enigma', desc: 'Alto potencial con bajo desempeño actual. Investigar barreras (motivación, adaptación, problemas técnicos) y ajustar rol.' },
  'Medio/Alto': { label: 'Alto Potencial', desc: 'Potencial moderado con alto desempeño. Mantener motivado y ofrecer retos continuos en su área.' },
  'Medio/Medio': { label: 'Talento Clave', desc: 'Desempeño y potencial promedio. Columna vertebral del equipo. Ofrecer capacitación continua.' },
  'Medio/Bajo': { label: 'Dilema', desc: 'Potencial moderado con bajo desempeño. Establecer plan de mejora de desempeño a corto plazo.' },
  'Bajo/Alto': { label: 'Estrella Funcional', desc: 'Bajo potencial percibido pero alto desempeño. Experto técnico en su puesto actual. Mantener estable y motivado.' },
  'Bajo/Medio': { label: 'Eficaz', desc: 'Bajo potencial con desempeño promedio. Trabajador sólido y consistente. Apoyar su rendimiento estable.' },
  'Bajo/Bajo': { label: 'En Riesgo', desc: 'Bajo potencial y bajo desempeño. Requiere plan urgente de acción o reubicación. Evaluar permanencia.' }
};

export default function EvaluacionNueva() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { empleados, fetchEmpleados } = useHorarioStore();
  const cargo = user?.user_metadata?.cargo || 'Asesor de Ventas';
  const userCedula = user?.user_metadata?.cedula;

  const { theme: activeTheme } = useThemeStore();
  const employeeTheme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '', user?.user_metadata?.cargo_anterior || '');
  const tc = getThemeClasses(activeTheme, employeeTheme);

  // Estados del Formulario
  const [colaboradorCedula, setColaboradorCedula] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [periodo, setPeriodo] = useState('');
  const [motivo, setMotivo] = useState('Retroalimentación Mensual');
  const [observacionesDesempeno, setObservacionesDesempeno] = useState('');
  const [observacionesConocimientos, setObservacionesConocimientos] = useState('');
  const [planAccion, setPlanAccion] = useState('');

  // Matriz Nine Box Y-Axis (Potencial), X-Axis (Desempeño)
  const [potencial, setPotencial] = useState('');
  const [desempeno, setDesempeno] = useState('');

  // Preguntas Dinámicas
  const [preguntasDesempeno, setPreguntasDesempeno] = useState([]);
  const [preguntasConocimientos, setPreguntasConocimientos] = useState([]);
  const [valoresDesempeno, setValoresDesempeno] = useState({}); // {preg_id: {evaluador, evaluado}}
  const [valoresConocimientos, setValoresConocimientos] = useState({}); // {preg_id: {evaluador, evaluado}}

  const [loading, setLoading] = useState(false);
  const [loadingPreguntas, setLoadingPreguntas] = useState(true);
  const [error, setError] = useState(null);

  // Cargar colaboradores y preguntas
  useEffect(() => {
    fetchEmpleados();
    
    const fetchPreguntas = async () => {
      setLoadingPreguntas(true);
      try {
        const { data, error } = await supabase
          .from('preguntas_ninebox')
          .select('*')
          .eq('active', true);
        if (!error && data) {
          const des = data.filter(p => p.seccion === 'desempeno');
          const con = data.filter(p => p.seccion === 'conocimientos');
          setPreguntasDesempeno(des);
          setPreguntasConocimientos(con);

          // Inicializar valores de respuestas
          const valDes = {};
          des.forEach(p => {
            valDes[p.id] = { pregunta: p.pregunta, evaluador: 3, evaluado: 3 };
          });
          setValoresDesempeno(valDes);

          const valCon = {};
          con.forEach(p => {
            valCon[p.id] = { pregunta: p.pregunta, evaluador: '', evaluado: '' };
          });
          setValoresConocimientos(valCon);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPreguntas(false);
      }
    };

    fetchPreguntas();
  }, [fetchEmpleados]);

  // Filtrar empleados activos del local (excluyendo al jefe actual y supervisores)
  const empleadosFiltrados = empleados.filter(emp => 
    emp.activo && 
    emp.cedula !== userCedula && 
    emp.rol !== 'supervisor' &&
    emp.rol !== 'superadmin'
  );

  // Manejo de puntuación en Desempeño
  const handleScoreChange = (pregId, role, score) => {
    setValoresDesempeno(prev => ({
      ...prev,
      [pregId]: {
        ...prev[pregId],
        [role]: score
      }
    }));
  };

  // Manejo de comentarios en Preguntas Poderosas
  const handleTextChange = (pregId, role, text) => {
    setValoresConocimientos(prev => ({
      ...prev,
      [pregId]: {
        ...prev[pregId],
        [role]: text
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!colaboradorCedula) {
      setError('Debes seleccionar un colaborador para evaluar.');
      return;
    }
    if (!periodo.trim()) {
      setError('Debes ingresar el período de evaluación (ej: Junio 2026).');
      return;
    }
    if (!potencial || !desempeno) {
      setError('Debes seleccionar el cuadrante del colaborador en la matriz Nine Box.');
      return;
    }

    setLoading(true);
    setError(null);

    // Estructurar respuestas de Desempeño
    const respuestasDes = Object.keys(valoresDesempeno).map(id => ({
      pregunta: valoresDesempeno[id].pregunta,
      evaluador: valoresDesempeno[id].evaluador,
      evaluado: valoresDesempeno[id].evaluado
    }));

    // Estructurar respuestas de Conocimientos
    const respuestasCon = Object.keys(valoresConocimientos).map(id => ({
      pregunta: valoresConocimientos[id].pregunta,
      evaluador: valoresConocimientos[id].evaluador,
      evaluado: valoresConocimientos[id].evaluado
    }));

    // Tienda ID
    const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
    const tId = selectedTiendaStr ? JSON.parse(selectedTiendaStr).id : (user?.user_metadata?.tienda_id || null);

    const payload = {
      fecha,
      evaluador_cedula: userCedula,
      evaluado_cedula: colaboradorCedula,
      tienda_id: tId,
      periodo,
      motivo,
      respuestas_desempeno: respuestasDes,
      observaciones_desempeno: observacionesDesempeno,
      respuestas_conocimientos: respuestasCon,
      observaciones_conocimientos: observacionesConocimientos,
      potencial,
      desempeno,
      plan_accion: planAccion
    };

    try {
      const { error } = await supabase.from('evaluaciones_ninebox').insert(payload);
      if (error) {
        setError(error.message);
      } else {
        navigate('/evaluaciones');
      }
    } catch (e) {
      setError('Ocurrió un error inesperado al guardar la evaluación.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedQuadrantInfo = () => {
    if (!potencial || !desempeno) return null;
    return NINE_BOX_DESCRIPTIONS[`${potencial}/${desempeno}`];
  };

  const qInfo = getSelectedQuadrantInfo();

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
          <ClipboardCheck className="w-8 h-8 text-orange-500" />
          Nueva Retroalimentación y Evaluación Nine Box
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Completa el censo de desempeño y potencial junto con el colaborador en su sesión de feedback.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Error de validación:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loadingPreguntas ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-slate-400 text-sm">Cargando formulario y preguntas...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Fila 1: Datos Generales */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-orange-500" />
              Datos del Proceso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Colaborador Evaluado:</label>
                <select
                  value={colaboradorCedula}
                  onChange={(e) => setColaboradorCedula(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg p-2.5 focus:border-orange-500 focus:outline-none transition-colors"
                >
                  <option value="">Selecciona un colaborador...</option>
                  {empleadosFiltrados.map(emp => (
                    <option key={emp.cedula} value={emp.cedula}>
                      {emp.nombres} {emp.apellidos} ({emp.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período de Evaluación:</label>
                <input
                  type="text"
                  placeholder="Ej: Junio 2026"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg p-2.5 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha:</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg p-2.5 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo de Retroalimentación:</label>
                <input
                  type="text"
                  placeholder="Ej: Retroalimentación Mensual"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg p-2.5 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Criterios de Desempeño */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
              <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">1</span>
              Criterios de Desempeño (Escala 1 - 5)
            </h3>
            
            <div className="space-y-4 divide-y divide-slate-800/50">
              {preguntasDesempeno.map((p, idx) => (
                <div key={p.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
                  <div className="max-w-md">
                    <span className="font-semibold text-white text-sm block">{p.pregunta}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Califica del 1 (bajo) al 5 (alto) según el comportamiento en el período.</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    {/* Evaluado */}
                    <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-850 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Evaluado:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(score => {
                          const isSel = valoresDesempeno[p.id]?.evaluado === score;
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleScoreChange(p.id, 'evaluado', score)}
                              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all ${isSel ? 'bg-orange-500 text-white scale-105 shadow-sm shadow-orange-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Evaluador */}
                    <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-850 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Evaluador:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(score => {
                          const isSel = valoresDesempeno[p.id]?.evaluador === score;
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleScoreChange(p.id, 'evaluador', score)}
                              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all ${isSel ? 'bg-emerald-500 text-white scale-105 shadow-sm shadow-emerald-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 pt-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observaciones y Ejemplos de Desempeño:</label>
              <textarea
                rows="3"
                placeholder="Ingresa notas aclaratorias, datos objetivos de cumplimiento o ejemplos conductuales específicos."
                value={observacionesDesempeno}
                onChange={(e) => setObservacionesDesempeno(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-orange-500 focus:outline-none transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Fila 3: Preguntas Poderosas (Conocimientos) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
              <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">2</span>
              Preguntas Poderosas (Conocimientos y Compromisos)
            </h3>
            
            <div className="space-y-6">
              {preguntasConocimientos.map((p) => (
                <div key={p.id} className="space-y-3 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                  <h4 className="font-bold text-white text-sm border-b border-slate-900 pb-2">
                    {p.pregunta}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Autoevaluación del Evaluado:</span>
                      <textarea
                        rows="2.5"
                        placeholder="Escribe la respuesta/sentir del colaborador..."
                        value={valoresConocimientos[p.id]?.evaluado || ''}
                        onChange={(e) => handleTextChange(p.id, 'evaluado', e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-300 text-xs focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comentario del Evaluador (Jefe):</span>
                      <textarea
                        rows="2.5"
                        placeholder="Escribe el comentario del evaluador..."
                        value={valoresConocimientos[p.id]?.evaluador || ''}
                        onChange={(e) => handleTextChange(p.id, 'evaluador', e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-300 text-xs focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 pt-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observaciones de Conocimientos:</label>
              <textarea
                rows="3"
                placeholder="Ingresa notas adicionales sobre conocimientos del cargo, procesos, etc."
                value={observacionesConocimientos}
                onChange={(e) => setObservacionesConocimientos(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-orange-500 focus:outline-none transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Fila 4: Matriz Nine Box Interactiva & Plan de Acción */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nine Box Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">3</span>
                  Matriz Nine Box (Selección Visual)
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Haz clic en el cuadrante correspondiente según el potencial y desempeño del colaborador en este período.
                </p>
              </div>

              <div className="flex flex-col items-center py-4">
                <div className="grid grid-cols-4 gap-1.5 w-full max-w-[340px]">
                  {/* Eje Y (Potencial) */}
                  <div className="flex flex-col justify-around text-right text-[9px] font-bold text-slate-500 pr-2 select-none leading-none">
                    <span>POTENCIAL<br/>ALTO</span>
                    <span>POTENCIAL<br/>MEDIO</span>
                    <span>POTENCIAL<br/>BAJO</span>
                  </div>
                  
                  {/* Cajas 3x3 */}
                  <div className="col-span-3 grid grid-cols-3 gap-1.5 aspect-square">
                    {['Alto', 'Medio', 'Bajo'].map(pot => (
                      <Fragment key={pot}>
                        {['Bajo', 'Medio', 'Alto'].map(des => {
                          const isSelected = potencial === pot && desempeno === des;
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
                            <button
                              key={des}
                              type="button"
                              onClick={() => {
                                setPotencial(pot);
                                setDesempeno(des);
                              }}
                              className={`border flex flex-col items-center justify-center text-[9px] font-bold rounded-lg p-2 text-center cursor-pointer transition-all duration-200 select-none ${
                                isSelected
                                  ? 'bg-orange-500 border-orange-400 text-white scale-105 shadow-lg shadow-orange-500/25'
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                  
                  {/* Eje X (Desempeño) */}
                  <div></div>
                  <div className="col-span-3 grid grid-cols-3 text-center text-[9px] font-bold text-slate-500 mt-2 select-none leading-none">
                    <span>DESEMPEÑO<br/>BAJO</span>
                    <span>DESEMPEÑO<br/>MEDIO</span>
                    <span>DESEMPEÑO<br/>ALTO</span>
                  </div>
                </div>
              </div>

              {/* Caja de descripción del perfil seleccionado */}
              <div className="min-h-[85px] bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-start gap-2.5">
                {qInfo ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white text-xs font-bold">{qInfo.label}</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{qInfo.desc}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                    <span className="text-slate-500 text-xs italic">Haz clic en un cuadrante para ver la descripción del perfil de talento.</span>
                  </>
                )}
              </div>
            </div>

            {/* Plan de Acción */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-white font-bold border-b border-slate-800 pb-2 flex items-center gap-2 text-base">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-sm">4</span>
                  Plan de Acción y Acuerdos de Mejora
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Establece compromisos, fechas límite, herramientas necesarias y planes de capacitación específicos.
                </p>
              </div>

              <div className="flex-1 mt-3">
                <textarea
                  rows="10"
                  required
                  placeholder="Ejemplo:&#10;1. Capacitación semanal en técnicas de cierre de ventas.&#10;2. El colaborador se compromete a mantener su conversión superior al 70%.&#10;3. Seguimiento semanal de metas en piso los sábados por la tarde."
                  value={planAccion}
                  onChange={(e) => setPlanAccion(e.target.value)}
                  className="w-full h-full min-h-[220px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-orange-500 focus:outline-none transition-colors placeholder:text-slate-600 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Botones de Envío */}
          <div className="flex items-center justify-end gap-4 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => navigate('/evaluaciones')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors text-sm font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Evaluación
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
