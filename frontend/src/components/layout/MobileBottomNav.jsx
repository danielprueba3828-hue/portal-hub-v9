import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { 
  LayoutDashboard, 
  Calendar, 
  Target, 
  ClipboardList, 
  Users,
  Package
} from 'lucide-react';

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  const isLight = theme === 'clasico';
  const myCargo = user?.user_metadata?.cargo || '';
  const myRol = user?.user_metadata?.rol || '';
  
  const isDirectivo = ['jefe', 'subjefe', 'tercer', 'supervisor', 'admin'].some(r => 
    (myCargo || '').toLowerCase().includes(r) || (myRol || '').toLowerCase().includes(r)
  );
  const isBodeguero = ['bodega', 'bodeguero', 'asistente de bodega'].some(r => 
    (myCargo || '').toLowerCase().includes(r) || (user?.user_metadata?.zona || '').toLowerCase().includes('bodega')
  );

  const navItems = [
    {
      to: '/',
      label: 'Inicio',
      icon: LayoutDashboard
    },
    {
      to: '/horarios',
      label: 'Horarios',
      icon: Calendar
    },
    ...((!isBodeguero || isDirectivo) ? [{
      to: '/metas',
      label: 'Metas',
      icon: Target
    }] : []),
    ...(isDirectivo ? [
      {
        to: '/bitacoras',
        label: 'Bitácoras',
        icon: ClipboardList
      },
      {
        to: '/personal',
        label: 'Personal',
        icon: Users
      }
    ] : isBodeguero ? [
      {
        to: '/bitacoras',
        label: 'Bodega',
        icon: Package
      }
    ] : [])
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t backdrop-blur-2xl px-1.5 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-all duration-200 ${
      isLight 
        ? 'bg-white/98 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]' 
        : 'bg-[#060b17]/98 border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]'
    }`}>
      <nav className="flex items-center justify-around overflow-x-auto scrollbar-none max-w-lg mx-auto gap-0.5 px-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 active:scale-90 shrink-0 min-w-[58px] ${
                isActive 
                  ? isLight ? 'text-blue-600 font-black' : 'text-blue-400 font-black'
                  : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-105' 
                  : 'bg-transparent'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
