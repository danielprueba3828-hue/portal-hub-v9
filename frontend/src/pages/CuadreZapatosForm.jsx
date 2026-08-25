import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import { useTiendaStore } from '../store/tiendaStore';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Share2,
  Download,
  Search,
  ArrowRightLeft,
  X,
  ClipboardCopy,
  Check,
  RefreshCw,
  Info,
  Calendar,
  Database,
  History,
  PlusCircle,
  ArrowLeft
} from 'lucide-react';

// Helper para limpiar códigos ALU
const cleanALU = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  str = str.split('.')[0].replace(/\s+/g, '').replace(/^0+/, '');
  return str;
};

// Helper para limpiar tallas
const cleanTalla = (val) => {
  if (val === null || val === undefined) return '-';
  let str = String(val).trim();
  if (str.includes('1900-01-')) {
    const parts = str.split(' ')[0].split('-');
    const day = parseInt(parts[2]);
    if (!isNaN(day)) {
      let size = day;
      if (str.includes('12:00') || str.includes('12:00:00')) {
        size += 0.5;
      }
      return String(size);
    }
  }
  if (str.endsWith('.0')) {
    str = str.substring(0, str.length - 2);
  }
  return str;
};

// Helper para extraer modelo limpio desde el campo Description2 de Reporte de Piso
const extractModeloFromDesc2 = (desc2, desc1, talla) => {
  if (!desc2) return '';
  let str = String(desc2).trim();
  if (talla) {
    const tallaStr = String(talla).trim();
    const commaTalla = ',' + tallaStr;
    if (str.endsWith(commaTalla)) {
      str = str.substring(0, str.length - commaTalla.length);
    } else {
      const lastComma = str.lastIndexOf(',');
      if (lastComma !== -1) {
        const afterComma = str.substring(lastComma + 1).trim();
        if (afterComma === tallaStr || afterComma.replace(/\.0$/, '') === tallaStr.replace(/\.0$/, '')) {
          str = str.substring(0, lastComma);
        }
      }
    }
  }
  if (str.endsWith(',')) {
    str = str.substring(0, str.length - 1);
  }
  if (desc1) {
    const words = String(desc1).split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 0) {
      const firstWord = words[0].toLowerCase();
      const idx = str.toLowerCase().indexOf(firstWord);
      if (idx > 0) {
        str = str.substring(0, idx);
      }
    }
    const descIdx = str.toLowerCase().lastIndexOf(String(desc1).toLowerCase());
    if (descIdx !== -1) {
      str = str.substring(0, descIdx);
    }
  }
  return str.trim();
};



// Helper para buscar claves de forma case-insensitive
const getRowValue = (row, possibleKeys) => {
  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase().trim().replace(/_/g, ' ');
    for (const pKey of possibleKeys) {
      if (lowerKey === pKey.toLowerCase()) {
        return row[key];
      }
    }
  }
  return undefined;
};

