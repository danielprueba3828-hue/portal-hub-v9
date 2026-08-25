import { create } from 'zustand';

// Marathon Sports V1 - Theme Store
// 2 temas: clasico (blanco limpio) y oscuro (dark + colores del cargo)
const initialTheme = localStorage.getItem('marathon_theme') || 'oscuro';
if (typeof document !== 'undefined') {
  if (initialTheme === 'clasico') {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.backgroundColor = '#f8fafc';
    if (document.body) document.body.style.backgroundColor = '#f8fafc';
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#060b17';
    if (document.body) document.body.style.backgroundColor = '#060b17';
  }
}

export const useThemeStore = create((set, get) => ({
  // Tema activo: 'clasico' | 'oscuro'
  theme: initialTheme,

  setTheme: (newTheme) => {
    localStorage.setItem('marathon_theme', newTheme);
    if (typeof document !== 'undefined') {
      const isClasico = newTheme === 'clasico';
      const bgColor = isClasico ? '#f8fafc' : '#060b17';
      
      if (isClasico) {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }

      document.documentElement.style.backgroundColor = bgColor;
      if (document.body) document.body.style.backgroundColor = bgColor;

      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute('content', bgColor);
      }
    }
    set({ theme: newTheme });
  },

  // Ciclar / Toggle entre temas (solo clásico y oscuro)
  cycleTheme: () => {
    const current = get().theme;
    const next = current === 'clasico' ? 'oscuro' : 'clasico';
    get().setTheme(next);
  },

  toggleTheme: () => {
    get().cycleTheme();
  },

  // Densidad activa: 'compacto' | 'normal' | 'grande'
  density: localStorage.getItem('portal_density') || 'compacto',

  setDensity: (newDensity) => {
    localStorage.setItem('portal_density', newDensity);
    set({ density: newDensity });
  }
}));

// Helper: Generador de colores pastel premium armónicos para el tema Clásico por Cargo
// Ofrece una atenuación escalonada del blanco para Computadoras y pantallas grandes
const getClasicoThemeColors = (hex) => {
  const h = hex.toUpperCase();
  switch (h) {
    case '#E30613': // Jefe / Subjefe (Rojo Corporativo)
      return {
        mainBg: '#FDFDFD',
        sidebarBg: '#FAF6F6',
        navbarBg: '#FAF6F6',
        cardBg: '#FCFAFA',
        sidebarHeaderBg: '#F5ECEC',
        sidebarUserBg: '#F5ECEC',
        borderColor: '#F5ECEC',
        navbarClockBg: '#FAF0F0',
        navbarWelcomeBadge: '#FAF0F0',
        inputBg: '#FFFDFD',
        tableHeaderBg: '#F5ECEC'
      };
    case '#00A389': // Cajero (Verde Esmeralda)
      return {
        mainBg: '#FDFDFD',
        sidebarBg: '#F5FAF8',
        navbarBg: '#F5FAF8',
        cardBg: '#FAFCFB',
        sidebarHeaderBg: '#E6F5F2',
        sidebarUserBg: '#E6F5F2',
        borderColor: '#E6F5F2',
        navbarClockBg: '#EDF7F5',
        navbarWelcomeBadge: '#EDF7F5',
        inputBg: '#FAFCFB',
        tableHeaderBg: '#E6F5F2'
      };
    case '#B45309': // Bodeguero (Ámbar / Madera)
      return {
        mainBg: '#FDFDFD',
        sidebarBg: '#FAF7F2',
        navbarBg: '#FAF7F2',
        cardBg: '#FCFAF7',
        sidebarHeaderBg: '#F5EDE1',
        sidebarUserBg: '#F5EDE1',
        borderColor: '#F5EDE1',
        navbarClockBg: '#FAF2E6',
        navbarWelcomeBadge: '#FAF2E6',
        inputBg: '#FCFAF7',
        tableHeaderBg: '#F5EDE1'
      };
    case '#64748B': // Operativo (Gris Pizarra / Neutro)
      return {
        mainBg: '#FCFCFC',
        sidebarBg: '#F6F7F9',
        navbarBg: '#F6F7F9',
        cardBg: '#FAFBFB',
        sidebarHeaderBg: '#EDEDF2',
        sidebarUserBg: '#EDEDF2',
        borderColor: '#EDEDF2',
        navbarClockBg: '#F4F4F6',
        navbarWelcomeBadge: '#F4F4F6',
        inputBg: '#FAFBFB',
        tableHeaderBg: '#EDEDF2'
      };
    case '#EC4899': // Female Asesor (Rosa / Magenta)
      return {
        mainBg: '#FDFDFD',
        sidebarBg: '#FAF5F7',
        navbarBg: '#FAF5F7',
        cardBg: '#FCFAFB',
        sidebarHeaderBg: '#F5E8EE',
        sidebarUserBg: '#F5E8EE',
        borderColor: '#F5E8EE',
        navbarClockBg: '#FAF0F4',
        navbarWelcomeBadge: '#FAF0F4',
        inputBg: '#FCFAFB',
        tableHeaderBg: '#F5E8EE'
      };
    case '#2563EB': // Male Asesor (Azul Eléctrico)
    default:
      return {
        mainBg: '#FDFDFD',
        sidebarBg: '#F5F7FA',
        navbarBg: '#F5F7FA',
        cardBg: '#FAFCFD',
        sidebarHeaderBg: '#E6ECF5',
        sidebarUserBg: '#E6ECF5',
        borderColor: '#E6ECF5',
        navbarClockBg: '#EDF1F7',
        navbarWelcomeBadge: '#EDF1F7',

        inputBg: '#FAFCFD',
        tableHeaderBg: '#E6ECF5'
      };
  }
};

