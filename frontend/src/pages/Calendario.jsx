import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useHorarioStore } from '../store/horarioStore';
import { useTiendaStore } from '../store/tiendaStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabaseClient';

import Navbar from '../components/layout/Navbar';
import HorariosHeader from '../components/horarios/HorariosHeader';
import MatrizHorarios from '../components/horarios/MatrizHorarios';
import HorarioPersonal from '../components/horarios/HorarioPersonal';
import AnaliticaHorarios from '../components/horarios/AnaliticaHorarios';
import SolicitudesHorario from '../components/horarios/SolicitudesHorario';
import CargaHorariosModal from '../components/horarios/CargaHorariosModal';
import TurnoEditModal from '../components/horarios/TurnoEditModal';
import FloatingShiftPainter from '../components/horarios/FloatingShiftPainter';

// Servicios de exportación y algoritmos
import { generateSmartSchedule } from '../services/scheduleEngine';

export default function Calendario() {
  const { user: currentUser } = useAuthStore();
  const { tiendaSeleccionada } = useTiendaStore();
  const { theme, cycleTheme, density } = useThemeStore();
  
  const { 
    empleados, 
    turnos, 
    turnosMap, 
    solicitudes, 
    loading, 
    saving,
    fetchEmpleados, 
    fetchTurnos, 
    fetchSolicitudes,
    saveTurno,
    saveTurnosMasivos,
    deleteTurno,
    addSolicitud,
    procesarSolicitud
  } = useHorarioStore();

  const myRol = currentUser?.user_metadata?.rol || 'empleado';
  const myCargo = currentUser?.user_metadata?.cargo || '';
  const isDirectivo = useMemo(() => {
    return myRol === 'admin' || 
      myRol === 'supervisor' || 
      myRol === 'superadmin' || 
      myCargo.toLowerCase().includes('jefe') || 
      myCargo.toLowerCase().includes('subjefe') || 
      myCargo.toLowerCase().includes('supervisor') ||
      myCargo.toLowerCase().includes('tercer');
  }, [myRol, myCargo]);

  // Estados de período y vista
  const now = new Date();
  const [activeYear, setActiveYear] = useState(now.getFullYear());
  const [activeMonth, setActiveMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState('personal');
  const [matrixGroupingMode, setMatrixGroupingMode] = useState('cargo'); // 'cargo' | 'flat'

  useEffect(() => {
    if (isDirectivo) {
      setActiveTab('matriz');
    }
  }, [isDirectivo]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZona, setFilterZona] = useState('Todos');

  // Herramienta de Pintor de Turnos (1-Click Paint)
  const [activePaintShift, setActivePaintShift] = useState(null);

  // Modales
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState({
    isOpen: false,
    employee: null,
    dateStr: '',
    existingTurno: null
  });

  // Carga inicial
  useEffect(() => {
    const loadData = async () => {
      await fetchEmpleados();
      await fetchTurnos(activeYear, activeMonth);
      await fetchSolicitudes();
    };
    loadData();
  }, [fetchEmpleados, fetchTurnos, fetchSolicitudes, activeYear, activeMonth]);

  // Sincronización en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('realtime-horarios-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, () => {
        fetchTurnos(activeYear, activeMonth);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, () => {
        fetchSolicitudes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTurnos, fetchSolicitudes, activeYear, activeMonth]);

  // Navegación de mes
  const handlePeriodChange = useCallback((newYear, newMonth) => {
    setActiveYear(newYear);
    setActiveMonth(newMonth);
    fetchTurnos(newYear, newMonth);
  }, [fetchTurnos]);

  // Click en celda: Si hay un turno seleccionado en el pintor, lo aplica al instante; si no, abre el modal
  const handleCellClick = useCallback(async (employee, dateStr, existingTurno) => {
    if (activePaintShift) {
      // 1-Click Paint Mode
      const payload = {
        id: existingTurno?.id,
        empleado_cedula: employee.cedula,
        fecha: dateStr,
        tipo_turno: activePaintShift.type,
        hora_inicio: activePaintShift.start,
        hora_fin: activePaintShift.end,
        motivo_cambio: `Asignación rápida (${activePaintShift.code})`
      };
      await saveTurno(payload);
    } else {
      setEditModalData({
        isOpen: true,
        employee,
        dateStr,
        existingTurno
      });
    }
  }, [activePaintShift, saveTurno]);

  // Guardar turno desde modal
  const handleSaveTurno = useCallback(async (turnoPayload) => {
    const res = await saveTurno(turnoPayload);
    return res.success;
  }, [saveTurno]);

  // Eliminar turno
  const handleDeleteTurno = useCallback(async (id, cedula, fecha) => {
    const res = await deleteTurno(id, cedula, fecha);
    return res.success;
  }, [deleteTurno]);

  // Importar desde Excel
  const handleConfirmImport = useCallback(async (turnosList, targetYear, targetMonth, zonesDetected) => {
    const res = await saveTurnosMasivos(turnosList, targetYear, targetMonth, zonesDetected);
    if (res.success) {
      setActiveYear(targetYear);
      setActiveMonth(targetMonth);
      alert(`¡Horarios importados exitosamente! Se procesaron ${res.count} turnos sincronizados con el día 1 de ${targetMonth}/${targetYear}.`);
      return true;
    } else {
      alert(`Error en la importación: ${res.error}`);
      return false;
    }
  }, [saveTurnosMasivos]);

  // Auto-Generador Inteligente de Horarios (IA / Algoritmo Balanceado)
  const handleRunAutoSchedule = useCallback(async () => {
    if (window.confirm(`¿Deseas auto-generar la planificación completa y equilibrada para todo el equipo en el mes ${activeMonth}/${activeYear}? (Esto optimizará descansos y cobertura de líderes)`)) {
      const generated = generateSmartSchedule(activeYear, activeMonth, empleados);
      const res = await saveTurnosMasivos(generated, activeYear, activeMonth, {});
      if (res.success) {
        alert(`¡Planificación automática completada! Se generaron ${res.count} turnos equilibrados.`);
      } else {
        alert(`Error al generar: ${res.error}`);
      }
    }
  }, [activeYear, activeMonth, empleados, saveTurnosMasivos]);

  // Exportar PDF con import dinámico
  const handleExportPDF = useCallback(async () => {
    try {
      const { exportSchedulePDF } = await import('../services/scheduleExporter');
      const storeName = tiendaSeleccionada?.nombre || 'Marathon Sports';
      exportSchedulePDF(activeYear, activeMonth, empleados, turnosMap, storeName);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('Error al generar PDF: ' + (err.message || 'Desconocido'));
    }
  }, [activeYear, activeMonth, empleados, turnosMap, tiendaSeleccionada]);

  // Exportar Excel con import dinámico
  const handleExportExcel = useCallback(async () => {
    try {
      const { exportScheduleExcel } = await import('../services/scheduleExporter');
      const storeName = tiendaSeleccionada?.nombre || 'Marathon Sports';
      exportScheduleExcel(activeYear, activeMonth, empleados, turnosMap, storeName);
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      alert('Error al generar Excel: ' + (err.message || 'Desconocido'));
    }
  }, [activeYear, activeMonth, empleados, turnosMap, tiendaSeleccionada]);

  const isLight = theme === 'clasico';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#060b17] text-white'
    }`}>
      <Navbar />
      <div className="max-w-[1750px] mx-auto p-4 lg:p-8 space-y-6">
        {/* Cabecera Principal con Selector de Mes y Acciones */}
        <HorariosHeader
          activeYear={activeYear}
          activeMonth={activeMonth}
          onPeriodChange={handlePeriodChange}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          matrixGroupingMode={matrixGroupingMode}
          onToggleGroupingMode={() => setMatrixGroupingMode(prev => prev === 'cargo' ? 'flat' : 'cargo')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterZona={filterZona}
          onFilterZonaChange={setFilterZona}
          isDirectivo={isDirectivo}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          saving={saving}
          loading={loading}
          theme={theme}
          onCycleTheme={cycleTheme}
        />

        {/* Tab 1: Matriz de Tienda (Por Cargos o Plana) */}
        {activeTab === 'matriz' && isDirectivo && (
          <MatrizHorarios
            year={activeYear}
            month={activeMonth}
            employees={empleados}
            turnosMap={turnosMap}
            onCellClick={handleCellClick}
            activePaintShift={activePaintShift}
            matrixGroupingMode={matrixGroupingMode}
            searchTerm={searchTerm}
            filterZona={filterZona}
            isDirectivo={isDirectivo}
            theme={theme}
            density={density}
          />
        )}

        {/* Tab 2: Mi Horario Personal */}
        {(activeTab === 'personal' || !isDirectivo) && (
          <HorarioPersonal
            currentUser={currentUser}
            year={activeYear}
            month={activeMonth}
            turnosMap={turnosMap}
            theme={theme}
          />
        )}

        {/* Floating Shift Painter for Directivos */}
        {activeTab === 'matriz' && isDirectivo && (
          <FloatingShiftPainter
            activePaintShift={activePaintShift}
            onSelectPaintShift={setActivePaintShift}
            isDirectivo={isDirectivo}
            onRunAutoSchedule={handleRunAutoSchedule}
            saving={saving}
            theme={theme}
          />
        )}

        {/* Modal de Carga Masiva de Excel */}
        <CargaHorariosModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          employees={empleados}
          activeYear={activeYear}
          activeMonth={activeMonth}
          onConfirmImport={handleConfirmImport}
          saving={saving}
        />

        {/* Modal de Edición Rápida de Turno */}
        <TurnoEditModal
          isOpen={editModalData.isOpen}
          onClose={() => setEditModalData({ ...editModalData, isOpen: false })}
          employee={editModalData.employee}
          dateStr={editModalData.dateStr}
          existingTurno={editModalData.existingTurno}
          onSave={handleSaveTurno}
          onDelete={handleDeleteTurno}
          saving={saving}
        />
      </div>
    </div>
  );
}
