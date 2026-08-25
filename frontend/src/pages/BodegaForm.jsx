import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { 
  Package, 
  Clock, 
  FileText, 
  Video, 
  AlertCircle,
  Check, 
  Trash2, 
  Send, 
  Loader2, 
  CheckCircle,
  RefreshCw,
  ChevronRight,
  X,
  Paperclip,
  CheckSquare,
  Upload,
  Image,
  File,
  Plus
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';


const DRAFT_KEY = "ms_bodega_draft_v3_react";

const BODEGUEROS_LITERAL = [
  { id: "JOSE DANIEL LUNA ENRIQUEZ", label: "Jose Luna" },
  { id: "ANTONY STIVEN GAONA JIMENEZ", label: "Antony Gaona" },
  { id: "BRAYAN STIK NIETO RAMIREZ", label: "Brayan Nieto" }
];

// ─── Helper: ícono según tipo de archivo ───────────────────────────────────────
function getFileIcon(file) {
  const type = file.type || '';
  const ext = file.name?.split('.').pop()?.toLowerCase() || '';
  if (type.includes('pdf') || ext === 'pdf') return { Icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', label: 'PDF' };
  if (type.startsWith('image/')) return { Icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Imagen' };
  if (['xls', 'xlsx', 'csv'].includes(ext) || type.includes('spreadsheet')) return { Icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Excel' };
  if (['doc', 'docx'].includes(ext) || type.includes('word')) return { Icon: FileText, color: 'text-blue-500', bg: 'bg-blue-600/10', label: 'Word' };
  return { Icon: File, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Archivo' };
}

// ─── Componente: Tarjeta de Archivo ────────────────────────────────────────────
function FileCard({ file, onRemove, activeTheme, tc }) {
  const isImage = file.type?.startsWith('image/');
  const { Icon, color, bg, label } = getFileIcon(file);
  const sizeKB = (file.size / 1024).toFixed(0);
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  const sizeLabel = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

  return (
    <div className={`relative rounded-2xl border overflow-hidden h-32 flex flex-col ${
      activeTheme === 'oscuro'
        ? 'bg-slate-900/60 border-slate-800'
        : 'bg-white border-slate-200'
    }`}>
      {/* Thumbnail o ícono */}
      {isImage ? (
        <div className="flex-1 overflow-hidden">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`flex-1 flex items-center justify-center ${bg}`}>
          <Icon className={`w-10 h-10 ${color}`} />
        </div>
      )}

      {/* Info */}
      <div className={`px-2 py-1.5 border-t ${
        activeTheme === 'oscuro' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-white'
      }`}>
        <p className={`text-[10px] font-bold truncate ${tc.textPrimary}`} title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-[9px] ${color} font-black uppercase`}>{label}</span>
          <span className={`text-[9px] ${tc.textMuted}`}>{sizeLabel}</span>
        </div>
      </div>

      {/* Botón eliminar */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow cursor-pointer transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Componente: Zona Drag & Drop ──────────────────────────────────────────────
function DropZone({ onFilesAdded, tc, activeTheme }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFilesAdded(files);
  };
  const handleChange = (e) => {
    onFilesAdded(Array.from(e.target.files));
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
          : activeTheme === 'oscuro'
            ? 'border-slate-700 hover:border-slate-500 bg-slate-900/20'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
      }`}
    >
      <input ref={inputRef} type="file" multiple accept="*/*" onChange={handleChange} className="hidden" />
      <Upload className={`w-9 h-9 mb-2 transition-colors ${
        isDragging ? 'text-blue-500 animate-bounce' : 'text-slate-400'
      }`} />
      <span className={`text-sm font-black uppercase tracking-wider ${tc.textPrimary}`}>
        {isDragging ? 'Suelta los archivos aquí' : 'Arrastra o haz clic para subir'}
      </span>
      <span className={`text-[10px] mt-1 ${tc.textMuted}`}>
        Fotos, PDFs, Excel, Word y más · Máx. 10 archivos · 15 MB cada uno
      </span>
      <div className="flex gap-2 mt-3 flex-wrap justify-center">
        {[
          { label: 'Foto', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { label: 'PDF', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
          { label: 'Excel', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Word', cls: 'text-blue-600 bg-blue-600/10 border-blue-600/20' },
          { label: 'Otros', cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
        ].map(t => (
          <span key={t.label} className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase ${t.cls}`}>{t.label}</span>
        ))}
      </div>
    </div>
  );
}

// Subir archivo a Supabase
const subirArchivo = async (file, prefijo) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
  const path = `${prefijo}/${timestamp}-${random}-${safeName}`;

  const bucketName = 'evidencias-bodega';

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream'
    });

  if (error) {
    if (error.message && error.message.includes('Bucket not found')) {
      throw new Error(`El bucket de almacenamiento '${bucketName}' no existe en tu proyecto de Supabase. Por favor, ingresa a tu panel de Supabase, ve a la sección Storage y crea un bucket PÚBLICO llamado '${bucketName}' para poder subir imágenes.`);
    }
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return {
    name: file.name,
    size: file.size,
    url: urlData.publicUrl,
    path: data.path
  };
};

const generateCommentId = () => `obs-${Math.random().toString(36).substring(2, 9)}`;

export default function BodegaForm() {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(user?.user_metadata?.cargo || 'Asesor de Ventas', user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  const colaboradorNombre = `${user?.user_metadata?.nombres || ''} ${user?.user_metadata?.apellidos || ''}`.trim() || 'Bodeguero';
  const miRolReal = user?.user_metadata?.rol || 'empleado';
  const miCargoReal = user?.user_metadata?.cargo || 'Asesor';

  const getMiIdentidad = () => {
    const cargoLower = miCargoReal.toLowerCase();
    const rolLower = miRolReal.toLowerCase();
    
    if (
      rolLower === 'superadmin' || 
      rolLower === 'regional_supervisor' || 
      rolLower === 'store_supervisor' ||
      rolLower === 'supervisor' ||
      cargoLower.includes('supervisor')
    ) {
      return 'Supervisor';
    }
    
    if (cargoLower.includes('tercer') || cargoLower.includes('tercero')) return 'Tercero a bordo';
    if (cargoLower.includes('subjefe')) return 'Subjefe de Tienda';
    if (cargoLower.includes('jefe') || cargoLower.includes('director')) return 'Jefe de Tienda';
    
    if (rolLower === 'admin' || cargoLower.includes('admin')) {
      return 'Supervisor';
    }
    
    return colaboradorNombre;
  };

  const miIdentidad = getMiIdentidad();

  // Form State
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('sv-SE'));
  const [turno, setTurno] = useState('');
  const [actividades, setActividades] = useState('');
  const [guiasRealizadas, setGuiasRealizadas] = useState('');
  const [guiasDescripcion, setGuiasDescripcion] = useState('');
  const [videoConfirmado, setVideoConfirmado] = useState(false);
  const [novedades, setNovedades] = useState('');
  const [pendientes, setPendientes] = useState('');

  // Evidencias
  const [archivos, setArchivos] = useState([]);

  // UI States
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'actividades', 'video', 'evidencias', 'historial'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // { actual, total, msg }
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Historial & Comentarios de Jefes
  const [historyReportes, setHistoryReportes] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [selectedHistoryReporte, setSelectedHistoryReporte] = useState(null);
  const [newHistoryComment, setNewHistoryComment] = useState('');
  const [isSavingHistoryComment, setIsSavingHistoryComment] = useState(false);

  const loadHistoryReportes = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('reportes_bodega')
        .select('*')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setHistoryReportes(data || []);
    } catch (err) {
      console.error(err);
      setHistoryError(err.message || 'Error al cargar el historial.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getVistosHistoryReporte = (r) => {
    const obs = Array.isArray(r.comentarios_jefes) ? r.comentarios_jefes : [];
    const lect = obs.find(o => o.id === "_lecturas_reporte_");
    return lect?.vistos || [];
  };

  const saveHistoryReporteComentarios = async (reporteId, nuevosComentarios) => {
    const { error: updErr } = await supabase
      .from('reportes_bodega')
      .update({ comentarios_jefes: nuevosComentarios })
      .eq('id', reporteId);

    if (updErr) throw updErr;

    // Actualizar estado local
    setHistoryReportes(prev => prev.map(r => r.id === reporteId ? { ...r, comentarios_jefes: nuevosComentarios } : r));
    if (selectedHistoryReporte && selectedHistoryReporte.id === reporteId) {
      setSelectedHistoryReporte(prev => ({ ...prev, comentarios_jefes: nuevosComentarios }));
    }
  };

  const toggleVistoHistoryReporte = async (roleOrBodegueroId) => {
    if (!selectedHistoryReporte) return;
    try {
      const actualObs = [...(selectedHistoryReporte.comentarios_jefes || [])];
      let lecturasIdx = actualObs.findIndex(o => o.id === "_lecturas_reporte_");

      if (lecturasIdx === -1) {
        actualObs.push({
          id: "_lecturas_reporte_",
          texto: "",
          autor: "_system_",
          rol: "system",
          creado_en: new Date().toISOString(),
          vistos: []
        });
        lecturasIdx = actualObs.length - 1;
      }

      const vistos = [...(actualObs[lecturasIdx].vistos || [])];
      const yaMarcadoIdx = vistos.findIndex(v => v.usuario === roleOrBodegueroId);

      if (yaMarcadoIdx > -1) {
        vistos.splice(yaMarcadoIdx, 1);
      } else {
        const esBodeguero = BODEGUEROS_LITERAL.some(b => b.id === roleOrBodegueroId);
        vistos.push({
          usuario: roleOrBodegueroId,
          rol: esBodeguero ? 'bodeguero' : (roleOrBodegueroId === 'Supervisor' ? 'supervisor' : 'jefatura'),
          fecha: new Date().toISOString(),
          marcado_por: colaboradorNombre
        });
      }

      actualObs[lecturasIdx] = {
        ...actualObs[lecturasIdx],
        vistos
      };

      await saveHistoryReporteComentarios(selectedHistoryReporte.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al confirmar lectura: ' + err.message);
    }
  };

  const toggleVistoHistoryComentario = async (commentId) => {
    if (!selectedHistoryReporte) return;
    try {
      const actualObs = (selectedHistoryReporte.comentarios_jefes || []).map(o => {
        if (o.id === commentId) {
          const vistos = [...(o.vistos || [])];
          const yaVistoIdx = vistos.findIndex(v => v.usuario === colaboradorNombre);

          if (yaVistoIdx > -1) {
            vistos.splice(yaVistoIdx, 1);
          } else {
            vistos.push({
              usuario: colaboradorNombre,
              rol: "bodeguero",
              fecha: new Date().toISOString(),
              marcado_por: colaboradorNombre
            });
          }
          return { ...o, vistos };
        }
        return o;
      });

      await saveHistoryReporteComentarios(selectedHistoryReporte.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar visto del comentario: ' + err.message);
    }
  };

  const handleAddHistoryComment = async (e) => {
    e.preventDefault();
    if (!newHistoryComment.trim() || !selectedHistoryReporte || isSavingHistoryComment) return;

    setIsSavingHistoryComment(true);
    try {
      const actualObs = [...(selectedHistoryReporte.comentarios_jefes || [])];
      
      const nuevoComentarioObj = {
        id: generateCommentId(),
        texto: newHistoryComment.trim(),
        autor: colaboradorNombre,
        rol: "bodeguero",
        creado_en: new Date().toISOString(),
        vistos: [
          {
            usuario: colaboradorNombre,
            rol: "bodeguero",
            fecha: new Date().toISOString(),
            marcado_por: colaboradorNombre
          }
        ]
      };

      actualObs.push(nuevoComentarioObj);
      await saveHistoryReporteComentarios(selectedHistoryReporte.id, actualObs);
      setNewHistoryComment('');
    } catch (err) {
      console.error(err);
      alert('Error al agregar comentario: ' + err.message);
    } finally {
      setIsSavingHistoryComment(false);
    }
  };

  const handleDeleteHistoryComment = async (commentId) => {
    if (!selectedHistoryReporte) return;
    if (!window.confirm('¿Estás seguro de que deseas de eliminar tu comentario?')) return;
    try {
      const actualObs = (selectedHistoryReporte.comentarios_jefes || []).filter(o => o.id !== commentId);
      await saveHistoryReporteComentarios(selectedHistoryReporte.id, actualObs);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar comentario: ' + err.message);
    }
  };

  // Cargar historial al cambiar a la pestaña de historial
  useEffect(() => {
    if (activeTab === 'historial') {
      const timer = setTimeout(() => {
        loadHistoryReportes();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Derived state: Calcular progreso del formulario
  let totalPct = 5;
  let scorePct = 0;
  if (fecha) scorePct++;
  if (turno) scorePct++;
  if (actividades.trim() !== '') scorePct++;
  if (guiasRealizadas) scorePct++;
  totalPct += 1;
  if (videoConfirmado) scorePct++;
  const progressPercent = totalPct === 0 ? 0 : Math.round((scorePct / totalPct) * 100);

  // 1. Cargar borrador al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          const todayStr = new Date().toLocaleDateString('sv-SE');
          if (draft.fecha === todayStr) {
            setFecha(draft.fecha);
          } else {
            console.log('El borrador es de una fecha anterior, se mantendrá la fecha de hoy: ' + todayStr);
          }
          if (draft.turno) setTurno(draft.turno);
          if (draft.actividades) setActividades(draft.actividades);
          if (draft.guiasRealizadas) setGuiasRealizadas(draft.guiasRealizadas);
          if (draft.guiasDescripcion) setGuiasDescripcion(draft.guiasDescripcion);
          if (draft.videoConfirmado !== undefined) setVideoConfirmado(draft.videoConfirmado);
          if (draft.novedades) setNovedades(draft.novedades);
          if (draft.pendientes) setPendientes(draft.pendientes);
        }
      } catch (e) {
        console.error('Error al cargar borrador:', e);
      } finally {
        setIsDraftLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 2. Guardar borrador automáticamente al cambiar datos
  useEffect(() => {
    if (!isDraftLoaded) return;
    const saveTimer = setTimeout(() => {
      setIsSavingDraft(true);
      try {
        const draft = {
          fecha,
          turno,
          actividades,
          guiasRealizadas,
          guiasDescripcion,
          videoConfirmado,
          novedades,
          pendientes
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => setIsSavingDraft(false), 500);
    }, 800);

    return () => clearTimeout(saveTimer);
  }, [fecha, turno, actividades, guiasRealizadas, guiasDescripcion, videoConfirmado, novedades, pendientes, isDraftLoaded]);

  const addFiles = (newFiles) => {
    setArchivos(prev => {
      const current = prev.filter(Boolean);
      const combined = [...current];
      for (const f of newFiles) {
        if (combined.length >= 10) break;
        if (f.size > 15 * 1024 * 1024) {
          alert(`El archivo "${f.name}" supera el límite de 15 MB y fue omitido.`);
          continue;
        }
        combined.push(f);
      }
      return combined;
    });
  };

  const removeFile = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const limpiarBorrador = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTurno('');
    setActividades('');
    setGuiasRealizadas('');
    setGuiasDescripcion('');
    setVideoConfirmado(false);
    setNovedades('');
    setPendientes('');
    setArchivos([]);
  };

  // Compresión de fotos en cliente
  const comprimirImagen = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new window.File([blob], file.name.replace(/\\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.75);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!fecha || !turno || !actividades || !guiasRealizadas) {
      setSubmitError('Por favor completa todos los campos obligatorios marcados con (*).');
      setActiveTab('general');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Filtrar evidencias válidas
      const validFiles = archivos.filter(Boolean);
      const totalFiles = validFiles.length;

      const evOperativaURLs = [];
      const evJigsawURLs = [];

      if (totalFiles > 0) {
        setUploadProgress({ actual: 0, total: totalFiles, msg: 'Comprimiendo imágenes...' });
        
        // 1. Comprimir fotos si son imágenes
        const comprimidos = [];
        for (let i = 0; i < validFiles.length; i++) {
          const comp = await comprimirImagen(validFiles[i]);
          comprimidos.push(comp);
        }

        setUploadProgress({ actual: 0, total: totalFiles, msg: 'Subiendo evidencias...' });
        for (let i = 0; i < comprimidos.length; i++) {
          const file = comprimidos[i];
          const isImage = file.type.startsWith('image/');
          
          setUploadProgress(prev => ({ 
            ...prev, 
            actual: i, 
            msg: `Subiendo ${isImage ? 'evidencia' : 'documento'}: ${file.name}...` 
          }));
          
          if (isImage) {
            const res = await subirArchivo(file, 'operativa');
            evOperativaURLs.push(res);
          } else {
            const res = await subirArchivo(file, 'jigsaw');
            evJigsawURLs.push(res);
          }
        }
      }

      // Estructura del reporte
      const selectedTiendaStr = sessionStorage.getItem('portal_selected_tienda');
      let tId = null;
      if (selectedTiendaStr) {
        try {
          tId = JSON.parse(selectedTiendaStr).id;
        } catch (e) {
          console.error(e);
        }
      }
      if (!tId && user?.user_metadata?.tienda_id) {
        tId = user.user_metadata.tienda_id;
      }

      const rolesAutorizados = ['Supervisor', 'Jefe de Tienda', 'Subjefe de Tienda', 'Tercero a bordo'];
      const vistosIniciales = [];
      if (rolesAutorizados.includes(miIdentidad)) {
        vistosIniciales.push({
          usuario: miIdentidad,
          rol: miIdentidad === 'Supervisor' ? 'supervisor' : 'jefatura',
          fecha: new Date().toISOString(),
          marcado_por: colaboradorNombre
        });
      }

      const reporte = {
        fecha,
        colaborador: colaboradorNombre,
        turno,
        actividades,
        guias_realizadas: guiasRealizadas,
        guias_descripcion: guiasDescripcion,
        video_confirmado: videoConfirmado ? 'Sí' : 'No',
        novedades,
        pendientes,
        ev_operativa: evOperativaURLs,
        ev_jigsaw_filezilla: evJigsawURLs,
        tienda_id: tId,
        comentarios_jefes: [
          {
            id: "_lecturas_reporte_",
            texto: "",
            autor: "_system_",
            rol: "system",
            creado_en: new Date().toISOString(),
            vistos: vistosIniciales
          }
        ]
      };

      // Guardar en Supabase
      const { error: insErr } = await supabase
        .from('reportes_bodega')
        .insert([reporte]);

      if (insErr) throw insErr;

      try {
        const { data: staffList } = await supabase
          .from('empleados')
          .select('cedula')
          .in('cargo', ['Jefe', 'Subjefe', 'Bodeguero', 'Supervisor'])
          .eq('activo', true);

        if (staffList && staffList.length > 0) {
          const colaboradorNombre = `${user?.user_metadata?.nombres || ''} ${user?.user_metadata?.apellidos || ''}`.trim() || 'Un Bodeguero';
          const notifications = staffList
            .filter(emp => emp.cedula !== user?.user_metadata?.cedula) // No notificarse a sí mismo
            .map(emp => ({
              usuario_cedula: emp.cedula,
              titulo: '📦 Nuevo Reporte de Bodega',
              mensaje: `${colaboradorNombre} ha enviado el reporte diario de bodega.`,
              tipo: 'bodega',
              leido: false
            }));
          if (notifications.length > 0) {
            await supabase.from('notificaciones').insert(notifications);
          }
        }
      } catch (notifErr) {
        console.error('Error al insertar notificaciones de bodega:', notifErr);
      }



      setSubmitSuccess(true);
      limpiarBorrador();
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Error al guardar el reporte de bodega. Reintente por favor.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-accent-bg { background-color: ${myTheme.primary} !important; }
        .theme-accent-text { color: ${myTheme.primary} !important; }
        .theme-accent-border { border-color: ${myTheme.primary} !important; }
        .theme-accent-border-soft { border-color: ${myTheme.primary}30 !important; }
        .theme-accent-ring-focus:focus { border-color: ${myTheme.primary} !important; box-shadow: 0 0 0 3px ${myTheme.primary}20 !important; }
        .theme-accent-hover:hover { background-color: ${myTheme.primary}dd !important; }
        .theme-accent-border-hover:hover { border-color: ${myTheme.primary} !important; }
        .theme-accent-bg-hover:hover { background-color: ${myTheme.primary}20 !important; }
        .theme-accent-bg-soft { background-color: ${myTheme.primary}10 !important; }
        .theme-accent-bg-medium { background-color: ${myTheme.primary}20 !important; }
        .theme-tab-active { border-color: ${myTheme.primary}80 !important; background-color: ${myTheme.primary}15 !important; }
        .theme-gradient-bg { background: linear-gradient(135deg, ${myTheme.primary} 0%, ${myTheme.primary}dd 100%) !important; }
        .theme-accent-shadow { box-shadow: 0 4px 20px -2px ${myTheme.primary}30 !important; }
      ` }} />
        <div className={`p-8 md:p-12 border shadow-sm text-center animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className={`text-3xl font-title font-black mb-4 ${tc.textPrimary}`}>¡Reporte de Bodega Guardado!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            El reporte diario de operaciones de bodega ha sido registrado de forma correcta. ¡Buen trabajo en tu turno!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => setSubmitSuccess(false)}
              className="px-6 py-3 rounded-2xl font-bold font-title text-sm shadow-md text-white theme-accent-bg hover:theme-accent-hover"
            >
              Nuevo reporte
            </button>
            <a 
              href="/calendario"
              className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center"
            >
              Ver mi Horario
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-accent-bg { background-color: ${myTheme.primary} !important; }
        .theme-accent-text { color: ${myTheme.primary} !important; }
        .theme-accent-border { border-color: ${myTheme.primary} !important; }
        .theme-accent-border-soft { border-color: ${myTheme.primary}30 !important; }
        .theme-accent-ring-focus:focus { border-color: ${myTheme.primary} !important; box-shadow: 0 0 0 3px ${myTheme.primary}20 !important; }
        .theme-accent-hover:hover { background-color: ${myTheme.primary}dd !important; }
        .theme-accent-border-hover:hover { border-color: ${myTheme.primary} !important; }
        .theme-accent-bg-hover:hover { background-color: ${myTheme.primary}20 !important; }
        .theme-accent-bg-soft { background-color: ${myTheme.primary}10 !important; }
        .theme-accent-bg-medium { background-color: ${myTheme.primary}20 !important; }
        .theme-tab-active { border-color: ${myTheme.primary}80 !important; background-color: ${myTheme.primary}15 !important; }
        .theme-gradient-bg { background: linear-gradient(135deg, ${myTheme.primary} 0%, ${myTheme.primary}dd 100%) !important; }
        .theme-accent-shadow { box-shadow: 0 4px 20px -2px ${myTheme.primary}30 !important; }
      ` }} />
      
      {/* Barra de progreso */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full theme-accent-bg transition-all duration-500 ease-out rounded-full" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Cabecera */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-title font-black flex items-center gap-3 ${tc.textPrimary}`}>
            <Package className="w-8 h-8 theme-accent-text" />
            Reporte Diario de Bodega
          </h1>
          <p className={`mt-1 ${tc.textMuted}`}>
            Completa la bitácora operativa de bodega al finalizar tu turno de trabajo.
          </p>
        </div>

        {/* Indicador de borrador guardado */}
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 py-1.5 px-3 rounded-full border border-slate-200/40 dark:border-slate-800/40">
          <span className={`w-2 h-2 rounded-full ${isSavingDraft ? 'theme-accent-bg animate-pulse' : 'bg-green-500'}`} />
          {isSavingDraft ? 'Guardando borrador...' : 'Borrador Guardado'}
        </div>
      </div>

      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 text-red-500 flex items-start gap-3 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm">Error en el envío</h4>
            <p className="text-xs text-red-500/80 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl mb-8 overflow-x-auto">
        {[
          { id: 'general', label: 'Datos & Turno' },
          { id: 'actividades', label: 'Actividades & Guías' },
          { id: 'video', label: 'Video del Día' },
          { id: 'evidencias', label: 'Evidencias' },
          { id: 'historial', label: 'Historial y Comentarios' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[125px] py-3 px-4 rounded-xl font-title font-extrabold text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-md dark:bg-slate-800 dark:text-white' 
                : 'text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'historial' ? (
        /* VISTA DE HISTORIAL Y COMENTARIOS PARA BODEGUEROS */
        <div className="space-y-6 animate-fade-in-up">
          {historyLoading ? (
            <div className="text-center py-20">
              <RefreshCw className="w-10 h-10 theme-accent-text animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-bold font-title">Cargando historial de reportes...</p>
            </div>
          ) : historyError ? (
            <div className={`p-8 rounded-3xl border shadow-sm text-center border-red-500/20 max-w-md mx-auto ${tc.cardBg}`} style={tc.cardBgStyle}>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-title font-black text-slate-900 dark:text-white">Error al cargar historial</h3>
              <p className="text-slate-500 text-xs mt-2 mb-6">{historyError}</p>
              <button 
                type="button"
                onClick={loadHistoryReportes}
                className="px-6 py-2.5 theme-accent-bg text-white font-bold font-title text-xs rounded-xl shadow-md"
              >
                Reintentar
              </button>
            </div>
          ) : historyReportes.length === 0 ? (
            <div className={`py-16 px-4 rounded-3xl border shadow-sm text-center ${tc.cardBg}`} style={tc.cardBgStyle}>
              <p className="text-slate-400 font-bold font-title text-sm">No hay reportes de bodega registrados todavía.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyReportes.map(item => {
                const evOp = Array.isArray(item.ev_operativa) ? item.ev_operativa : [];
                const evJig = Array.isArray(item.ev_jigsaw_filezilla) ? item.ev_jigsaw_filezilla : [];
                const totalEv = evOp.length + evJig.length;
                const comentarios = Array.isArray(item.comentarios_jefes) ? item.comentarios_jefes.filter(c => c.id !== "_lecturas_reporte_") : [];
                const vistos = getVistosHistoryReporte(item);
                const bossesCount = vistos.length;

                return (
                  <div 
                    key={item.id}
                    className={`p-6 rounded-3xl border shadow-sm premium-shadow-hover relative flex flex-col justify-between h-[230px] ${tc.cardBg}`} style={tc.cardBgStyle}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest theme-accent-text theme-accent-bg/10 px-2.5 py-1 rounded-full">
                          {item.fecha}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.turno}
                        </span>
                      </div>

                      <h3 className={`text-lg font-title font-black truncate ${tc.textPrimary}`}>
                        {item.colaborador}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {item.actividades}
                      </p>

                      <div className="flex gap-2 flex-wrap mt-3">
                        {comentarios.length > 0 && (
                          <span className="text-[9px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                            💬 {comentarios.length} comentarios
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                          bossesCount > 0 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                        }`}>
                          👁️ {bossesCount === 3 ? 'Revisado (Full)' : `${bossesCount}/3 Vistos`}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100/50 dark:border-slate-800/40 mt-auto">
                      <div className="flex items-center gap-2">
                        {totalEv > 0 && (
                          <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-0.5">
                            <Paperclip className="w-3.5 h-3.5" />
                            {totalEv}
                          </span>
                        )}
                        {item.video_confirmado === 'Sí' && (
                          <span className="text-[10px] font-extrabold text-green-500 flex items-center gap-0.5 bg-green-500/10 px-2 py-0.5 rounded-lg">
                            Video
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryReporte(item)}
                        className="text-xs font-bold font-title theme-accent-text hover:theme-accent-text/85 flex items-center gap-1"
                      >
                        Ver detalles
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* PESTAÑA: DATOS GENERALES */}
          {activeTab === 'general' && (
            <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
              <h3 className={`text-xl font-title font-black border-b pb-4 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
                01. Datos Generales de Turno
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                    Colaborador (Auto)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={colaboradorNombre}
                    className={`w-full border rounded-2xl py-3.5 px-4 font-extrabold text-sm outline-none transition-all ${
                      activeTheme === 'oscuro'
                        ? 'bg-slate-950/40 border-slate-800/60 text-slate-300'
                        : 'bg-slate-100/90 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3.5 px-4 font-bold text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border focus:ring-1  transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                    Turno <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3.5 px-4 font-bold text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border focus:ring-1  transition-all"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                    <option value="Completo">Completo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('actividades')}
                  className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Siguiente: actividades →
                </button>
              </div>
            </div>
          )}

          {/* PESTAÑA: ACTIVIDADES Y GUIAS */}
          {activeTab === 'actividades' && (
            <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
              <h3 className={`text-xl font-title font-black border-b pb-4 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
                02. Actividades y Guías de Bodega
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                  ¿Qué actividades realizaste hoy? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Describe ingresos, egresos, conteo de mercadería de calzado o ropa, recepciones o despachos completados..."
                  value={actividades}
                  onChange={(e) => setActividades(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3.5 px-4 font-sans text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border focus:ring-1  transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-start">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                    ¿Realizaste guías hoy? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {['Sí', 'No'].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setGuiasRealizadas(option)}
                        className={`flex-1 py-3.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                          guiasRealizadas === option
                            ? 'theme-accent-bg theme-accent-border text-white shadow-md'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                    Detalle de guías realizadas
                  </label>
                  <textarea
                    rows="3"
                    disabled={guiasRealizadas !== 'Sí'}
                    placeholder={guiasRealizadas === 'Sí' ? "Detalla liquidaciones, consolidaciones, guías subidas a FileZilla, etc..." : "Solo disponible si marcaste 'Sí'"}
                    value={guiasDescripcion}
                    onChange={(e) => setGuiasDescripcion(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 disabled:bg-slate-100/50 dark:disabled:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3.5 px-4 font-sans text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border focus:ring-1  transition-all resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                    Novedades o incidentes del turno
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Inconvenientes con transportadoras, faltantes notables, rotura de cajas..."
                    value={novedades}
                    onChange={(e) => setNovedades(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3 px-4 font-sans text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                    Pendientes para el siguiente turno
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Cajas por perchar, mercadería por codificar, etc..."
                    value={pendientes}
                    onChange={(e) => setPendientes(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3 px-4 font-sans text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('video')}
                  className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Siguiente: video diario →
                </button>
              </div>
            </div>
          )}

          {/* PESTAÑA: VIDEO DEL DIA */}
          {activeTab === 'video' && (
            <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
              <h3 className={`text-xl font-title font-black border-b pb-4 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
                03. Video del Día (Subida obligatoria)
              </h3>

              <div className="theme-accent-bg-soft border theme-accent-border-soft p-5 rounded-2xl flex gap-3 text-sm leading-relaxed font-sans">
                <Video className="w-6 h-6 theme-accent-text flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white font-extrabold block">📹 Instrucciones de subida del video de cierre</strong>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1">
                    Por favor, sube el video de cierre de bodega dentro del recuadro de Google Forms a continuación. Una vez subido exitosamente, haz clic en **"Enviar"** dentro del recuadro e inmediatamente marca la casilla de confirmación de abajo.
                  </p>
                </div>
              </div>

              {/* Iframe Form */}
              <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden h-[420px] shadow-inner bg-slate-900/5">
                <iframe
                  src="https://docs.google.com/forms/d/e/1FAIpQLSfeUm6CwH9lne9GHT35Opy5TTyaGIfY0BXYW7-BRaw0ekh7hw/viewform?embedded=true"
                  className="w-full h-full"
                  frameBorder="0"
                  marginHeight="0"
                  marginWidth="0"
                  title="Subida del video de bodega"
                >
                  Cargando formulario de video...
                </iframe>
              </div>

              {/* Casilla de confirmación */}
              <label className="flex items-center gap-3 p-4 border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 rounded-2xl cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={videoConfirmado}
                  onChange={(e) => setVideoConfirmado(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-xs md:text-sm font-extrabold text-green-600 dark:text-green-500">
                  ✅ Confirmo que ya subí y envié el video del día mediante el formulario de arriba
                </span>
              </label>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('actividades')}
                  className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('evidencias')}
                  className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Siguiente: evidencias →
                </button>
              </div>
            </div>
          )}

          {/* PESTAÑA: EVIDENCIAS */}
          {activeTab === 'evidencias' && (
            <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
              <div>
                <h3 className={`text-xl font-title font-black border-b pb-2 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
                  04. Evidencias del Turno
                </h3>
                <p className="text-xs text-slate-400 mt-1">Sube fotos, PDFs o cualquier archivo de evidencia. Máximo 10 archivos, 15 MB cada uno.</p>
              </div>

              {/* Zona Drag & Drop */}
              <DropZone onFilesAdded={addFiles} tc={tc} activeTheme={activeTheme} />

              {/* Lista de archivos adjuntos */}
              {archivos.filter(Boolean).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${tc.textMuted}`}>
                      {archivos.filter(Boolean).length} archivo(s) adjunto(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => setArchivos([])}
                      className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Quitar todos
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {archivos.filter(Boolean).map((file, index) => (
                      <FileCard key={index} file={file} onRemove={() => removeFile(index)} activeTheme={activeTheme} tc={tc} />
                    ))}

                    {/* Botón añadir más si hay menos de 10 */}
                    {archivos.filter(Boolean).length < 10 && (
                      <label className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        activeTheme === 'oscuro'
                          ? 'border-slate-700 hover:border-slate-500 bg-slate-900/20'
                          : 'border-slate-200 hover:border-slate-400 bg-slate-50/40'
                      }`}>
                        <input type="file" multiple accept="*/*" onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value=''; }} className="hidden" />
                        <Plus className="w-6 h-6 text-slate-400 mb-1" />
                        <span className={`text-[10px] font-bold ${tc.textMuted}`}>Añadir más</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Banner de progreso */}
              {uploadProgress && (
                <div className="theme-accent-bg-soft border theme-accent-border-soft rounded-2xl p-5 space-y-3 animate-fade-in-up">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="theme-accent-text flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {uploadProgress.msg}
                    </span>
                    <span className="text-slate-400">
                      {uploadProgress.actual} de {uploadProgress.total} archivos
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full theme-accent-bg transition-all duration-300"
                      style={{ width: `${(uploadProgress.actual / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setActiveTab('video')}
                  className="px-6 py-3.5 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
                >
                  ← Video del Turno
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-2xl font-bold font-title text-sm shadow-lg transform active:scale-95 transition-all text-white theme-accent-bg hover:theme-accent-hover theme-accent-shadow flex items-center gap-2.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Reporte
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      )}

      {/* MODAL DETALLE DE REPORTE BODEGA PARA BODEGUERO */}
      {selectedHistoryReporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl border-white/20 premium-shadow flex flex-col overflow-hidden animate-fade-in-up bg-white dark:bg-slate-900">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest theme-accent-text theme-accent-bg/10 px-2.5 py-1 rounded-full block w-max mb-2">
                  {selectedHistoryReporte.colaborador === colaboradorNombre ? 'Mi Reporte Bodega' : 'Reporte Bodega'} · {selectedHistoryReporte.fecha}
                </span>
                <h2 className={`text-2xl font-title font-black ${tc.textPrimary}`}>
                  {selectedHistoryReporte.colaborador}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryReporte(null)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Bloque Turno & Video */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Turno Reportado
                  </span>
                  <p className="text-lg font-title font-black mt-1 dark:text-white">
                    {selectedHistoryReporte.turno}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Video de Cierre
                  </span>
                  {selectedHistoryReporte.video_confirmado === 'Sí' ? (
                    <div className="flex flex-col items-center gap-2 mt-1.5">
                      <span className="text-xs font-black text-green-500 flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        Confirmado & Enviado
                      </span>
                      <a 
                        href="https://drive.google.com/drive/folders/1BZtYHIZPS0xbanGuxB-OwnKi0SS7VEIeicz_7GRmKOLILHvFfg-UysHLFqCXx2FwYzi4WilN" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 87.3 78">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"/>
                        </svg>
                        Abrir carpeta
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs font-black text-red-500 flex items-center gap-1 mt-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      Sin video
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-2xl text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Guías del Día
                  </span>
                  <span className={`text-xs font-black flex items-center gap-1 mt-1.5 px-3 py-1 rounded-full border ${
                    selectedHistoryReporte.guias_realizadas === 'Sí'
                      ? 'bg-blue-500/10 border-blue-500/20 theme-accent-text'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}>
                    {selectedHistoryReporte.guias_realizadas === 'Sí' ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>

              {/* Actividades realizadas */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest theme-accent-text flex items-center gap-1">
                  Actividades Operativas de Bodega
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {selectedHistoryReporte.actividades}
                </div>
              </div>

              {/* Detalle de guías */}
              {selectedHistoryReporte.guias_realizadas === 'Sí' && selectedHistoryReporte.guias_descripcion && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📋 Detalle de Guías de Traslado & FileZilla
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {selectedHistoryReporte.guias_descripcion}
                  </div>
                </div>
              )}

              {/* Novedades y pendientes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    ⚠️ Novedades del Turno
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 min-h-[80px]">
                    {selectedHistoryReporte.novedades || <span className="text-slate-400 italic">Sin novedades.</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📌 Pendientes para Próximo Turno
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl text-sm text-slate-600 dark:text-slate-300 min-h-[80px]">
                    {selectedHistoryReporte.pendientes || <span className="text-slate-400 italic">Sin pendientes.</span>}
                  </div>
                </div>
              </div>

              {/* EVIDENCIAS POR ZONA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                
                {/* Zona 1: Operativa */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📎 Evidencias Operativas (Zona 1)
                  </h4>
                  {(!Array.isArray(selectedHistoryReporte.ev_operativa) || selectedHistoryReporte.ev_operativa.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">Sin evidencias en esta zona.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedHistoryReporte.ev_operativa.map((f, idx) => {
                        const isImg = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(f.url);
                        return (
                          <a 
                            key={idx}
                            href={f.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center group h-[100px] overflow-hidden relative"
                          >
                            {isImg ? (
                              <img src={f.url} alt={f.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
                            )}
                            <span className="text-[9px] font-bold truncate max-w-full text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/80 px-2 py-0.5 rounded z-10">
                              {f.name}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Zona 2: Jigsaw */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    📎 Evidencias Jigsaw & FileZilla (Zona 2)
                  </h4>
                  {(!Array.isArray(selectedHistoryReporte.ev_jigsaw_filezilla) || selectedHistoryReporte.ev_jigsaw_filezilla.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">Sin evidencias en esta zona.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedHistoryReporte.ev_jigsaw_filezilla.map((f, idx) => {
                        const isImg = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(f.url);
                        return (
                          <a 
                            key={idx}
                            href={f.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center group h-[100px] overflow-hidden relative"
                          >
                            {isImg ? (
                              <img src={f.url} alt={f.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
                            )}
                            <span className="text-[9px] font-bold truncate max-w-full text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/80 px-2 py-0.5 rounded z-10">
                              {f.name}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmación de Lectura (Check-in) */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  👁️ Confirmación de Lectura (Check-in)
                </h4>
                
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400/70 block">
                    Jefatura:
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {['Supervisor', 'Jefe de Tienda', 'Subjefe de Tienda'].map(roleId => {
                      const vistos = getVistosHistoryReporte(selectedHistoryReporte);
                      const yaLeido = vistos.some(v => v.usuario === roleId);
                      const puedoConfirmar = miIdentidad === roleId;

                      return (
                        <button
                          key={roleId}
                          type="button"
                          disabled={!puedoConfirmar}
                          onClick={() => toggleVistoHistoryReporte(roleId)}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                            yaLeido
                              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-500'
                              : 'border-slate-200 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/10 text-slate-450'
                          } ${puedoConfirmar ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'opacity-65 cursor-not-allowed'}`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            yaLeido ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {yaLeido && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                          </div>
                          <span>{roleId}</span>
                          {yaLeido && (
                            <span className="text-[8px] text-slate-400 block font-normal">
                              Leído el {new Date(vistos.find(v => v.usuario === roleId)?.fecha).toLocaleDateString('es-EC')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400/70 block">
                    Bodega:
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {BODEGUEROS_LITERAL.map(bod => {
                      const vistos = getVistosHistoryReporte(selectedHistoryReporte);
                      const yaLeido = vistos.some(v => v.usuario === bod.id);
                      const puedoConfirmar = miIdentidad === bod.id;

                      return (
                        <button
                          key={bod.id}
                          type="button"
                          disabled={!puedoConfirmar}
                          onClick={() => toggleVistoHistoryReporte(bod.id)}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                            yaLeido
                              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-500'
                              : 'border-slate-200 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/10 text-slate-450'
                          } ${puedoConfirmar ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'opacity-65 cursor-not-allowed'}`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            yaLeido ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {yaLeido && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                          </div>
                          <span>{bod.label}</span>
                          {yaLeido && (
                            <span className="text-[8px] text-slate-400 block font-normal">
                              Leído el {new Date(vistos.find(v => v.usuario === bod.id)?.fecha).toLocaleDateString('es-EC')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Comentarios del Supervisor / Jefatura */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest theme-accent-text">
                  💬 Comentarios y Observaciones de Jefes
                </h4>

                <div className="space-y-3">
                  {(selectedHistoryReporte.comentarios_jefes || [])
                    .filter(c => c.id !== "_lecturas_reporte_")
                    .length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4">No hay comentarios en este reporte diario.</p>
                    ) : (
                      (selectedHistoryReporte.comentarios_jefes || [])
                        .filter(c => c.id !== "_lecturas_reporte_")
                        .map(c => {
                          const vistos = Array.isArray(c.vistos) ? c.vistos : [];
                          const yaLoVi = vistos.some(v => v.usuario === colaboradorNombre);
                          const esMiComentario = c.autor === colaboradorNombre;

                          const autorBadgeColor = 
                            c.rol === 'supervisor' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            c.rol === 'jefatura' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            c.rol === 'bodeguero' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            'bg-slate-500/10 text-slate-500 border-slate-500/20';

                          return (
                            <div 
                              key={c.id} 
                              className={`p-4 rounded-2xl border transition-all ${
                                esMiComentario 
                                  ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800' 
                                  : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                    {c.autor}
                                  </span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${autorBadgeColor}`}>
                                    {c.rol || 'colaborador'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-slate-450">
                                    {new Date(c.creado_en).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                  {esMiComentario && (
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteHistoryComment(c.id)}
                                      className="text-red-500 hover:text-red-650 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                                      title="Eliminar Comentario"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                                {c.texto}
                              </p>
                              
                              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100/50 dark:border-slate-900/50">
                                <button
                                  type="button"
                                  onClick={() => toggleVistoHistoryComentario(c.id)}
                                  className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors ${
                                    yaLoVi ? 'text-green-500' : 'text-slate-450 hover:text-slate-750'
                                  }`}
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  {yaLoVi ? 'Leído' : 'Marcar Leído'}
                                </button>
                                {vistos.length > 0 && (
                                  <span className="text-[8px] text-slate-450">
                                    Leído por: {vistos.map(v => v.usuario).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                </div>

                {/* Escribir respuesta */}
                <form onSubmit={handleAddHistoryComment} className="flex gap-2 items-end pt-2">
                  <textarea
                    rows="2"
                    required
                    placeholder="Responde o haz una pregunta sobre las observaciones de los jefes..."
                    value={newHistoryComment}
                    onChange={(e) => setNewHistoryComment(e.target.value)}
                    className={`flex-1 rounded-2xl border py-2.5 px-4 font-sans text-xs outline-none focus:ring-1 transition-all resize-none ${
                      activeTheme === 'oscuro' 
                        ? 'bg-slate-900 border-slate-800 text-white focus:border-marathon-medium focus:ring-marathon-medium/10' 
                        : 'bg-white border-slate-200 text-slate-800 focus:border-marathon-medium focus:ring-marathon-medium/10'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSavingHistoryComment || !newHistoryComment.trim()}
                    className="p-3 theme-accent-bg hover:theme-accent-hover disabled:opacity-50 text-white rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    {isSavingHistoryComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoryReporte(null)}
                className="px-6 py-2.5 rounded-xl font-bold font-title text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}