// Helper: Obtener clases CSS dinámicas basadas en el tema activo + colores del cargo
export function getThemeClasses(theme, employeeTheme) {
  const primary = employeeTheme?.primary || '#2563EB';
  const isGrad = employeeTheme?.isGradient;
  const gradStart = employeeTheme?.gradStart || employeeTheme?.gradientColors?.[0] || '#00A389';
  const gradEnd = employeeTheme?.gradEnd || employeeTheme?.gradientColors?.[1] || '#E30613';

  switch (theme) {
    case 'oscuro':
      return {
        containerBg: 'bg-transparent text-slate-100',
        cardBg: 'bg-[#0c1427]/45 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300',
        cardBgStyle: isGrad
          ? {
              background: `linear-gradient(#0c1427, #0c1427) padding-box, linear-gradient(to right, ${gradStart}, ${gradEnd}) border-box`,
              border: '1.5px solid transparent',
              borderRadius: '24px'
            }
          : { borderTop: `5px solid ${primary}` },
        cardHeaderStyle: isGrad
          ? { background: `linear-gradient(to right, ${gradStart}12, ${gradEnd}12)`, borderBottom: '1px solid rgba(255,255,255,0.05)' }
          : { backgroundColor: `${primary}12`, borderBottom: '1px solid rgba(255,255,255,0.05)' },
        tableBg: 'transition-all duration-300 backdrop-blur-lg bg-[#0c1427]/30 border border-slate-800/80 shadow-inner',
        tableBgStyle: {},
        tableHeaderStyle: isGrad
          ? { background: `linear-gradient(to right, ${gradStart}18, ${gradEnd}18)` }
          : { backgroundColor: `${primary}18` },
        tableHeaderText: 'text-slate-100 font-extrabold',
        tableRowHover: 'hover:bg-[#1E294B]/50',
        inputBg: 'bg-[#050A16]/50 backdrop-blur-md border-slate-850 text-slate-100 placeholder-slate-500 focus:border-[#004BCA]/50 focus:ring-2 focus:ring-[#004BCA]/10 focus:bg-[#050A16]/75 transition-all text-sm font-semibold outline-none',
        inputBgStyle: {},
        mainBg: 'transition-colors duration-300',
        mainBgStyle: { background: 'linear-gradient(135deg, #020D20 0%, #081229 50%, #010816 100%)' },
        textPrimary: 'text-white font-extrabold',
        textSecondary: 'text-slate-100 font-semibold',
        textMuted: 'text-slate-300 font-medium',
        borderColor: 'border-slate-800/80',
        borderColorStyle: { borderColor: '#1E294B' },
        accentBorder: 'border-l-4',
        accentBorderStyle: isGrad
          ? { borderImage: `linear-gradient(to bottom, ${gradStart}, ${gradEnd}) 1` }
          : { borderLeftColor: primary },
        badgeBg: '',
        badgeBgStyle: isGrad
          ? { background: `linear-gradient(to right, ${gradStart}25, ${gradEnd}25)`, color: gradEnd, borderColor: `${gradEnd}40` }
          : { backgroundColor: `${primary}25`, color: `${primary}`, borderColor: `${primary}40`, textShadow: '0 0 10px rgba(255,255,255,0.1)' },
        label: 'oscuro',
        icon: '🌙',
        
        // Navbar classes
        navbarBg: 'bg-[#0c1427]/45 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-lg',
        navbarBgStyle: isGrad
          ? { borderBottom: '5px solid', borderImage: `linear-gradient(to right, ${gradStart}, ${gradEnd}) 1` }
          : { borderBottomColor: primary, borderBottomWidth: '5px' },
        navbarTitleColor: 'text-white font-black tracking-wider',
        navbarSubtitleColor: 'text-slate-300 font-extrabold',
        navbarClockBg: 'bg-[#050A16]/60 backdrop-blur-md border border-slate-800/50 text-slate-100 font-bold',
        navbarClockBgStyle: {},
        navbarWelcomeBadge: 'bg-[#050A16]/60 backdrop-blur-md border border-slate-800/50 text-white hover:bg-[#0c1427]/60 transition-colors',
        navbarWelcomeBadgeStyle: {},
        navbarWelcomeText: 'text-slate-100 font-black',

        // Sidebar classes
        sidebarBg: 'bg-[#050A16]/50 backdrop-blur-2xl text-white border-r border-slate-800/80 shadow-2xl',
        sidebarBgStyle: {},
        sidebarHeaderBg: 'bg-[#020712]/50 border-b border-slate-800/80',
        sidebarHeaderBgStyle: {},
        sidebarUserBg: 'bg-[#020712]/50 border-t border-slate-800/80',
        sidebarUserBgStyle: {},
        sidebarLinkClass: (isActive) => `flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive ? 'text-white shadow-lg' : 'text-slate-200 hover:bg-slate-800/50 hover:text-white'}`,
        sidebarLinkStyle: (isActive) => isActive 
          ? (isGrad 
              ? { background: `linear-gradient(to right, ${gradStart}, ${gradEnd})`, boxShadow: `0 4px 12px rgba(227,6,19,0.3)` }
              : { backgroundColor: primary, boxShadow: `0 4px 12px ${primary}40` }
            ) 
          : {}
      };

    default: { // clasico
      const colors = getClasicoThemeColors(primary);
      return {
        containerBg: 'bg-transparent text-slate-850',
        cardBg: 'bg-white/85 backdrop-blur-md border border-slate-200/60 shadow-md transition-all duration-300',
        cardBgStyle: isGrad
          ? {
              background: `linear-gradient(${colors.cardBg}, ${colors.cardBg}) padding-box, linear-gradient(to right, ${gradStart}, ${gradEnd}) border-box`,
              border: '1.5px solid transparent',
              borderRadius: '24px'
            }
          : { borderLeft: `4px solid ${primary}`, backgroundColor: colors.cardBg + 'D9', borderColor: colors.borderColor + '99' },
        cardHeaderStyle: isGrad
          ? { background: `linear-gradient(to right, ${gradStart}12, ${gradEnd}12)`, borderBottom: `1px solid ${colors.borderColor}` }
          : { backgroundColor: `${primary}12`, borderBottom: `1px solid ${colors.borderColor}` },
        tableBg: 'transition-all duration-300 backdrop-blur-lg bg-white/70 border border-slate-200/50',
        tableBgStyle: { backgroundColor: colors.cardBg + '80' },
        tableHeaderStyle: { backgroundColor: colors.tableHeaderBg + 'E6' },
        tableHeaderText: 'text-slate-900 font-black',
        tableRowHover: 'hover:bg-black/5',
        inputBg: 'bg-white/95 border border-slate-200 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 text-slate-800 text-sm font-bold outline-none transition-all focus:bg-white',
        inputBgStyle: { borderColor: colors.borderColor + 'B3', color: '#0F172A' },
        mainBg: 'transition-colors duration-300',
        mainBgStyle: { background: 'radial-gradient(circle at 10% 20%, rgba(0, 75, 202, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(227, 6, 19, 0.03) 0%, transparent 50%), ' + colors.mainBg },
        textPrimary: 'text-slate-900 font-black',
        textSecondary: 'text-slate-800 font-extrabold',
        textMuted: 'text-slate-700 font-bold',
        borderColor: 'border-slate-200',
        borderColorStyle: { borderColor: colors.borderColor + '99' },
        accentBorder: 'border-l-4',
        accentBorderStyle: isGrad
          ? { borderImage: `linear-gradient(to bottom, ${gradStart}, ${gradEnd}) 1` }
          : { borderLeftColor: primary },
        badgeBg: '',
        badgeBgStyle: isGrad
          ? { background: `linear-gradient(to right, ${gradStart}12, ${gradEnd}12)`, color: gradEnd, borderColor: `${gradEnd}30` }
          : { backgroundColor: `${primary}12`, color: `${primary}`, borderColor: `${primary}30` },
        label: 'clásico',
        icon: '☀️',
        
        // Navbar classes
        navbarBg: 'backdrop-blur-xl border-b-[5px] transition-colors duration-300 shadow-lg',
        navbarBgStyle: isGrad
          ? { backgroundColor: `${colors.navbarBg}99`, borderBottom: '5px solid', borderImage: `linear-gradient(to right, ${gradStart}, ${gradEnd}) 1` }
          : { backgroundColor: `${colors.navbarBg}99`, borderColor: primary },
        navbarTitleColor: 'text-slate-950 font-black tracking-wider',
        navbarSubtitleColor: 'text-slate-700 font-black',
        navbarClockBg: 'border transition-colors duration-300',
        navbarClockBgStyle: { backgroundColor: colors.navbarClockBg + 'B3', borderColor: colors.borderColor + 'B3', color: '#0F172A', backdropFilter: 'blur(8px)' },
        navbarWelcomeBadge: 'border transition-all duration-300 hover:bg-black/5',
        navbarWelcomeBadgeStyle: { backgroundColor: colors.navbarWelcomeBadge + 'B3', borderColor: colors.borderColor + 'B3', color: '#0F172A', backdropFilter: 'blur(8px)' },
        navbarWelcomeText: 'text-slate-900 font-black',

        // Sidebar classes
        sidebarBg: 'border-r transition-all duration-300 backdrop-blur-2xl shadow-xl',
        sidebarBgStyle: { backgroundColor: colors.sidebarBg + 'A6', borderColor: colors.borderColor + '80' },
        sidebarHeaderBg: 'transition-colors duration-300 border-b',
        sidebarHeaderBgStyle: { backgroundColor: colors.sidebarHeaderBg + '80', borderColor: colors.borderColor + '80' },
        sidebarUserBg: 'transition-colors duration-300 border-t',
        sidebarUserBgStyle: { backgroundColor: colors.sidebarUserBg + '80', borderColor: colors.borderColor + '80' },
        sidebarLinkClass: (isActive) => `flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive ? 'shadow-md text-slate-950 font-black' : 'text-slate-700 hover:bg-black/5 hover:text-slate-950'}`,
        sidebarLinkStyle: (isActive) => isActive 
          ? (isGrad
              ? { background: `linear-gradient(to right, ${gradStart}25, ${gradEnd}25)`, color: gradEnd }
              : { backgroundColor: `${primary}25`, color: primary }
            )
          : {}
      };
    }
  }
}
