import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { parseScheduleExcelSheet } from '../../services/excelScheduleParser';
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw,
  Users,
  Calendar,
  Sparkles,
  MapPin
} from 'lucide-react';

const MONTH_OPTIONS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

export default function CargaHorariosModal({
  isOpen,
  onClose,
  employees,
  activeYear,
  activeMonth,
  onConfirmImport,
  saving
}) {
  const [selectedYear, setSelectedYear] = useState(activeYear || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(activeMonth || (new Date().getMonth() + 1));
  const [rawWorkbook, setRawWorkbook] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [parseError, setParseError] = useState(null);

  useEffect(() => {
    if (activeYear) setSelectedYear(activeYear);
    if (activeMonth) setSelectedMonth(activeMonth);
  }, [activeYear, activeMonth, isOpen]);

  // Si el usuario cambia el mes o año destino con un archivo ya cargado, re-parsear de inmediato
  useEffect(() => {
    if (rawWorkbook && employees && employees.length > 0) {
      try {
        const result = parseScheduleExcelSheet(rawWorkbook, employees, selectedMonth, selectedYear);
        setParseResult(result);
        setParseError(null);
      } catch (err) {
        setParseError(err.message || 'Error al re-procesar el archivo para el nuevo mes.');
      }
    }
  }, [selectedMonth, selectedYear, rawWorkbook, employees]);

  if (!isOpen) return null;

  const handleFileDropOrSelect = async (e) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setParsing(true);
    setParseError(null);
    setParseResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      setRawWorkbook(workbook);
      const result = parseScheduleExcelSheet(workbook, employees, selectedMonth, selectedYear);
      setParseResult(result);
    } catch (err) {
      console.error('Error parsing excel:', err);
      setParseError(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parseResult || !parseResult.turnos || parseResult.turnos.length === 0) return;
    const success = await onConfirmImport(
      parseResult.turnos, 
      parseResult.year, 
      parseResult.month,
      parseResult.zonesDetected
    );
    if (success) {
      onClose();
    }
  };

  const currentMonthName = MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label || 'Mes';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Carga Inteligente de Horarios</h3>
              <p className="text-xs text-slate-400">Importación masiva sincronizada con el Día 1 del mes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Selector de Mes y Año Destino */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-xs font-bold text-white block">Mes y Año de Destino</span>
                <span className="text-[10px] text-slate-400">El Día 1 del Excel se sincronizará con el 1 de este mes</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold outline-none focus:border-blue-500"
              >
                {MONTH_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold outline-none focus:border-blue-500 font-mono"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>
          </div>

          {/* Dropzone */}
          <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/50 hover:bg-slate-950/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition group">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleFileDropOrSelect} 
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-white mb-1">
              {fileName ? fileName : 'Haz clic o arrastra tu archivo Excel aquí'}
            </span>
            <span className="text-xs text-slate-400 text-center max-w-sm">
              Soporta la plantilla oficial de horarios de Marathon Sports MCP1 (Matriz de 31 días y 5 filas por colaborador).
            </span>
          </label>

          {/* Loading Spinner */}
          {parsing && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Procesando y sincronizando días con {currentMonthName} {selectedYear}...</span>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Error al procesar el archivo</span>
                <span className="text-[11px] opacity-90">{parseError}</span>
              </div>
            </div>
          )}

          {/* Parse Result Summary */}
          {parseResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="font-bold text-xs text-emerald-300 block">
                      Archivo sincronizado correctamente
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Destino: <strong>{currentMonthName} {parseResult.year}</strong> • {parseResult.daysCount} días del mes
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  {parseResult.totalTurnos} Turnos
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Colaboradores</span>
                  <span className="text-lg font-black text-white mt-0.5 block">
                    {parseResult.employeesFoundCount} / {parseResult.totalEmployeesInDB}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Días Mapeados</span>
                  <span className="text-lg font-black text-blue-400 mt-0.5 block">
                    {parseResult.daysCount}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Zonas Detectadas</span>
                  <span className="text-lg font-black text-indigo-400 mt-0.5 block">
                    {Object.keys(parseResult.zonesDetected || {}).length}
                  </span>
                </div>
              </div>

              {/* Warnings / Unmapped Rows */}
              {parseResult.unmappedRows && parseResult.unmappedRows.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <div className="flex items-center gap-2 mb-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Filas no asignadas a nómina (ignoradas automáticamente):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-200/80 max-h-24 overflow-y-auto">
                    {parseResult.unmappedRows.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!parseResult || saving || parsing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando en Base de Datos...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Confirmar e Importar ({parseResult ? parseResult.totalTurnos : 0} turnos)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
