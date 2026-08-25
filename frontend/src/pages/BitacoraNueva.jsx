import { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { 
  ClipboardList, 
  CheckCircle, 
  Send, 
  Loader2,
  Percent,
  Check,
  AlertTriangle,
  Upload,
  FileText,
  Image,
  File,
  X,
  Plus
} from 'lucide-react';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import BitacorasSelectorNav from '../components/BitacorasSelectorNav';


const CAMPOS_ADMIN = [
  { key: "adm_induccion_personal", label: "Inducción personal nuevo" },
  { key: "adm_autorizacion_horas", label: "Autorización de horas (compensar y adicionales)" },
  { key: "adm_baja_personal", label: "Baja de personal (renuncia)" },
  { key: "adm_solicitud_pop", label: "Solicitud de POP" },
  { key: "adm_solicitud_rollos", label: "Solicitud de rollos de impresora de precios" },
  { key: "adm_solicitud_paco", label: "Solicitud de PA-CO" },
  { key: "adm_solicitud_fundas", label: "Solicitud de fundas" },
  { key: "adm_metas_mensuales", label: "Metas mensuales (período)" },
  { key: "adm_horarios_mes", label: "Horarios del mes (semanal)" },
  { key: "adm_solicitud_cc", label: "Solicitud de autorización Centro Comercial" },
  { key: "adm_retroalimentacion", label: "Retroalimentación (personal nuevo o antiguo)" },
  { key: "adm_recepcion_web", label: "Recepción de ventas WEB" },
  { key: "adm_pedido_codigos", label: "Pedido de códigos (asesores)" },
  { key: "adm_instalaciones", label: "Instalaciones, mantenimientos y trabajos generales" },
  { key: "adm_solicitud_uniformes", label: "Solicitud de uniformes" },
  { key: "adm_visitas_tienda", label: "Visita a la tienda de gerentes, supervisor, marcas" },
  { key: "adm_limpieza_industrial", label: "Limpieza de tienda (Empresa Industrial Clear)" },
];

const CATEGORIAS_OP = [
  {
    titulo: "📋 Categorización y precios",
    campos: [
      { key: "op_categorizacion_pared", label: "Categorización pared principal, zonas marcas" },
      { key: "op_cambio_pvp_calzado", label: "Cambio de PVP, descuento calzado" },
      { key: "op_verif_pvp_ropa", label: "Verificación de PVP, descuentos por zonas o marcas (ropa)" },
      { key: "op_verif_pvp_accesorios", label: "Verificación de PVP, descuentos por zonas o marcas (accesorios)" },
    ]
  },
  {
    titulo: "🛍️ Exhibición de productos",
    campos: [
      { key: "op_exhib_accesorios", label: "Exhibición de producto nuevo accesorios" },
      { key: "op_exhib_ropa", label: "Exhibición de producto nuevo ropa" },
      { key: "op_exhib_zapatos", label: "Exhibición de producto nuevo zapatos" },
    ]
  },
  {
    titulo: "🧱 Cambio de paredes y muebles",
    campos: [
      { key: "op_cambio_paredes_ropa_marcas", label: "Cambio de exhibición de paredes (ropa) zonas marcas" },
      { key: "op_cambio_paredes_ropa_marathon", label: "Cambio de exhibición de paredes (ropa) zonas PORTAL HUB" },
      { key: "op_cambio_paredes_accesorios", label: "Cambio de exhibición de paredes (accesorios)" },
      { key: "op_cambio_muebles_ropa_marcas", label: "Cambio de exhibición de muebles de ropa zonas marcas" },
      { key: "op_cambio_muebles_ropa_marathon", label: "Cambio de exhibición de muebles de ropa zonas PORTAL HUB" },
      { key: "op_cambio_muebles_accesorios", label: "Cambio de exhibición de muebles de accesorios" },
      { key: "op_cambio_mesas", label: "Cambio de exhibición de mesas" },
    ]
  },
  {
    titulo: "🧍 Maniquíes",
    campos: [
      { key: "op_maniquies_marathon", label: "Cambio de maniquíes zonas PORTAL HUB" },
      { key: "op_maniquies_marcas", label: "Cambio de maniquíes zonas marcas" },
    ]
  },
  {
    titulo: "🧹 Limpieza",
    campos: [
      { key: "op_limp_muebles_marathon", label: "Limpieza de muebles zonas (PORTAL HUB)" },
      { key: "op_limp_muebles_marcas", label: "Limpieza de muebles zonas (marcas)" },
      { key: "op_limp_bases_marathon", label: "Limpieza de bases zonas (PORTAL HUB)" },
      { key: "op_limp_bases_marcas", label: "Limpieza de bases zonas (marcas)" },
      { key: "op_limp_micas", label: "Limpieza de micas categorización" },
    ]
  },
  {
    titulo: "📐 Tallaje de ropa",
    campos: [
      { key: "op_tallar_muebles_marathon", label: "Tallar ropa muebles PORTAL HUB" },
      { key: "op_tallar_muebles_zonas", label: "Tallar ropa muebles zonas" },
      { key: "op_tallar_paredes_marathon", label: "Tallar ropa paredes PORTAL HUB" },
      { key: "op_tallar_paredes_marcas", label: "Tallar ropa paredes marcas" },
    ]
  },
  {
    titulo: "🏷️ Liquidaciones y promociones",
    campos: [
      { key: "op_liquidacion_mercaderia", label: "Liquidación de mercadería (ropa, zapatos, accesorios)" },
      { key: "op_tags_promocion", label: "Colocación de tags de promoción" },
    ]
  }
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

export default function BitacoraNueva({ hideHeaderNav = false }) {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const myTheme = getEmployeeTheme(user?.user_metadata?.cargo || 'Asesor de Ventas', user?.user_metadata?.nombres || '');
  const tc = getThemeClasses(activeTheme, myTheme);

  const colaboradorNombre = `${user?.user_metadata?.nombres || ''} ${user?.user_metadata?.apellidos || ''}`.trim() || 'Jefe de Tienda';
  const cargoReal = user?.user_metadata?.cargo || 'Jefe';

  const getMiIdentidad = () => {
    const cargoLower = cargoReal.toLowerCase();
    const rolLower = (user?.user_metadata?.rol || 'empleado').toLowerCase();
    
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
    
    return 'Tercero a bordo';
  };

  // Form State
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString('sv-SE'));
  const [cumplimientoMeta, setCumplimientoMeta] = useState('');
  const [autorizacionesCC, setAutorizacionesCC] = useState('No aplica');
  const [revisoHorario, setRevisoHorario] = useState('No');
  const [observaciones, setObservaciones] = useState('');
  const [selectedChecks, setSelectedChecks] = useState({});
  const [archivos, setArchivos] = useState([]);
  
  // UI & Status states
  const [activeTab, setActiveTab] = useState('datos'); // 'datos', 'admin', 'op', 'evidencias'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // { actual, total, msg }

  // Calcular progreso general del formulario en tiempo de render
  let total = 6; // fecha (2), cumplimientoMeta (2), CC (1), horario (1)
  let score = 0;
  
  if (fecha) score += 2;
  if (cumplimientoMeta && parseFloat(cumplimientoMeta) >= 0) score += 2;
  if (autorizacionesCC) score += 1;
  if (revisoHorario) score += 1;

  // Checkboxes administrativos
  const marcadosAdm = CAMPOS_ADMIN.filter(c => selectedChecks[c.key]).length;
  total += 3;
  score += Math.min(marcadosAdm, 3);

  // Checkboxes operativos
  const marcadosOp = CATEGORIAS_OP.flatMap(c => c.campos).filter(c => selectedChecks[c.key]).length;
  total += 3;
  score += Math.min(marcadosOp, 3);

  // Observaciones
  total += 1;
  if (observaciones.trim() !== '') score += 1;

  const progressPercent = total === 0 ? 0 : Math.min(100, Math.round((score / total) * 100));

  const handleCheckChange = (key) => {
    setSelectedChecks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Agrega archivos a la lista (max 10)
  const addFiles = (newFiles) => {
    setArchivos(prev => {
      const current = prev.filter(Boolean);
      const combined = [...current];
      for (const f of newFiles) {
        if (combined.length >= 10) break;
        if (f.size > 15 * 1024 * 1024) {
          alert(`"${f.name}" supera el límite de 15 MB y fue omitido.`);
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

  // Comprimir imagen en el navegador
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

  // Subir evidencias a Supabase Storage
  const subirArchivo = async (file) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
    const path = `evidencias/${timestamp}-${random}-${safeName}`;

    // Obtener bucket del proyecto
    const bucketName = 'evidencias-jefes';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!fecha || !cumplimientoMeta) {
      setSubmitError('Por favor completa todos los campos requeridos (*).');
      setActiveTab('datos');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const validFiles = archivos.filter(Boolean);
      const evidenciasURLs = [];

      if (validFiles.length > 0) {
        setUploadProgress({ actual: 0, total: validFiles.length, msg: 'Comprimiendo imágenes...' });
        const comprimidos = [];
        for (let i = 0; i < validFiles.length; i++) {
          const c = await comprimirImagen(validFiles[i]);
          comprimidos.push(c);
        }

        setUploadProgress({ actual: 0, total: validFiles.length, msg: 'Subiendo evidencias...' });
        for (let i = 0; i < comprimidos.length; i++) {
          setUploadProgress(prev => ({ ...prev, actual: i, msg: `Subiendo ${comprimidos[i].name}...` }));
          const res = await subirArchivo(comprimidos[i]);
          evidenciasURLs.push(res);
        }
      }

      // Estructura de bitácora
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

      const miIdentidad = getMiIdentidad();

      const bitacora = {
        fecha,
        colaborador: colaboradorNombre,
        cargo: cargoReal === 'admin' ? 'Jefe' : cargoReal === 'supervisor' ? 'Supervisor' : (cargoReal.toLowerCase().includes('tercer') ? 'Tercero a bordo' : cargoReal),
        cumplimiento_meta: parseFloat(cumplimientoMeta),
        autorizaciones_cc: autorizacionesCC,
        reviso_horario: revisoHorario,
        observaciones: observaciones,
        evidencias: evidenciasURLs,
        tienda_id: tId,
        observaciones_supervisor: [
          {
            id: "_lecturas_bitacora_",
            texto: "",
            autor: "_system_",
            rol: "system",
            creado_en: new Date().toISOString(),
            vistos: [
              {
                usuario: miIdentidad,
                rol: miIdentidad === 'Supervisor' ? 'supervisor' : 'jefatura',
                fecha: new Date().toISOString(),
                marcado_por: colaboradorNombre
              }
            ]
          }
        ]
      };

      // Inyectar checkboxes
      CAMPOS_ADMIN.forEach(c => {
        bitacora[c.key] = selectedChecks[c.key] ? 'Sí' : null;
      });
      CATEGORIAS_OP.flatMap(cat => cat.campos).forEach(c => {
        bitacora[c.key] = selectedChecks[c.key] ? 'Sí' : null;
      });

      // Insertar en Supabase
      const { error: insErr } = await supabase
        .from('bitacoras_jefes')
        .insert([bitacora]);

      if (insErr) throw insErr;

      try {
        const { data: staffList } = await supabase
          .from('empleados')
          .select('cedula')
          .in('cargo', ['Jefe', 'Subjefe', 'Tercero a bordo', 'Supervisor'])
          .eq('activo', true);

        if (staffList && staffList.length > 0) {
          const userNombres = user?.user_metadata?.nombres || 'Un Jefe';
          const notifications = staffList
            .filter(emp => emp.cedula !== user?.user_metadata?.cedula) // No notificarse a sí mismo
            .map(emp => ({
              usuario_cedula: emp.cedula,
              titulo: '📝 Nueva Bitácora de Jefes',
              mensaje: `${userNombres} ha creado una nueva bitácora de jefes para el local.`,
              tipo: 'bitacora',
              leido: false
            }));
          if (notifications.length > 0) {
            await supabase.from('notificaciones').insert(notifications);
          }
        }
      } catch (notifErr) {
        console.error('Error al insertar notificaciones de bitácora:', notifErr);
      }



      setSubmitSuccess(true);
      setUploadProgress(null);
      
      // Limpiar formulario
      setCumplimientoMeta('');
      setObservaciones('');
      setSelectedChecks({});
      setArchivos([]);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Error al guardar la bitácora. Por favor intente de nuevo.');
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
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
        <div className={`p-8 md:p-12 rounded-3xl border shadow-xl text-center animate-fade-in-up backdrop-blur-md relative overflow-hidden ${tc.cardBg}`} style={tc.cardBgStyle}>
          <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400 text-3xl shadow-lg shadow-emerald-500/10 animate-bounce">
            🎉
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 inline-block mb-3">
            ✅ Registro Confirmado en Portal Hub V8
          </span>
          <h2 className={`text-3xl md:text-4xl font-title font-black mb-4 ${tc.textPrimary}`}>
            ¡Bitácora Enviada con Éxito!
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto text-xs sm:text-sm leading-relaxed font-medium">
            Tu reporte diario de actividades administrativas y operativas ha sido registrado correctamente en la base de datos de Portal Hub V8.
          </p>
          <button 
            onClick={() => setSubmitSuccess(false)}
            className={`px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl transform active:scale-95 transition-all text-white theme-accent-bg hover:theme-accent-hover theme-accent-shadow cursor-pointer`}
          >
            ✍️ Llenar otra bitácora
          </button>
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
      {/* Selector Nav de Bitácoras */}
      {!hideHeaderNav && <BitacorasSelectorNav activeTab="nueva" />}

      {/* Progreso del Formulario */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full theme-accent-bg transition-all duration-500 ease-out rounded-full" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Cabecera */}
      <div className="mb-8 text-center md:text-left">
        <h1 className={`text-3xl md:text-4xl font-title font-black tracking-tight flex items-center justify-center md:justify-start gap-3 ${tc.textPrimary}`}>
          <ClipboardList className="w-8 h-8 theme-accent-text" />
          Bitácora Administrativa
        </h1>
        <p className={`mt-2 ${tc.textMuted}`}>
          Completa el reporte de actividades y novedades al cierre del turno diario de jefatura.
        </p>
      </div>

      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 text-red-500 flex items-start gap-3 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm">Error al enviar formulario</h4>
            <p className="text-xs text-red-500/80 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Selector de Pestañas de Cristal */}
      <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl mb-8 overflow-x-auto">
        {[
          { id: 'datos', label: 'Datos & Meta' },
          { id: 'admin', label: 'Administrativo' },
          { id: 'op', label: 'Operativo' },
          { id: 'evidencias', label: 'Evidencias' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-title font-extrabold text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-md dark:bg-slate-800 dark:text-white' 
                : 'text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido del Formulario */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* PESTAÑA: DATOS GENERALES */}
        {activeTab === 'datos' && (
          <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
            <h3 className={`text-xl font-title font-black border-b pb-4 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
              01. Datos Generales & Meta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                  Colaborador
                </label>
                <input 
                  type="text" 
                  value={colaboradorNombre} 
                  readOnly 
                  className={`w-full border rounded-2xl py-3.5 px-4 font-extrabold text-sm outline-none transition-all ${
                    activeTheme === 'oscuro'
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-300'
                      : 'bg-slate-100/90 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                  Cargo
                </label>
                <input 
                  type="text" 
                  value={cargoReal} 
                  readOnly 
                  className={`w-full border rounded-2xl py-3.5 px-4 font-extrabold text-sm outline-none transition-all ${
                    activeTheme === 'oscuro'
                      ? 'bg-slate-950/40 border-slate-800/60 text-slate-300'
                      : 'bg-slate-100/90 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                  Fecha del Reporte <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3.5 px-4 font-bold text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border focus:ring-1  transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                  Cumplimiento de Meta (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    min="0"
                    max="200"
                    step="0.01"
                    placeholder="Ej: 95.50"
                    value={cumplimientoMeta}
                    onChange={(e) => setCumplimientoMeta(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3.5 px-4 pr-12 font-bold text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border focus:ring-1  transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                  ¿Subiste autorizaciones del Centro Comercial?
                </label>
                <div className="flex gap-2">
                  {['Sí', 'No', 'No aplica'].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAutorizacionesCC(option)}
                      className={`flex-1 py-3.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                        autorizacionesCC === option
                          ? 'theme-accent-bg theme-accent-border text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                  ¿Revisaste el horario general?
                </label>
                <div className="flex gap-2">
                  {['Sí', 'No'].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRevisoHorario(option)}
                      className={`flex-1 py-3.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                        revisoHorario === option
                          ? 'theme-accent-bg theme-accent-border text-white shadow-md'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 block">
                Observaciones del Turno / Novedades
              </label>
              <textarea
                rows="4"
                placeholder="Escribe comentarios, novedades con el personal, incidentes o cualquier detalle del día..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl py-3.5 px-4 font-sans text-sm text-slate-800 dark:text-white outline-none focus:theme-accent-border focus:ring-1  transition-all resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Siguiente: checklist administrativo →
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA: CHECKLIST ADMINISTRATIVO */}
        {activeTab === 'admin' && (
          <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
            <div>
              <h3 className={`text-xl font-title font-black border-b pb-2 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
                02. Checklist Administrativo
              </h3>
              <p className="text-xs text-slate-400 mt-1">Marca todas las actividades que completaste el día de hoy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAMPOS_ADMIN.map(item => {
                const isChecked = !!selectedChecks[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleCheckChange(item.key)}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                      isChecked 
                        ? 'theme-accent-border/30 theme-accent-bg-soft text-slate-800 dark:text-white font-semibold' 
                        : 'border-slate-100 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all ${
                      isChecked 
                        ? 'theme-accent-bg theme-accent-border text-white shadow-md' 
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs md:text-sm leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('datos')}
                className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                ← Atrás
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('op')}
                className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Siguiente: checklist operativo →
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA: CHECKLIST OPERATIVO */}
        {activeTab === 'op' && (
          <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-8 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
            <div>
              <h3 className={`text-xl font-title font-black border-b pb-2 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
                03. Checklist Operativo (Piso de Ventas)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Marca las tareas operativas realizadas hoy, agrupadas por su categoría física en la tienda.</p>
            </div>

            <div className="space-y-8">
              {CATEGORIAS_OP.map((cat, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest theme-accent-text border-l-2 theme-accent-border pl-2">
                    {cat.titulo}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.campos.map(item => {
                      const isChecked = !!selectedChecks[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleCheckChange(item.key)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                            isChecked 
                              ? 'theme-accent-border/30 theme-accent-bg-soft text-slate-800 dark:text-white font-semibold' 
                              : 'border-slate-100 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 text-slate-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                            isChecked 
                              ? 'theme-accent-bg theme-accent-border text-white shadow-md' 
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs leading-tight">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                ← Atrás
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('evidencias')}
                className="px-6 py-3 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Siguiente: subir evidencias →
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA: EVIDENCIAS (FOTOS Y ARCHIVOS) */}
        {activeTab === 'evidencias' && (
          <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 animate-fade-in-up ${tc.cardBg}`} style={tc.cardBgStyle}>
            <div>
              <h3 className={`text-xl font-title font-black border-b pb-2 border-slate-200 dark:border-slate-800 ${tc.textPrimary}`}>
                04. Evidencias y Archivos
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

            {/* Progreso de Envío en Vivo */}
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
                onClick={() => setActiveTab('op')}
                className="px-6 py-3.5 rounded-2xl font-bold font-title text-sm border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                ← Checklist Operativo
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3.5 rounded-2xl font-bold font-title text-sm shadow-lg transform active:scale-95 transition-all text-white theme-accent-bg hover:theme-accent-hover theme-accent-shadow flex items-center gap-2.5 disabled:opacity-50`}
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
    </div>
  );
}