export default function CuadreZapatosForm({ onTabChange, selectedFecha, onFechaChange }) {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();
  const { tiendaSeleccionada } = useTiendaStore();
  
  const myTheme = getEmployeeTheme(
    user?.user_metadata?.cargo || 'Asesor de Ventas',
    user?.user_metadata?.nombres || '',
    user?.user_metadata?.cargo_anterior || ''
  );
  const tc = getThemeClasses(activeTheme, myTheme);

  // Estados de archivos cargados
  const [pisoFile, setPisoFile] = useState(null);
  const [tipeoFile, setTipeoFile] = useState(null);

  // Datos crudos leídos de Excel
  const [pisoData, setPisoData] = useState([]);
  const [tipeoData, setTipeoData] = useState([]);
  const [catalogData, setCatalogData] = useState({});

  // Estados de carga e interfaz
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlFecha = searchParams.get('fecha');

  const [loading, setLoading] = useState(false);
  const [reconciledResult, setReconciledResult] = useState(null);
  const [activeTab, setActiveTab] = useState('missing');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Estado para ajustes manuales en caliente (Key: index de la fila del Excel original, Value: 'Cuadrado' | 'Faltante Confirmado')
  const [manualAdjustments, setManualAdjustments] = useState({});
  // Estado para clasificaciones manuales de devoluciones (Key: index de la fila del Excel original, Value: 'Ingreso' | 'Garantía')
  const [manualReturnTypes, setManualReturnTypes] = useState({});

  // Estados para guardar en base de datos
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fechaCierre, setFechaCierre] = useState(() => {
    if (selectedFecha) return selectedFecha;
    if (urlFecha) return urlFecha;
    try {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(new Date());
    } catch {
      return new Date().toLocaleDateString('sv-SE');
    }
  });

  // Sincronizar fecha seleccionada desde el historial
  useEffect(() => {
    if (selectedFecha) {
      setFechaCierre(selectedFecha);
    }
  }, [selectedFecha]);

  // Referencias a inputs de archivos
  const pisoInputRef = useRef(null);
  const tipeoInputRef = useRef(null);

  const isBodeguero = user?.user_metadata?.cargo === 'Bodeguero';

  // ── Sistema de Borrador (localStorage) ──
  const draftKey = tiendaSeleccionada?.id ? `cuadre_draft_${tiendaSeleccionada.id}` : null;
  const isRestoringDraft = useRef(false);
  const draftRestored = useRef(false);

  // Restaurar borrador al montar
  useEffect(() => {
    if (!draftKey || draftRestored.current) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || !draft.pisoData?.length) return;
      isRestoringDraft.current = true;
      draftRestored.current = true;
      setPisoData(draft.pisoData || []);
      setTipeoData(draft.tipeoData || []);
      setCatalogData(draft.catalogData || {});
      setReconciledResult(draft.reconciledResult || null);
      setManualAdjustments(draft.manualAdjustments || {});
      setManualReturnTypes(draft.manualReturnTypes || {});
      if (draft.fechaCierre) {
        setFechaCierre(draft.fechaCierre);
        if (onFechaChange) onFechaChange(draft.fechaCierre);
      }
      if (draft.pisoFileName) setPisoFile({ name: draft.pisoFileName });
      if (draft.tipeoFileName) setTipeoFile({ name: draft.tipeoFileName });
      // Desactivar flag después de un ciclo de render para que los effects no limpien
      setTimeout(() => { isRestoringDraft.current = false; }, 500);
      console.log('[Borrador] Restaurado correctamente');
    } catch (err) {
      console.warn('[Borrador] Error al restaurar:', err);
    }
  }, [draftKey]);

  // Auto-guardar borrador cuando cambian datos importantes
  useEffect(() => {
    if (!draftKey || isRestoringDraft.current) return;
    // Solo guardar si hay datos cargados (pisoData con contenido)
    if (pisoData.length === 0 && !reconciledResult) return;
    try {
      const draft = {
        pisoData,
        tipeoData,
        catalogData,
        reconciledResult,
        manualAdjustments,
        manualReturnTypes,
        fechaCierre,
        pisoFileName: pisoFile?.name || null,
        tipeoFileName: tipeoFile?.name || null,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (err) {
      console.warn('[Borrador] Error al guardar:', err);
    }
  }, [draftKey, pisoData, tipeoData, catalogData, reconciledResult, manualAdjustments, manualReturnTypes, fechaCierre]);

  // Helper para limpiar borrador
  const clearDraft = () => {
    if (draftKey) {
      localStorage.removeItem(draftKey);
      console.log('[Borrador] Limpiado');
    }
  };

  // Cargar cuadre previamente guardado desde Supabase
  const fetchSavedClosure = async (dateVal) => {
    if (!tiendaSeleccionada?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cuadres_zapatos')
        .select('*')
        .eq('tienda_id', tiendaSeleccionada.id)
        .eq('fecha', dateVal)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setReconciledResult({
          reconciled: data.detalles_reconciliados || [],
          missing: data.detalles_faltantes || [],
          surplus: data.detalles_sobrantes || [],
          returnsList: data.detalles_ingresos_garantias || [],
          totalFloor: data.total_solicitados,
          totalReconciled: data.total_conciliados,
          totalMissing: data.total_faltantes,
          totalSurplus: data.total_sobrantes || 0,
          isFromDB: true,
          colaboradorCierre: data.colaborador,
          savedAt: data.created_at,
          totalVentas: data.total_ventas || 0,
          totalTipeo: data.total_tipeo || 0,
          totalFloorDevoluciones: data.total_floor_devoluciones || 0,
          totalAjustesManuales: data.total_ajustes_manuales || 0
        });
        setSaveSuccess(true);
      } else {
        setReconciledResult(null);
        setSaveSuccess(false);
      }
    } catch (err) {
      console.error("Error al cargar cierre guardado:", err);
    } finally {
      setLoading(false);
    }
  };



  // La consulta al historial se hace manualmente desde el botón o desde el tab de historial
  // No hay recarga automática de datos

  // Manejador para arrastrar y soltar
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, fileType) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file, fileType);
    }
  };

  // Procesar archivo Excel
  const processFile = (file, fileType) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let sheetName = workbook.SheetNames[0];
        
        if (fileType === 'tipeo') {
          // Intentar leer la hoja TIPEO
          const foundTipeoSheet = workbook.SheetNames.find(
            (name) => name.toUpperCase() === 'TIPEO'
          );
          if (foundTipeoSheet) {
            sheetName = foundTipeoSheet;
          }
          
          // Intentar leer también la hoja pegarstock para catálogo maestro
          const foundStockSheet = workbook.SheetNames.find(
            (name) => name.toLowerCase() === 'pegarstock'
          );
          if (foundStockSheet) {
            try {
              const stockSheet = workbook.Sheets[foundStockSheet];
              const stockJson = XLSX.utils.sheet_to_json(stockSheet);
              const catalog = {};
              stockJson.forEach((row) => {
                const materialVal = getRowValue(row, ['material', 'material.1']);
                const cortoVal = getRowValue(row, ['corto']);
                const upcVal = getRowValue(row, ['upc']);
                
                const material = cleanALU(materialVal);
                const corto = cleanALU(cortoVal);
                const upc = cleanALU(upcVal);

                const item = {
                  desc: String(getRowValue(row, ['descripcion1', 'descripcion2']) || '').trim(),
                  talla: String(getRowValue(row, ['talla']) || '-').trim(),
                  modelo: String(getRowValue(row, ['modelo']) || '').trim(),
                  stock: parseInt(getRowValue(row, ['cantidad', 'cant', 'stock', 'unidades'])) || 0,
                  upc: upc,
                  material: material,
                  corto: corto
                };

                if (material) catalog[material] = item;
                if (corto) catalog[corto] = item;
                if (upc) catalog[upc] = item;
              });
              setCatalogData(catalog);
            } catch (err) {
              console.error("Error al procesar hoja pegarstock:", err);
            }
          }
        }

        const worksheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (fileType === 'piso') {
          setPisoFile(file);
          setPisoData(jsonData);
        } else if (fileType === 'tipeo') {
          setTipeoFile(file);
          setTipeoData(jsonData);
        }
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        alert(`Error al leer el archivo Excel: ${error.message}. Por favor, asegúrate de que sea un archivo .xlsx válido.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file, fileType);
    }
  };

  const removeFile = (fileType) => {
    if (fileType === 'piso') {
      setPisoFile(null);
      setPisoData([]);
    } else if (fileType === 'tipeo') {
      setTipeoFile(null);
      setTipeoData([]);
      setCatalogData({});
    }
    // Limpiar estados de resultados y ajustes
    setReconciledResult(null);
    setManualAdjustments({});
    setManualReturnTypes({});
    setSaveSuccess(false);
  };

  // Lógica principal de conciliación (FIFO)
  const calculateReconciliation = async () => {
    if (pisoData.length === 0 || tipeoData.length === 0) {
      alert("Es necesario cargar los archivos de 'Reporte de Piso' y 'Zapatos Tipeo' para calcular el cuadre.");
      return;
    }

    setLoading(true);
    setSaveSuccess(false);
    setManualAdjustments({});

    try {
      // 0. Cargar devoluciones escaneadas desde Supabase para la tienda y fecha seleccionada
      const { data: dbReturns, error: dbError } = await supabase
        .from('registro_devoluciones')
        .select('*')
        .eq('tienda_id', tiendaSeleccionada?.id)
        .eq('fecha', fechaCierre);

      if (dbError) throw dbError;
      const scansList = dbReturns || [];

      // 1. Indexar retornos físicos (Zapatos Tipeo) con resolución de clave canónica (Material)
      const returnedCounts = {};
      tipeoData.forEach((row) => {
        const rawAlu = cleanALU(getRowValue(row, ['material', 'alu', 'upc', 'codigo']));
        if (rawAlu) {
          const catalogItem = catalogData[rawAlu];
          const alu = catalogItem?.material || catalogItem?.corto || rawAlu;
          returnedCounts[alu] = (returnedCounts[alu] || 0) + 1;
        }
      });

      // 1b. Indexar devoluciones desde la Base de Datos
      const dbReturnsByALU = {};
      scansList.forEach((row) => {
        const alu = cleanALU(row.alu);
        if (alu) {
          dbReturnsByALU[alu] = (dbReturnsByALU[alu] || 0) + 1;
        }
      });

      // 1c. Se eliminó la extracción automática de devoluciones desde el reporte de piso Excel (los devueltos de piso no son ingresos).

      // 2. Formatear y limpiar solicitudes y ventas a piso
      const mappedPiso = pisoData
        .map((row, index) => {
          const rawAlu = cleanALU(getRowValue(row, ['alu', 'material', 'codigo', 'corto', 'upc']));
          if (!rawAlu) return null;

          const vendedor = String(getRowValue(row, ['vendedor', 'vendedor p.', 'vendedor pedido']) || 'Desconocido').trim();
          const desc = String(getRowValue(row, ['description1', 'descripcion1', 'descripcion', 'description']) || 'Sin descripción').trim();
          const talla = cleanTalla(getRowValue(row, ['talla', 'size']));
          const estado = String(getRowValue(row, ['estado', 'status']) || 'entregado').trim();
          const factura = String(getRowValue(row, ['factura', 'invoice']) || '').trim();
          const fecha = String(getRowValue(row, ['fecha pedido', 'fecha_pedido', 'fecha', 'hora', 'date']) || '').trim();
          const tipoPedido = String(getRowValue(row, ['tipo pedido', 'tipo_pedido', 'tipo']) || '').trim().toLowerCase();
          const movVal = getRowValue(row, ['movimiento', 'mov']);
          const mov = parseFloat(movVal) || 0;

          const isReturn = estado.toLowerCase().trim() === 'devuelto' || mov > 0;
          const isSold =
            estado.toLowerCase() === 'vendido' ||
            estado.toLowerCase() === 'venta' ||
            estado.toLowerCase().startsWith('factur') ||
            (factura !== '' && factura.toLowerCase() !== 'nan' && factura.toLowerCase() !== 'null');

          // Resolver modelo, stock y ALU canónica desde el catálogo de tipeo
          const catalogItem = catalogData[rawAlu];
          const alu = catalogItem?.material || catalogItem?.corto || rawAlu;
          let modelo = catalogItem?.modelo || '';
          const stock = catalogItem?.stock || 0;
          const finalDesc = catalogItem?.desc || desc;
          const upc = catalogItem?.upc || '';

          // Intentar extraer el modelo desde Description2 (Piso) si no está en catálogo
          if (!modelo) {
            const desc2 = String(getRowValue(row, ['description2', 'descripcion2']) || '').trim();
            modelo = extractModeloFromDesc2(desc2, desc, talla);
          }

          return {
            index: index + 2, // Fila en excel original (1-indexed + header)
            alu,
            modelo,
            stock,
            upc,
            vendedor,
            desc: finalDesc,
            talla,
            estado,
            factura: (factura.toLowerCase() === 'nan' || factura.toLowerCase() === 'null') ? '' : factura,
            fecha,
            tipoPedido,
            isReturn,
            isSold
          };
        })
        .filter(Boolean);

      const requests = mappedPiso.filter(r => !r.isReturn && (r.tipoPedido === 'ambos' || r.tipoPedido === 'derecho' || r.tipoPedido === 'derechos'));
      const sales = mappedPiso.filter(r => r.isSold);

      // 3. Agrupar solicitudes por ALU
      const requestsByALU = {};
      requests.forEach((req) => {
        if (!requestsByALU[req.alu]) {
          requestsByALU[req.alu] = [];
        }
        requestsByALU[req.alu].push(req);
      });

      // Agrupar ventas por ALU
      const salesByALU = {};
      sales.forEach((sale) => {
        if (!salesByALU[sale.alu]) {
          salesByALU[sale.alu] = [];
        }
        salesByALU[sale.alu].push(sale);
      });

      // Ordenar solicitudes cronológicamente
      Object.keys(requestsByALU).forEach((alu) => {
        requestsByALU[alu].sort((a, b) => {
          if (!a.fecha) return 1;
          if (!b.fecha) return -1;
          return a.fecha.localeCompare(b.fecha);
        });
      });

      const reconciledRows = [];
      const missingRows = [];
      const unrequestedSales = [];

      // 4. Cruzar cada ALU
      const allALUs = new Set([
        ...Object.keys(requestsByALU),
        ...Object.keys(salesByALU),
        ...Object.keys(returnedCounts)
      ]);

      allALUs.forEach((alu) => {
        const aluRequests = requestsByALU[alu] || [];
        const aluSales = salesByALU[alu] || [];
        const tipeoRet = returnedCounts[alu] || 0;
        const dbRet = dbReturnsByALU[alu] || 0;
        const combinedRet = Math.max(tipeoRet, dbRet);

        const numReqs = aluRequests.length;
        const numSales = aluSales.length;

        const totalReconciledUnits = numSales + combinedRet;

        // Asignación FIFO
        aluRequests.forEach((req, idx) => {
          if (idx < totalReconciledUnits) {
            let source = 'Venta';
            if (idx >= numSales) {
              if (idx - numSales < tipeoRet) {
                source = 'Devolución (Bodega)';
              } else {
                source = 'Devolución (Ingreso Piso)';
              }
            }
            reconciledRows.push({
              ...req,
              reconciledBy: source
            });
          } else {
            const catalogItem = catalogData[alu];
            if (catalogItem && catalogItem.stock === 0) {
              reconciledRows.push({
                ...req,
                reconciledBy: 'Venta (Stock 0)'
              });
            } else {
              missingRows.push({
                ...req,
                reconciledBy: 'Faltante'
              });
            }
          }
        });

        // Detectar ventas sin pedido (ventas que superan a las solicitudes)
        if (numSales > numReqs) {
          for (let idx = numReqs; idx < numSales; idx++) {
            unrequestedSales.push({
              ...aluSales[idx],
              reconciledBy: 'Venta sin Pedido'
            });
          }
        }
      });

      // 4b. Formatear la lista de devoluciones de la base de datos (returnsList)
      const rawDbReturns = scansList.map((dbRow) => {
        const alu = cleanALU(dbRow.alu);
        
        // Buscar datos en catálogo o pisoData
        const catalogItem = catalogData[alu];
        let modelo = dbRow.modelo || catalogItem?.modelo || '';
        let talla = dbRow.talla || cleanTalla(catalogItem?.talla) || '-';
        const stock = catalogItem?.stock || 0;
        let desc = catalogItem?.desc || 'Devolución Escaneada';

        if (!modelo) {
          const matchInPiso = pisoData.find(
            (row) => cleanALU(getRowValue(row, ['alu', 'material', 'codigo', 'corto'])) === alu
          );
          if (matchInPiso) {
            const desc1 = String(getRowValue(matchInPiso, ['description1', 'descripcion1', 'descripcion', 'description']) || '').trim();
            const desc2 = String(getRowValue(matchInPiso, ['description2', 'descripcion2']) || '').trim();
            talla = cleanTalla(getRowValue(matchInPiso, ['talla', 'size']));
            modelo = extractModeloFromDesc2(desc2, desc1, talla);
            desc = desc1;
          }
        }

        return {
          index: dbRow.id, // ID en base de datos para mapeo de cambios
          alu,
          modelo,
          talla,
          stock,
          vendedor: dbRow.colaborador,
          desc,
          estado: 'Escaneado por Cajera',
          factura: dbRow.tipo === 'Garantía' ? 'Garantía' : 'Ingreso',
          fecha: new Date(dbRow.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
          tipo: dbRow.tipo,
          id: dbRow.id
        };
      });

      const tipeoCopy = { ...returnedCounts };
      const returnsList = rawDbReturns.map((item) => {
        let statusFisico = 'Pendiente Tipeo';
        if (tipeoCopy[item.alu] > 0) {
          statusFisico = 'Cuadrado';
          tipeoCopy[item.alu]--;
        }
        return {
          ...item,
          statusFisico
        };
      });

      // 5. Almacenar resultado inicial
      setReconciledResult({
        reconciled: reconciledRows,
        missing: missingRows,
        surplus: unrequestedSales,
        returnsList,
        totalFloor: requests.length,
        totalReconciled: reconciledRows.length,
        totalMissing: missingRows.length,
        totalSurplus: unrequestedSales.length,
      });

      if (missingRows.length > 0) {
        setActiveTab('missing');
      } else {
        setActiveTab('reconciled');
      }
    } catch (err) {
      console.error("Error al calcular la conciliación:", err);
      alert(`Error al calcular conciliación: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CÁLCULO REACTIVO DE RESULTADOS AJUSTADOS MANUALMENTE
  const getAdjustedResults = () => {
    if (!reconciledResult) return null;

    if (reconciledResult.isFromDB) {
      return reconciledResult;
    }

    const adjustedMissing = [];
    const adjustedReconciled = [...reconciledResult.reconciled];

    reconciledResult.missing.forEach((item) => {
      const adjustment = manualAdjustments[item.index];
      
      if (adjustment === 'Cuadrado') {
        adjustedReconciled.push({
          ...item,
          reconciledBy: 'Ajuste Manual'
        });
      } else {
        adjustedMissing.push({
          ...item,
          estadoInterno: adjustment || 'Faltante Pendiente' // 'Faltante Pendiente' o 'Faltante Confirmado'
        });
      }
    });

    // Ajustar tipos de retorno (Ingreso / Garantía) de forma manual
    const adjustedReturns = (reconciledResult.returnsList || []).map((item) => {
      const manualType = manualReturnTypes[item.index];
      return {
        ...item,
        tipo: manualType || item.tipo
      };
    });

    const totalFloor = reconciledResult.totalFloor;
    const totalReconciled = adjustedReconciled.length;
    const totalMissing = adjustedMissing.length;
    const totalSurplus = reconciledResult.surplus ? reconciledResult.surplus.length : 0;

    return {
      reconciled: adjustedReconciled,
      missing: adjustedMissing,
      surplus: reconciledResult.surplus || [],
      returnsList: adjustedReturns,
      totalFloor,
      totalReconciled,
      totalMissing,
      totalSurplus,
    };
  };

  const adjustedResult = getAdjustedResults();

  // Desglose detallado de unidades conciliadas
  const salesCount = adjustedResult?.isFromDB
    ? (adjustedResult.totalVentas || 0)
    : (adjustedResult?.reconciled.filter(r => r.reconciledBy === 'Venta' || r.reconciledBy === 'Venta (Stock 0)').length || 0);

  const tipeoCount = adjustedResult?.isFromDB
    ? (adjustedResult.totalTipeo || 0)
    : (adjustedResult?.reconciled.filter(r => r.reconciledBy === 'Devolución (Bodega)').length || 0);

  const floorCount = adjustedResult?.isFromDB
    ? (adjustedResult.totalFloorDevoluciones || 0)
    : (adjustedResult?.reconciled.filter(r => r.reconciledBy === 'Devolución (Ingreso Piso)').length || 0);

  const manualCount = adjustedResult?.isFromDB
    ? (adjustedResult.totalAjustesManuales || 0)
    : (adjustedResult?.reconciled.filter(r => r.reconciledBy === 'Ajuste Manual').length || 0);

  // Contadores específicos de Ingresos y Garantías
  const totalIngresos = adjustedResult?.returnsList?.filter(r => r.tipo === 'Ingreso').length || 0;
  const totalGarantias = adjustedResult?.returnsList?.filter(r => r.tipo === 'Garantía').length || 0;

  // Guardar el cuadre actual en la base de datos (Supabase)
  const saveReconciliationToDB = async () => {
    if (!adjustedResult) return;
    setSaving(true);

    try {
      const colaboradorNombre = `${user?.user_metadata?.nombres || ''} ${user?.user_metadata?.apellidos || ''}`.trim();
      const payload = {
        fecha: fechaCierre,
        tienda_id: tiendaSeleccionada?.id || null,
        colaborador: colaboradorNombre || 'Usuario Web',
        total_solicitados: adjustedResult.totalFloor,
        total_conciliados: adjustedResult.totalReconciled,
        total_faltantes: adjustedResult.totalMissing,
        total_sobrantes: adjustedResult.totalSurplus,
        detalles_faltantes: adjustedResult.missing,
        detalles_sobrantes: adjustedResult.surplus,
        detalles_reconciliados: adjustedResult.reconciled,
        total_ingresos: totalIngresos,
        total_garantias: totalGarantias,
        detalles_ingresos_garantias: adjustedResult.returnsList,
        total_ventas: salesCount,
        total_tipeo: tipeoCount,
        total_floor_devoluciones: floorCount,
        total_ajustes_manuales: manualCount
      };

      // Verificar si ya existe un cuadre para evitar duplicaciones
      const { data: existingData, error: checkError } = await supabase
        .from('cuadres_zapatos')
        .select('id')
        .eq('tienda_id', tiendaSeleccionada?.id)
        .eq('fecha', fechaCierre)
        .maybeSingle();

      if (checkError) console.error("Error al verificar cuadre existente:", checkError);

      let savedData;
      if (existingData?.id) {
        // Actualizar cuadre existente
        const { data, error } = await supabase
          .from('cuadres_zapatos')
          .update(payload)
          .eq('id', existingData.id)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      } else {
        // Insertar nuevo cuadre
        const { data, error } = await supabase
          .from('cuadres_zapatos')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      }

      // Actualizar registro_devoluciones para asociar el cuadre_id y marcar procesado
      if (savedData?.id && adjustedResult.returnsList && adjustedResult.returnsList.length > 0) {
        const scanIds = adjustedResult.returnsList.map(r => r.id).filter(Boolean);
        if (scanIds.length > 0) {
          const { error: updateError } = await supabase
            .from('registro_devoluciones')
            .update({ procesado: true, cuadre_id: savedData.id })
            .in('id', scanIds);
          if (updateError) {
            console.error("Error al actualizar registro_devoluciones:", updateError);
          }
        }
      }

      setSaveSuccess(true);
      clearDraft();
      alert("¡El cuadre de zapatos diario ha sido guardado en el historial con éxito!");
      await fetchSavedClosure(fechaCierre);
    } catch (err) {
      console.error("Error al guardar el cuadre en la base de datos:", err);
      alert("Error al guardar en base de datos: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Exportar los resultados en formato Excel
  const exportToExcel = () => {
    if (!adjustedResult) return;

    try {
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen de Indicadores
      const summaryData = [
        { "Métrica": "Total Solicitados a Piso", "Unidades": adjustedResult.totalFloor },
        { "Métrica": "Unidades Conciliadas (Vendidas o Devueltas)", "Unidades": adjustedResult.totalReconciled },
        { "Métrica": "  - Reconciliados por Ventas", "Unidades": salesCount },
        { "Métrica": "  - Devoluciones en Bodega (Tipeo)", "Unidades": tipeoCount },
        { "Métrica": "  - Devoluciones en Piso (Ingresos combinados)", "Unidades": floorCount },
        { "Métrica": "    * Devoluciones normal (Ingresos)", "Unidades": totalIngresos },
        { "Métrica": "    * Garantías procesadas", "Unidades": totalGarantias },
        { "Métrica": "  - Ajustes Manuales", "Unidades": manualCount },
        { "Métrica": "Unidades Faltantes (Perdidas)", "Unidades": adjustedResult.totalMissing },
        { "Métrica": "Ventas sin Pedido (Sobrantes)", "Unidades": adjustedResult.totalSurplus }
      ];
      summaryData.push({ "Métrica": "Eficiencia de Cuadre", "Unidades": `${((adjustedResult.totalReconciled / adjustedResult.totalFloor) * 100 || 0).toFixed(2)}%` });

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "RESUMEN CUADRE");

      // Hoja 2: Faltantes detallados
      const missingData = adjustedResult.missing.map((r, i) => ({
        "Nº": i + 1,
        "Fila Excel Original": r.index,
        "ALU (Código)": r.alu,
        "Modelo": r.modelo || '',
        "Talla": r.talla,
        "Stock Catálogo": r.stock || 0,
        "Vendedor": r.vendedor,
        "Hora de Pedido": r.fecha,
        "Estado en Reporte": r.estado,
        "Estado de Cuadre": r.estadoInterno
      }));
      const wsMissing = XLSX.utils.json_to_sheet(missingData);
      XLSX.utils.book_append_sheet(wb, wsMissing, "FALTANTES BODEGA");

      // Hoja 3: Ingresos y Garantías
      const returnsData = (adjustedResult.returnsList || []).map((r, i) => ({
        "Nº": i + 1,
        "Fila Excel Original": r.index,
        "ALU (Código)": r.alu,
        "Modelo": r.modelo || '',
        "Talla": r.talla,
        "Stock Catálogo": r.stock || 0,
        "Vendedor": r.vendedor,
        "Factura / Documento": r.factura || 'Sin Doc',
        "Tipo": r.tipo,
        "Estado Tipeo": r.statusFisico,
        "Fecha de Pedido": r.fecha
      }));
      const wsReturns = XLSX.utils.json_to_sheet(returnsData);
      XLSX.utils.book_append_sheet(wb, wsReturns, "INGRESOS Y GARANTIAS");

      // Hoja 4: Ventas sin Pedido
      if (adjustedResult.surplus && adjustedResult.surplus.length > 0) {
        const surplusData = adjustedResult.surplus.map((r, i) => ({
          "Nº": i + 1,
          "Fila Excel Original": r.index,
          "ALU (Código)": r.alu,
          "Modelo": r.modelo || '',
          "Talla": r.talla,
          "Stock Catálogo": r.stock || 0,
          "Vendedor": r.vendedor,
          "Factura / Documento": r.factura || 'Sin Doc',
          "Estado en Reporte": r.estado
        }));
        const wsSurplus = XLSX.utils.json_to_sheet(surplusData);
        XLSX.utils.book_append_sheet(wb, wsSurplus, "VENTAS SIN PEDIDO");
      }

      // Descargar archivo
      XLSX.writeFile(wb, `Cuadre_Zapatos_Bodega_${fechaCierre}.xlsx`);
    } catch (e) {
      console.error("Error al exportar a Excel:", e);
      alert("Error al exportar Excel: " + e.message);
    }
  };

  // Copiar resumen de faltantes para enviar por WhatsApp
  const copyWhatsAppSummary = () => {
    if (!adjustedResult) return;

    const dateStr = new Date(fechaCierre + 'T12:00:00').toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let text = `*CUADRE DIARIO DE ZAPATOS - BODEGA*\n`;
    text += `_Fecha Cierre: ${dateStr}_\n\n`;
    text += `*RESUMEN GENERAL:*\n`;
    text += `• Total Solicitados a Piso: ${adjustedResult.totalFloor} pares\n`;
    text += `• Total Conciliados: ${adjustedResult.totalReconciled} pares\n`;
    text += `  - Reconciliados por Ventas: ${salesCount} pares\n`;
    text += `  - Devoluciones en Bodega (Tipeo): ${tipeoCount} pares\n`;
    text += `  - Devoluciones en Piso (Ingresos comb.): ${floorCount} pares\n`;
    text += `    * Ingresos (Devolución normal): ${totalIngresos} pares\n`;
    text += `    * Garantías procesadas: ${totalGarantias} pares\n`;
    if (manualCount > 0) {
      text += `  - Ajustes Manuales: ${manualCount} pares\n`;
    }
    text += `• *TOTAL FALTANTES BODEGA: ${adjustedResult.totalMissing} pares* ⚠️\n`;
    text += `• *VENTAS SIN PEDIDO (EXCEDENTES): ${adjustedResult.totalSurplus} pares* ℹ️\n`;
    text += `• Eficiencia de Cuadre: *${((adjustedResult.totalReconciled / adjustedResult.totalFloor) * 100 || 0).toFixed(2)}%*\n\n`;

    if (adjustedResult.returnsList && adjustedResult.returnsList.length > 0) {
      text += `*DETALLE DE INGRESOS Y GARANTÍAS (${adjustedResult.returnsList.length} pares):*\n`;
      adjustedResult.returnsList.forEach((r, idx) => {
        text += `${idx + 1}. *ALU:* \`${r.alu}\` | *Mod:* ${r.modelo || '-'} | *Talla:* ${r.talla} | *Tipo:* ${r.tipo} | *Doc:* ${r.factura || 'Sin Doc'} | *Estado:* ${r.statusFisico}\n`;
      });
      text += `\n`;
    }

    if (adjustedResult.totalMissing > 0) {
      text += `*DETALLE DE PARES FALTANTES:*\n`;
      adjustedResult.missing.forEach((r, idx) => {
        const confirmedTag = r.estadoInterno === 'Faltante Confirmado' ? ' [CONFIRMADO]' : '';
        text += `${idx + 1}. *ALU:* \`${r.alu}\` | *Mod:* ${r.modelo || '-'} | *Talla:* ${r.talla} | *Stock Cat:* ${r.stock || 0} | *Vendedor:* ${r.vendedor} | *Hora:* ${r.fecha.split(' ')[1] || r.fecha}${confirmedTag}\n`;
      });
      text += `\n`;
    } else {
      text += `¡Felicidades! Todo cuadrado al 100%. No hay pares faltantes en bodega el día de hoy. 🎉\n\n`;
    }

    if (adjustedResult.totalSurplus > 0) {
      text += `*DETALLE DE VENTAS SIN PEDIDO EN BODEGA (${adjustedResult.totalSurplus} pares):*\n`;
      adjustedResult.surplus.forEach((r, idx) => {
        text += `${idx + 1}. *ALU:* \`${r.alu}\` | *Mod:* ${r.modelo || '-'} | *Talla:* ${r.talla} | *Vendedor:* ${r.vendedor} | *Factura:* ${r.factura || 'Sin Doc'}\n`;
      });
      text += `\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Filtrar los datos en base a la barra de búsqueda
  const getFilteredData = () => {
    if (!adjustedResult) return [];

    let dataset = [];
    if (activeTab === 'missing') dataset = adjustedResult.missing;
    else if (activeTab === 'returns') dataset = adjustedResult.returnsList;
    else if (activeTab === 'surplus') dataset = adjustedResult.surplus || [];
    else dataset = adjustedResult.reconciled;

    if (!searchTerm.trim()) return dataset;

    const term = searchTerm.toLowerCase();
    return dataset.filter(
      (item) =>
        String(item.alu).toLowerCase().includes(term) ||
        String(item.modelo || '').toLowerCase().includes(term) ||
        String(item.desc || '').toLowerCase().includes(term) ||
        String(item.vendedor || '').toLowerCase().includes(term)
    );
  };

  const filteredItems = getFilteredData();

  return (
    <div className="space-y-6">
      
      {/* Cabecera de Página Simplificada */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className={`text-xl font-title font-black tracking-wider flex items-center gap-2.5 ${tc.textPrimary}`}>
            <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            CUADRE DIARIO DE ZAPATOS
          </h3>
          <p className={`text-xs mt-0.5 ${tc.textMuted}`}>
            Conciliación de pares entre pedidos a piso (vendedores) y devoluciones físicas escaneadas en bodega.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Fecha */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-2xl shadow-inner">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-slate-450 font-black uppercase tracking-wider">Fecha Cierre:</span>
            <input
              type="date"
              value={fechaCierre}
              onChange={(e) => {
                const newFecha = e.target.value;
                setFechaCierre(newFecha);
                setSaveSuccess(false);
                if (onFechaChange) {
                  onFechaChange(newFecha);
                }
              }}
              className="bg-transparent text-white text-xs font-bold outline-none border-none cursor-pointer"
            />
          </div>

          {/* Botón Crear Nuevo Cuadre (para Bodegueros en Cierre Diario cuando hay un resultado o se visualiza el del historial) */}
          {reconciledResult && isBodeguero && (
            <button
              onClick={() => {
                setPisoFile(null);
                setTipeoFile(null);
                setPisoData([]);
                setTipeoData([]);
                setCatalogData({});
                setReconciledResult(null);
                setManualAdjustments({});
                setManualReturnTypes({});
                setSaveSuccess(false);
                clearDraft();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl border border-blue-500/30 transition-all text-xs cursor-pointer shadow-md transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Crear Nuevo Cuadre
            </button>
          )}
        </div>
      </div>

      {/* Banner de Cierre Histórico */}
      {reconciledResult && reconciledResult.isFromDB && (
        <div className="w-full px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-400 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-indigo-400" />
            <span>
              <strong>Visualizando Cierre Guardado ({reconciledResult.savedAt ? new Date(reconciledResult.savedAt).toLocaleDateString('es-EC') : fechaCierre}):</strong> Guardado por <strong className="text-white">{reconciledResult.colaboradorCierre || 'Desconocido'}</strong>.
            </span>
          </div>
          <button
            onClick={() => onTabChange ? onTabChange('historial') : navigate('/bodega/cuadre/historial')}
            className="flex items-center gap-1 font-bold text-xs text-indigo-450 hover:text-white underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Historial
          </button>
        </div>
      )}

      {/* Carga y Re-carga de archivos Excel */}
      {isBodeguero ? (
        <div className={`p-6 rounded-3xl border mb-8 transition-all ${reconciledResult ? 'bg-slate-950/40 border-slate-800/80 shadow-md' : 'bg-transparent border-transparent p-0'}`}>
          {reconciledResult && (
            <div className="flex items-center justify-between border-b pb-3 mb-5 border-slate-800">
              <div className="flex items-center space-x-2.5 text-left">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Actualizar / Re-cargar Archivos de Cuadre
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Selecciona o arrastra los nuevos reportes para recalcular las diferencias en tiempo real sin perder tu progreso.
                  </p>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Modo Actualización Vivo
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card 1: Reporte de Piso */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'piso')}
              className={`p-6 flex flex-col justify-between items-center text-center border-2 border-dashed rounded-3xl min-h-[240px] transition-all relative ${
                pisoFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-[#005cff]/50 bg-slate-900/20 backdrop-blur-md'
              }`}
            >
              <div className="flex flex-col items-center gap-3 mt-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pisoFile ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-extrabold ${tc.textSecondary}`}>Reporte de Piso</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Arrastra o selecciona el archivo Excel de pedidos enviados a piso.
                  </p>
                </div>
              </div>

              {pisoFile ? (
                <div className="w-full flex items-center justify-between px-3 py-2 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 mt-4">
                  <span className="truncate max-w-[170px] font-semibold">{pisoFile.name}</span>
                  <button onClick={() => removeFile('piso')} className="text-slate-400 hover:text-white cursor-pointer ml-2" title="Quitar archivo">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => pisoInputRef.current.click()}
                  className="mt-6 px-4 py-2 bg-[#005cff] hover:bg-[#004BCA] text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  Buscar Archivo
                </button>
              )}
              <input
                type="file"
                ref={pisoInputRef}
                onChange={(e) => handleFileChange(e, 'piso')}
                accept=".xlsx, .xls"
                className="hidden"
              />
            </div>

            {/* Card 2: Zapatos Tipeo */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'tipeo')}
              className={`p-6 flex flex-col justify-between items-center text-center border-2 border-dashed rounded-3xl min-h-[240px] transition-all relative ${
                tipeoFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-[#005cff]/50 bg-slate-900/20 backdrop-blur-md'
              }`}
            >
              <div className="flex flex-col items-center gap-3 mt-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tipeoFile ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-extrabold ${tc.textSecondary}`}>Zapatos Tipeo</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Arrastra o selecciona el Excel de devoluciones físicas escaneadas (tipeadas).
                  </p>
                </div>
              </div>

              {tipeoFile ? (
                <div className="w-full flex items-center justify-between px-3 py-2 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 mt-4">
                  <span className="truncate max-w-[170px] font-semibold">{tipeoFile.name}</span>
                  <button onClick={() => removeFile('tipeo')} className="text-slate-400 hover:text-white cursor-pointer ml-2" title="Quitar archivo">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => tipeoInputRef.current.click()}
                  className="mt-6 px-4 py-2 bg-[#005cff] hover:bg-[#004BCA] text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  Buscar Archivo
                </button>
              )}
              <input
                type="file"
                ref={tipeoInputRef}
                onChange={(e) => handleFileChange(e, 'tipeo')}
                accept=".xlsx, .xls"
                className="hidden"
              />
            </div>
          </div>

          {/* BOTÓN CALCULAR / RE-CALCULAR */}
          <div className="flex justify-center">
            <button
              onClick={calculateReconciliation}
              disabled={loading || !pisoFile || !tipeoFile}
              className={`w-full max-w-md py-4 rounded-3xl font-title font-black text-sm md:text-base tracking-wider flex items-center justify-center gap-3 transition-all shadow-lg ${
                !pisoFile || !tipeoFile
                  ? 'bg-slate-800/50 text-slate-500 border border-slate-800/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-95 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  PROCESANDO EXCEL...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  {reconciledResult ? 'RE-CALCULAR Y ACTUALIZAR CUADRE' : 'CALCULAR CUADRE DIARIO'}
                </>
              )}
            </button>
          </div>
        </div>
      ) : !reconciledResult ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center mb-8">
          <Database className="w-12 h-12 text-slate-500 mb-4" />
          <h3 className="font-extrabold text-white text-lg font-title">No hay cuadre registrado</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-md font-semibold leading-relaxed">
            No se ha guardado ningún cuadre de zapatos para la fecha seleccionada ({fechaCierre}) en esta tienda. 
            Solo los bodegueros tienen permisos para calcular y guardar el cierre de zapatos diario.
          </p>
          <button
            onClick={() => navigate('/bodega/cuadre/historial')}
            className="mt-6 px-4 py-2 bg-[#005cff] hover:bg-[#004BCA] text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Ir al Historial de Cierres
          </button>
        </div>
      ) : null}

      {/* 2. TABLERO DE INDICADORES (KPIs AJUSTADOS) */}
      {adjustedResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* KPI 1: Solicitados */}
            <div className={`p-6 ${tc.cardBg}`} style={tc.cardBgStyle}>
              <span className="text-xs font-black text-slate-400 tracking-wider block uppercase">Solicitados a Piso</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-4xl font-title font-black tracking-tight text-white">
                  {adjustedResult.totalFloor}
                </span>
                <span className="text-xs font-bold text-blue-400">pares</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Total de solicitudes de salida de calzado.
              </p>
            </div>

            {/* KPI 2: Conciliados */}
            <div className={`p-6 ${tc.cardBg}`} style={tc.cardBgStyle}>
              <span className="text-xs font-black text-slate-400 tracking-wider block uppercase">Conciliados (Cuadrados)</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-4xl font-title font-black tracking-tight text-emerald-400">
                  {adjustedResult.totalReconciled}
                </span>
                <span className="text-xs font-bold text-emerald-400 font-title font-black">
                  {((adjustedResult.totalReconciled / adjustedResult.totalFloor) * 100 || 0).toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex flex-wrap gap-x-2 gap-y-1">
                <span>Vtas: <strong className="text-emerald-400 font-bold">{salesCount}</strong></span>
                <span>•</span>
                <span>Bodega: <strong className="text-emerald-400 font-bold">{tipeoCount}</strong></span>
                <span>•</span>
                <span>Piso: <strong className="text-emerald-400 font-bold">{floorCount}</strong> <span className="text-[9px] text-slate-500">(Ings: {totalIngresos} | Gtas: {totalGarantias})</span></span>
                {manualCount > 0 && (
                  <>
                    <span>•</span>
                    <span>Ajustes: <strong className="text-purple-400 font-bold">{manualCount}</strong></span>
                  </>
                )}
              </p>
            </div>

            {/* KPI 3: Faltantes */}
            <div className={`p-6 ${tc.cardBg}`} style={tc.cardBgStyle}>
              <span className="text-xs font-black text-slate-400 tracking-wider block uppercase">Faltantes</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className={`text-4xl font-title font-black tracking-tight ${adjustedResult.totalMissing > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                  {adjustedResult.totalMissing}
                </span>
                {adjustedResult.totalMissing > 0 && (
                  <span className="text-[10px] font-black uppercase bg-red-950/40 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                    Crítico
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Pares no devueltos ni vendidos aún.
              </p>
            </div>

          </div>

          {adjustedResult?.isFromDB && (
            <div className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span>
                <strong>Cierre Histórico Guardado:</strong> Este cuadre ya fue consolidado y guardado en la base de datos.
              </span>
              <span className="opacity-90 font-medium">
                Guardado por: {adjustedResult.colaboradorCierre || 'Desconocido'} en {new Date(adjustedResult.savedAt).toLocaleString('es-EC')}
              </span>
            </div>
          )}

          {/* ACCIONES Y TABS */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            
            {/* Tabs */}
            <div className="flex bg-slate-950/60 p-1 border border-slate-800/80 rounded-2xl w-full lg:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('missing')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'missing'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Faltantes ({adjustedResult.totalMissing})
              </button>

              <button
                onClick={() => setActiveTab('returns')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'returns'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-400 hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Ingresos y Garantías ({adjustedResult.returnsList?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('surplus')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'surplus'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                Ventas sin Pedido ({adjustedResult.totalSurplus})
              </button>

              <button
                onClick={() => setActiveTab('reconciled')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'reconciled'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Reconciliados ({adjustedResult.reconciled.length})
              </button>
            </div>

            {/* Controles de Cierre */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">

              {/* Botón Guardar en BD */}
              {isBodeguero && (
                <button
                  onClick={saveReconciliationToDB}
                  disabled={saving || saveSuccess}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md ${
                    saveSuccess
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 cursor-default'
                      : 'bg-[#005cff] hover:bg-[#004BCA] text-white border border-[#005cff]/30 transform active:translate-y-0.5'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  {saving ? "Guardando..." : saveSuccess ? "Cierre Guardado" : "Guardar Cierre"}
                </button>
              )}

              <button
                onClick={copyWhatsAppSummary}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#050A16]/50 border border-slate-800/80 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer hover:bg-slate-900 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-blue-400" />
                    WhatsApp
                  </>
                )}
              </button>

              <button
                onClick={exportToExcel}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Excel
              </button>
            </div>

          </div>

          {/* BARRA DE BÚSQUEDA */}
          <div className="relative mb-6">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ALU, vendedor o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#050A16]/50 border border-slate-800/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#005cff]/50 transition-all font-semibold text-sm"
            />
          </div>

          {/* 3. LISTADO DETALLADO DE RESULTADOS */}
          <div className={`p-6 ${tc.cardBg}`} style={tc.cardBgStyle}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-left" style={tc.tableHeaderStyle}>
                    {activeTab === 'missing' && (
                      <>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Fila Excel</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>ALU</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Modelo</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Talla</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Stock</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Vendedor Solicitante</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Hora Pedido</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Estado Piso</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Estado Cuadre</th>
                        {isBodeguero && <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Acciones</th>}
                      </>
                    )}

                    {activeTab === 'returns' && (
                      <>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Fila Excel</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>ALU</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Modelo</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Talla</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Stock</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Vendedor</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Factura / Doc.</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Tipo de Retorno</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Estado Tipeo</th>
                        {isBodeguero && <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Acción</th>}
                      </>
                    )}

                    {activeTab === 'surplus' && (
                      <>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Fila Excel</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>ALU</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Modelo</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Talla</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Stock</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Vendedor</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Factura / Doc.</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Estado Piso</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Estado Cuadre</th>
                      </>
                    )}

                    {activeTab === 'reconciled' && (
                      <>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Fila Excel</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>ALU</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Modelo</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Talla</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Stock</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Vendedor</th>
                        <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText}`}>Reconciliado Por</th>
                        {isBodeguero && <th className={`p-4 text-xs font-black uppercase tracking-wider ${tc.tableHeaderText} text-center`}>Acción</th>}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500 font-semibold">
                        No se encontraron registros.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <tr
                        key={item.index || item.alu || idx}
                        className={`border-b border-slate-800/50 transition-colors ${tc.tableRowHover}`}
                      >
                        {activeTab === 'missing' && (
                          <>
                            <td className="p-4 text-xs font-black text-red-450">#{item.index}</td>
                            <td className="p-4 text-xs font-bold text-white tracking-wider">{item.alu}</td>
                            <td className="p-4 text-xs text-amber-400 font-bold tracking-wider">{item.modelo || '-'}</td>
                            <td className="p-4 text-xs text-white font-bold">{item.talla}</td>
                            <td className="p-4 text-xs text-blue-400 font-bold">{item.stock ?? 0} und(s)</td>
                            <td className="p-4 text-xs text-slate-300 font-semibold">{item.vendedor}</td>
                            <td className="p-4 text-xs text-slate-400 font-medium">
                              {item.fecha.split(' ')[1] || item.fecha}
                            </td>
                            <td className="p-4 text-xs">
                              <span className="px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase bg-slate-900 border border-slate-850 text-slate-400 whitespace-nowrap">
                                {item.estado}
                              </span>
                            </td>
                            {/* Estado Interno de Cuadre */}
                            <td className="p-4 text-xs">
                              <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase whitespace-nowrap ${
                                item.estadoInterno === 'Faltante Confirmado'
                                  ? 'bg-red-500/10 border border-red-500/30 text-red-400 shadow-sm'
                                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                              }`}>
                                {item.estadoInterno}
                              </span>
                            </td>
                            {/* Acciones */}
                            {isBodeguero && (
                              <td className="p-4 text-xs text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => {
                                      setManualAdjustments(prev => ({
                                        ...prev,
                                        [item.index]: 'Cuadrado'
                                      }));
                                      setSaveSuccess(false);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer font-bold text-[10px]"
                                  >
                                    Cuadrar
                                  </button>
                                  {item.estadoInterno !== 'Faltante Confirmado' ? (
                                    <button
                                      onClick={() => {
                                        setManualAdjustments(prev => ({
                                          ...prev,
                                          [item.index]: 'Faltante Confirmado'
                                        }));
                                        setSaveSuccess(false);
                                      }}
                                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-450 border border-red-500/30 rounded-xl transition-all cursor-pointer font-bold text-[10px]"
                                    >
                                      Confirmar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setManualAdjustments(prev => {
                                          const copy = { ...prev };
                                          delete copy[item.index];
                                          return copy;
                                        });
                                        setSaveSuccess(false);
                                      }}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700 rounded-xl transition-all cursor-pointer font-bold text-[10px]"
                                    >
                                      Revertir
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </>
                        )}

                        {activeTab === 'surplus' && (
                          <>
                            <td className="p-4 text-xs font-black text-amber-500 font-mono">#{item.index}</td>
                            <td className="p-4 text-xs font-bold text-white tracking-wider">{item.alu}</td>
                            <td className="p-4 text-xs text-amber-400 font-bold tracking-wider">{item.modelo || '-'}</td>
                            <td className="p-4 text-xs text-white font-bold">{item.talla}</td>
                            <td className="p-4 text-xs text-blue-400 font-bold">{item.stock ?? 0} und(s)</td>
                            <td className="p-4 text-xs text-slate-300 font-semibold">{item.vendedor}</td>
                            <td className="p-4 text-xs text-slate-455 font-medium">{item.factura || 'Sin Doc'}</td>
                            <td className="p-4 text-xs">
                              <span className="px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase bg-slate-900 border border-slate-850 text-slate-450 whitespace-nowrap">
                                {item.estado}
                              </span>
                            </td>
                            <td className="p-4 text-xs">
                              <span className="px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase bg-amber-500/10 border border-amber-500/30 text-amber-500 whitespace-nowrap">
                                Venta sin Pedido
                              </span>
                            </td>
                          </>
                        )}

                        {activeTab === 'returns' && (
                          <>
                            <td className="p-4 text-xs font-black text-indigo-400">#{item.index}</td>
                            <td className="p-4 text-xs font-bold text-white tracking-wider">{item.alu}</td>
                            <td className="p-4 text-xs text-amber-400 font-bold tracking-wider">{item.modelo || '-'}</td>
                            <td className="p-4 text-xs text-white font-bold">{item.talla}</td>
                            <td className="p-4 text-xs text-blue-400 font-bold">{item.stock ?? 0} und(s)</td>
                            <td className="p-4 text-xs text-slate-300 font-semibold">{item.vendedor}</td>
                            <td className="p-4 text-xs text-slate-450 font-medium">{item.factura || 'Sin Doc'}</td>
                            <td className="p-4 text-xs">
                              <button
                                onClick={() => {
                                  setManualReturnTypes(prev => ({
                                    ...prev,
                                    [item.index]: item.tipo === 'Ingreso' ? 'Garantía' : 'Ingreso'
                                  }));
                                  setSaveSuccess(false);
                                }}
                                title="Click para cambiar tipo"
                                className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase cursor-pointer border transition-all ${
                                  item.tipo === 'Garantía'
                                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-400 hover:bg-purple-900/40'
                                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                                }`}
                              >
                                {item.tipo}
                              </button>
                            </td>
                            <td className="p-4 text-xs">
                              <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase whitespace-nowrap ${
                                item.statusFisico === 'Cuadrado'
                                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm'
                                  : 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                              }`}>
                                {item.statusFisico}
                              </span>
                            </td>
                            {isBodeguero && (
                              <td className="p-4 text-xs text-center">
                                <button
                                  onClick={() => {
                                    setManualReturnTypes(prev => ({
                                      ...prev,
                                      [item.index]: item.tipo === 'Ingreso' ? 'Garantía' : 'Ingreso'
                                    }));
                                    setSaveSuccess(false);
                                  }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all cursor-pointer font-bold text-[10px]"
                                >
                                  Cambiar a {item.tipo === 'Ingreso' ? 'Garantía' : 'Ingreso'}
                                </button>
                              </td>
                            )}
                          </>
                        )}
                        {activeTab === 'reconciled' && (
                          <>
                            <td className="p-4 text-xs text-slate-500 font-medium">#{item.index}</td>
                            <td className="p-4 text-xs font-bold text-slate-300 tracking-wider">{item.alu}</td>
                            <td className="p-4 text-xs text-amber-400 font-bold tracking-wider">{item.modelo || '-'}</td>
                            <td className="p-4 text-xs text-slate-300 font-bold">{item.talla}</td>
                            <td className="p-4 text-xs text-blue-400 font-bold">{item.stock ?? 0} und(s)</td>
                            <td className="p-4 text-xs text-slate-400 font-medium">{item.vendedor}</td>
                            <td className="p-4 text-xs">
                              <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase whitespace-nowrap ${
                                item.reconciledBy.startsWith('Venta')
                                  ? 'bg-blue-950/40 border border-blue-500/20 text-blue-400'
                                  : item.reconciledBy.startsWith('Devolución')
                                  ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400'
                                  : 'bg-purple-950/40 border border-purple-500/20 text-purple-400 font-bold' // Ajuste Manual
                              }`}>
                                {item.reconciledBy}
                              </span>
                            </td>
                            {/* Deshacer ajuste manual para reconciliados */}
                            {isBodeguero && (
                              <td className="p-4 text-xs text-center">
                                {item.reconciledBy === 'Ajuste Manual' && (
                                  <button
                                    onClick={() => {
                                      setManualAdjustments(prev => {
                                        const copy = { ...prev };
                                        delete copy[item.index];
                                        return copy;
                                      });
                                      setSaveSuccess(false);
                                    }}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-355 border border-slate-700 rounded-xl transition-all cursor-pointer font-bold text-[10px]"
                                  >
                                    Deshacer
                                  </button>
                                )}
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* NOTA DE INFORMACIÓN */}
      <div className="mt-8 flex items-start gap-3 bg-slate-900/10 border border-slate-800/60 p-4 rounded-2xl">
        <Info className="w-5 h-5 text-[#005cff] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 font-medium">
          <p className="font-extrabold text-slate-300 mb-1">Sobre el algoritmo de conciliación:</p>
          El sistema utiliza el método <strong className="text-slate-300">FIFO (First In, First Out)</strong>. Si un zapato de un ALU específico se vendió o se devolvió, el sistema concilia automáticamente la solicitud más antigua realizada para ese modelo. Aquellas solicitudes que no logren ser emparejadas con ninguna venta ni devolución física se catalogan inmediatamente como <strong className="text-red-450">Faltantes</strong>.
        </div>
      </div>

    </div>
  );
}
