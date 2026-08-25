import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getThemeClasses } from '../store/themeStore';
import { getEmployeeTheme } from '../utils/themeHelper';
import {
  FileSpreadsheet,
  History,
  Camera,
  ChevronRight
} from 'lucide-react';

// Sub-páginas
import CuadreZapatosForm from './CuadreZapatosForm';
import CuadreZapatosHistorial from './CuadreZapatosHistorial';
import BodegaDevolucionesScan from './BodegaDevolucionesScan';

const TABS = [
  { key: 'cuadre', label: 'Cuadre de Zapatos', icon: FileSpreadsheet, color: 'text-blue-400' },
  { key: 'historial', label: 'Historial de Cierres', icon: History, color: 'text-emerald-400' },
  { key: 'devoluciones', label: 'Ingresos y Garantías', icon: Camera, color: 'text-amber-400' },
];

export default function CuadreZapatosUnificado() {
  const { user } = useAuthStore();
  const { theme: activeTheme } = useThemeStore();

  const myTheme = getEmployeeTheme(
    user?.user_metadata?.cargo || 'Asesor de Ventas',
    user?.user_metadata?.nombres || '',
    user?.user_metadata?.cargo_anterior || ''
  );
  const tc = getThemeClasses(activeTheme, myTheme);

  const getGuayaquilDate = () => {
    try {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [activeTab, setActiveTab] = useState('cuadre');
  const [selectedFecha, setSelectedFecha] = useState(getGuayaquilDate());

  // Cuando el historial pide abrir un cuadre específico
  const handleTabChange = (tab, fecha) => {
    if (fecha) setSelectedFecha(fecha);
    setActiveTab(tab);
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 ${tc.containerBg || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl md:text-3xl font-title font-black tracking-wider ${tc.textPrimary} flex items-center gap-3`}>
          <FileSpreadsheet className="w-7 h-7 text-blue-500" />
          CUADRE DE ZAPATOS
          <span className="text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 rounded-full ml-2">V8</span>
        </h1>
        <p className={`text-xs mt-1 ${tc.textMuted}`}>
          Gestión unificada de cuadre, historial de cierres e ingresos de calzado.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900/30 p-1 rounded-2xl border border-slate-800/50 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#005cff] text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-4 text-[10px] font-semibold text-slate-500">
        <span>Bodega</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-300">{TABS.find(t => t.key === activeTab)?.label}</span>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'cuadre' && (
          <CuadreZapatosForm
            onTabChange={handleTabChange}
            selectedFecha={selectedFecha}
            onFechaChange={setSelectedFecha}
          />
        )}
        {activeTab === 'historial' && (
          <CuadreZapatosHistorial
            onTabChange={handleTabChange}
          />
        )}
        {activeTab === 'devoluciones' && (
          <BodegaDevolucionesScan
            onTabChange={handleTabChange}
            selectedFecha={selectedFecha}
            onFechaChange={setSelectedFecha}
          />
        )}
      </div>
    </div>
  );
}
