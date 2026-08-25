import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTiendaStore } from '../../store/tiendaStore';

import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ShieldAlert, 
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
  Warehouse,
  History,
  Target,
  Store,
  FileSpreadsheet
} from 'lucide-react';
import { getEmployeeTheme } from '../../utils/themeHelper';
import { useThemeStore, getThemeClasses } from '../../store/themeStore';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tiendaSeleccionada, limpiarTiendaSeleccionada } = useTiendaStore();
  const rol = user?.user_metadata?.rol || 'empleado';
  const cargo = user?.user_metadata?.cargo || 'Asesor de Ventas';

  // Helper para renderizar los iconos con colores dinámicos
  const renderIcon = (item, isActive) => {
    if (!item.icon) return null;
    return React.cloneElement(item.icon, {
      className: `w-5 h-5 transition-colors duration-250 ${
        isActive ? 'text-current' : (item.colorClass || 'text-slate-400')
      }`
    });
  };

  // Obtener menú dinámico y ordenado según el rol y cargo del usuario
  const getMenuItems = (userRol, userCargo) => {
    const menu = [];
    const isTercero = userCargo && (userCargo.toLowerCase().includes('tercer') || userCargo === 'Tercero a bordo');

    if (isTercero) {
      // Menú para Tercero a bordo
      menu.push({
        name: 'Calendario y Horario',
        path: '/calendario',
        icon: <Calendar className="w-5 h-5" />,
        colorClass: 'text-rose-500 dark:text-rose-400'
      });
      menu.push({
        name: 'Página Principal',
        path: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        colorClass: 'text-amber-500 dark:text-amber-400'
      });
      menu.push({
        name: 'Bitácoras',
        path: '/bitacoras',
        icon: <History className="w-5 h-5" />,
        colorClass: 'text-sky-500 dark:text-sky-400'
      });
      menu.push({
        name: 'Cuadre de Zapatos',
        path: '/bodega/cuadre',
        icon: <FileSpreadsheet className="w-5 h-5" />,
        colorClass: 'text-cyan-500 dark:text-cyan-400'
      });
      menu.push({
        name: 'Gestión de Metas',
        path: '/metas/admin',
        icon: <Target className="w-5 h-5" />,
        colorClass: 'text-fuchsia-500 dark:text-fuchsia-400'
      });
      menu.push({
        name: 'Evaluaciones Nine Box',
        path: '/evaluaciones',
        icon: <ClipboardCheck className="w-5 h-5" />,
        colorClass: 'text-orange-500 dark:text-orange-400'
      });
      menu.push({
        name: 'Gestión de Personal',
        path: '/personal',
        icon: <Users className="w-5 h-5" />,
        colorClass: 'text-purple-500 dark:text-purple-400'
      });
    } else if (userRol === 'empleado' && !isTercero) {
      if (userCargo === 'Bodeguero') {
        menu.push({
          name: 'Reporte de Bodega',
          path: '/bodega/reporte',
          icon: <Warehouse className="w-5 h-5" />,
          colorClass: 'text-indigo-500 dark:text-indigo-400'
        });
        menu.push({
          name: 'Cuadre de Zapatos',
          path: '/bodega/cuadre',
          icon: <FileSpreadsheet className="w-5 h-5" />,
          colorClass: 'text-cyan-500 dark:text-cyan-400'
        });
      }
      menu.push({
        name: 'Mi Horario',
        path: '/calendario',
        icon: <Calendar className="w-5 h-5" />,
        colorClass: 'text-rose-500 dark:text-rose-400'
      });
      menu.push({
        name: 'Página Principal',
        path: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        colorClass: 'text-amber-500 dark:text-amber-400'
      });
      if (userCargo === 'Asesor de Ventas') {
        menu.push({
          name: 'Mis Metas',
          path: '/metas',
          icon: <Target className="w-5 h-5" />,
          colorClass: 'text-fuchsia-500 dark:text-fuchsia-400'
        });
      }
      menu.push({
        name: 'Mis Evaluaciones',
        path: '/evaluaciones',
        icon: <ClipboardCheck className="w-5 h-5" />,
        colorClass: 'text-orange-500 dark:text-orange-400'
      });
    } else {
      menu.push({
        name: 'Calendario y Horario',
        path: '/calendario',
        icon: <Calendar className="w-5 h-5" />,
        colorClass: 'text-rose-500 dark:text-rose-400'
      });
      if (userRol !== 'supervisor') {
        menu.push({
          name: 'Página Principal',
          path: '/dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
          colorClass: 'text-amber-500 dark:text-amber-400'
        });
      }

      menu.push({
        name: 'Bitácoras',
        path: '/bitacoras',
        icon: <History className="w-5 h-5" />,
        colorClass: 'text-sky-500 dark:text-sky-400'
      });
      menu.push({
        name: 'Cuadre de Zapatos',
        path: '/bodega/cuadre',
        icon: <FileSpreadsheet className="w-5 h-5" />,
        colorClass: 'text-cyan-500 dark:text-cyan-400'
      });
      menu.push({
        name: 'Evaluaciones Nine Box',
        path: '/evaluaciones',
        icon: <ClipboardCheck className="w-5 h-5" />,
        colorClass: 'text-orange-500 dark:text-orange-400'
      });

      // La Gestión de Metas, Carga desde Excel, Personal y Administración no están permitidas para el Tercero a Bordo
      if (!isTercero) {
        if (userRol !== 'supervisor') {
          menu.push({
            name: 'Gestión de Metas',
            path: '/metas/admin',
            icon: <Target className="w-5 h-5" />,
            colorClass: 'text-fuchsia-500 dark:text-fuchsia-400'
          });
        }


        menu.push({
          name: 'Gestión de Personal',
          path: '/personal',
          icon: <Users className="w-5 h-5" />,
          colorClass: 'text-purple-500 dark:text-purple-400'
        });

        if (userRol === 'admin' || userRol === 'superadmin') {
          menu.push({
            name: 'Administración',
            path: '/administracion',
            icon: <ShieldAlert className="w-5 h-5" />,
            colorClass: 'text-red-500 dark:text-red-400'
          });
        }
      }
      
      // Agregar Cambiar de Tienda para el Supervisor o Superadmin
      if (userRol === 'supervisor' || userRol === 'superadmin') {
        menu.push({
          name: 'Cambiar de Tienda',
          path: '/selector-tienda',
          icon: <Store className="w-5 h-5" />,
          colorClass: 'text-[#005cff] dark:text-[#38bdf8]',
          action: () => {
            limpiarTiendaSeleccionada();
            navigate('/selector-tienda');
          }
        });
      }
    }
    return menu;
  };

  const filteredMenu = getMenuItems(rol, cargo);

  const theme = getEmployeeTheme(cargo, user?.user_metadata?.nombres || '', user?.user_metadata?.cargo_anterior || '');
  const { theme: activeTheme } = useThemeStore();
  const tc = getThemeClasses(activeTheme, theme);

  // Menú de Navegación
  return (
    <aside 
      className={`w-64 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl border-r transition-all duration-300 ${tc.sidebarBg} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={tc.sidebarBgStyle}
    >
      
      {/* Cabecera / Marca */}
      <div 
        className={`p-6 border-b text-center relative transition-colors duration-300 ${tc.sidebarHeaderBg}`}
        style={tc.sidebarHeaderBgStyle}
      >
        <h2 className={`text-2xl font-title font-black tracking-wider ${activeTheme === 'oscuro' ? 'text-white' : 'text-slate-800'}`}>
          PORTAL <span className="text-[#E30613]">HUB</span>
        </h2>
        <div className="flex items-center justify-center space-x-1.5 mt-1">
          <span className={`text-[10px] font-black tracking-widest uppercase ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>
            PORTAL SHOPPING
          </span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#E30613]/15 text-[#E30613] border border-[#E30613]/30 tracking-wider">
            V8
          </span>
        </div>
        
        <button 
          onClick={onClose}
          className={`absolute right-4 top-4 lg:hidden font-bold transition-colors ${
            activeTheme === 'oscuro' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ✕
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredMenu.map((item) => (
          item.action ? (
            <button
              key={item.path || item.name}
              onClick={() => {
                item.action();
                onClose();
              }}
              className={`${tc.sidebarLinkClass(false)} w-full text-left cursor-pointer border-none bg-transparent flex items-center justify-between group`}
              style={tc.sidebarLinkStyle(false)}
            >
              <div className="flex items-center space-x-3">
                <span className="flex-shrink-0">{renderIcon(item, false)}</span>
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </button>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => tc.sidebarLinkClass(isActive)}
              style={({ isActive }) => tc.sidebarLinkStyle(isActive)}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0">{renderIcon(item, isActive)}</span>
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all duration-200 group-hover:translate-x-0.5 ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                </>
              )}
            </NavLink>
          )
        ))}
      </nav>

      {/* Tarjeta de Usuario inferior - Cargo */}
      <div 
        className={`p-4 border-t transition-colors duration-300 ${tc.sidebarUserBg}`}
        style={tc.sidebarUserBgStyle}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full ${theme.avatarBg} flex items-center justify-center font-bold font-title text-sm border shadow-md flex-shrink-0`}>
              {user?.user_metadata?.nombres?.charAt(0)}{user?.user_metadata?.apellidos?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-extrabold truncate leading-none ${activeTheme === 'oscuro' ? 'text-white' : 'text-slate-800'}`}>
                {user?.user_metadata?.nombres} {user?.user_metadata?.apellidos}
              </p>
              <span className={`text-[9px] uppercase font-black tracking-widest leading-none block truncate mt-1 ${activeTheme === 'oscuro' ? 'text-slate-400' : 'text-slate-500'}`}>
                {cargo}
              </span>
            </div>
          </div>
          {tiendaSeleccionada && (
            <div className="mt-1 px-2.5 py-1.5 bg-[#004BCA]/10 dark:bg-[#004BCA]/15 border border-[#004BCA]/20 rounded-xl flex items-center space-x-2 text-[9px] text-slate-350">
              <Store className="w-3.5 h-3.5 text-[#005cff] flex-shrink-0" />
              <span className="font-extrabold truncate uppercase tracking-wider">{tiendaSeleccionada.nombre}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
