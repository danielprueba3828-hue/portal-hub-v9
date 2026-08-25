import React from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  User, 
  BarChart3, 
  FileSpreadsheet, 
  Inbox, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Layers,
  Wand2
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function HorariosHeader({
  activeYear,
  activeMonth,
  onPeriodChange,
  activeTab,
  onTabChange,
  matrixGroupingMode,
  onToggleGroupingMode,
  searchTerm,
  onSearchChange,
  filterZona,
  onFilterZonaChange,
  isDirectivo,
  onOpenUploadModal,
  onExportPDF,
  onExportExcel,
  saving,
  theme = 'oscuro',
  onCycleTheme
}) {
  const isLight = theme === 'clasico';

  const handlePrevMonth = () => {
    let newMonth = activeMonth - 1;
    let newYear = activeYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onPeriodChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newMonth = activeMonth + 1;
    let newYear = activeYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onPeriodChange(newYear, newMonth);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    onPeriodChange(now.getFullYear(), now.getMonth() + 1);
  };

  return (
    <div className={`rounded-3xl p-3 sm:p-5 lg:p-6 mb-4 sm:mb-6 shadow-xl border transition-all duration-300 ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50' 
        : 'bg-slate-900/90 backdrop-blur-md border-slate-800 text-white shadow-xl'
    }`}>
      {/* Top row: Title, Month Selector, Main Actions */}
      <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25 text-white shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className={`text-base sm:text-xl lg:text-2xl font-black tracking-tight ${
                isLight ? 'text-slate-950' : 'bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent'
              }`}>
                Gestión de Horarios
              </h1>
              {saving && (
                <span className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse font-bold">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Guardando...
                </span>
              )}
            </div>
            <p className={`text-[10px] sm:text-xs lg:text-sm truncate max-w-[240px] sm:max-w-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Planificación por cargos, descansos y cobertura
            </p>
          </div>
        </div>

        {/* Month Selector & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
          <div className={`flex items-center rounded-xl sm:rounded-2xl p-0.5 sm:p-1 border shadow-inner ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700/80'
          }`}>
            <button
              onClick={handlePrevMonth}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="px-2 sm:px-3 py-0.5 text-center min-w-[100px] sm:min-w-[130px]">
              <span className={`text-xs sm:text-sm font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {MONTH_NAMES[activeMonth - 1]} {activeYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <button
            onClick={handleCurrentMonth}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl sm:rounded-2xl border transition cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            Hoy
          </button>

          {isDirectivo && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={onOpenUploadModal}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Cargar Excel</span>
              </button>

              <button
                onClick={onExportPDF}
                className={`flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold rounded-xl sm:rounded-2xl border transition cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Exportar PDF Oficial"
              >
                <Download className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                onClick={onExportExcel}
                className={`flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold rounded-xl sm:rounded-2xl border transition cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Exportar Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Navigation Tabs, Grouping Mode & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-3">
        {/* Navigation Tabs */}
        <div className={`flex items-center gap-1 p-1 rounded-xl sm:rounded-2xl border overflow-x-auto scrollbar-none ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          {isDirectivo && (
            <button
              onClick={() => onTabChange('matriz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'matriz'
                  ? 'bg-blue-600 text-white shadow-md'
                  : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Matriz Tienda</span>
            </button>
          )}

          <button
            onClick={() => onTabChange('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Mi Horario</span>
          </button>
        </div>

        {/* View Grouping & Search */}
        {activeTab === 'matriz' && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Toggle Grouping by Cargo vs Flat */}
            {isDirectivo && (
              <button
                onClick={onToggleGroupingMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg sm:rounded-xl border transition cursor-pointer ${
                  matrixGroupingMode === 'cargo'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Agrupar por Cargos o Lista Plana"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{matrixGroupingMode === 'cargo' ? 'Por Cargos' : 'Lista Plana'}</span>
              </button>
            )}

            <div className="relative flex-1 min-w-[140px] md:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg sm:rounded-xl border focus:outline-none focus:border-blue-500 transition ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400'
                }`}
              />
            </div>

            <select
              value={filterZona}
              onChange={(e) => onFilterZonaChange(e.target.value)}
              className={`px-2 py-1.5 text-xs rounded-lg sm:rounded-xl border focus:outline-none focus:border-blue-500 transition cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}
            >
              <option value="Todos">Todas las Zonas</option>
              <option value="ZONA HOMBRE">👕 Zona Hombre</option>
              <option value="ZONA MUJER">👗 Zona Mujer</option>
              <option value="CATEGORIZACION">🏷️ Categorización</option>
              <option value="ROTATIVO">🔄 Rotativo</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
