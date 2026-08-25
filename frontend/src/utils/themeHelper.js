// Theme Helper and Name Utilities for Marathon Sports - V2
// Returns a color scheme based on Role / Department / Gender

export function getFriendlyName(nombres) {
  if (!nombres) return '';
  const nomUpper = String(nombres).trim().toUpperCase();
  
  if (nomUpper.includes('JOSE GUSTAVO')) return 'GUSTAVO';
  if (nomUpper.includes('JOSE DANIEL')) return 'DANIEL';
  if (nomUpper.includes('JOSE LEONARDO')) return 'LEONARDO';
  if (nomUpper.includes('SEGUNDO RAMIRO')) return 'RAMIRO';
  if (nomUpper.includes('LAYLA VALENTINA')) return 'VALENTINA';
  if (nomUpper.includes('KERLY MELISA')) return 'KERLY';
  if (nomUpper.includes('BRAYAN STIK') || nomUpper.includes('BRYAN')) return 'BRYAN';
  if (nomUpper.includes('GENESIS DARLYN')) return 'GENESIS';
  if (nomUpper.includes('ELIANE FERNANDO') || nomUpper.includes('ELIANE')) return 'ELIANE';
  
  // Default to first name
  return nombres.split(/\s+/)[0];
}

export function getEmployeeTheme(cargo, nombres = '', cargoAnterior = '') {
  const cargoLower = String(cargo || '').toLowerCase().trim();
  const nombreFirst = String(nombres || '').split(' ')[0].toUpperCase();

  // 0. Tercero a bordo -> GRADIENTE premium desde cargo anterior a rojo de jefes (#E30613)
  if (cargoLower.includes('tercer')) {
    let prevCargoResolved = String(cargoAnterior || '').toLowerCase().trim();
    if (!prevCargoResolved || prevCargoResolved.includes('tercer')) {
      if (nombreFirst.includes('GENESIS')) {
        prevCargoResolved = 'cajero';
      } else {
        prevCargoResolved = 'asesor'; // Fallback por defecto
      }
    }

    if (prevCargoResolved.includes('caje')) {
      return {
        primary: '#00A389',
        isGradient: true,
        gradientColors: ['#00A389', '#E30613'],
        gradStart: '#00A389',
        gradEnd: '#E30613',
        text: 'text-red-600 font-black',
        bgLight: 'bg-gradient-to-br from-teal-50/40 to-red-50/40',
        bgMedium: 'bg-gradient-to-r from-[#00A389] to-[#E30613]',
        bgHover: 'hover:opacity-90',
        border: 'border-red-200',
        ring: 'focus:ring-red-500/10',
        avatarBg: 'bg-gradient-to-br from-teal-100 to-red-100 text-[#E30613] border-red-200',
        badge: 'bg-gradient-to-r from-teal-50 to-red-50 text-red-800 border-red-150',
        cardHeader: 'from-[#00A389] to-[#E30613] text-white',
        accentLine: 'bg-gradient-to-r from-[#00A389] to-[#E30613]'
      };
    }

    if (prevCargoResolved.includes('bodeg')) {
      return {
        primary: '#B45309',
        isGradient: true,
        gradientColors: ['#B45309', '#E30613'],
        gradStart: '#B45309',
        gradEnd: '#E30613',
        text: 'text-red-600 font-black',
        bgLight: 'bg-gradient-to-br from-amber-50/40 to-red-50/40',
        bgMedium: 'bg-gradient-to-r from-[#B45309] to-[#E30613]',
        bgHover: 'hover:opacity-90',
        border: 'border-red-200',
        ring: 'focus:ring-red-500/10',
        avatarBg: 'bg-gradient-to-br from-amber-100 to-red-100 text-[#E30613] border-red-200',
        badge: 'bg-gradient-to-r from-amber-50 to-red-50 text-red-800 border-red-150',
        cardHeader: 'from-[#B45309] to-[#E30613] text-white',
        accentLine: 'bg-gradient-to-r from-[#B45309] to-[#E30613]'
      };
    }

    if (prevCargoResolved.includes('operat')) {
      return {
        primary: '#64748B',
        isGradient: true,
        gradientColors: ['#64748B', '#E30613'],
        gradStart: '#64748B',
        gradEnd: '#E30613',
        text: 'text-red-600 font-black',
        bgLight: 'bg-gradient-to-br from-slate-50/40 to-red-50/40',
        bgMedium: 'bg-gradient-to-r from-[#64748B] to-[#E30613]',
        bgHover: 'hover:opacity-90',
        border: 'border-red-200',
        ring: 'focus:ring-red-500/10',
        avatarBg: 'bg-gradient-to-br from-slate-100 to-red-100 text-[#E30613] border-red-200',
        badge: 'bg-gradient-to-r from-slate-50 to-red-50 text-red-800 border-red-150',
        cardHeader: 'from-[#64748B] to-[#E30613] text-white',
        accentLine: 'bg-gradient-to-r from-[#64748B] to-[#E30613]'
      };
    }

    // Asesores
    const femaleNames = ['SAMANTHA', 'LAYLA', 'KERLY', 'GENESIS', 'SHANIA', 'PAOLA', 'MARÍA', 'MARIA', 'SARA', 'DIANA', 'CARMEN', 'ANA', 'JULEXY', 'ANAIS'];
    const isFemale = femaleNames.some(name => nombreFirst.includes(name));

    if (isFemale) {
      return {
        primary: '#EC4899',
        isGradient: true,
        gradientColors: ['#EC4899', '#E30613'],
        gradStart: '#EC4899',
        gradEnd: '#E30613',
        text: 'text-red-600 font-black',
        bgLight: 'bg-gradient-to-br from-pink-50/40 to-red-50/40',
        bgMedium: 'bg-gradient-to-r from-[#EC4899] to-[#E30613]',
        bgHover: 'hover:opacity-90',
        border: 'border-red-200',
        ring: 'focus:ring-red-500/10',
        avatarBg: 'bg-gradient-to-br from-pink-100 to-red-100 text-[#E30613] border-red-200',
        badge: 'bg-gradient-to-r from-pink-50 to-red-50 text-red-800 border-red-150',
        cardHeader: 'from-[#EC4899] to-[#E30613] text-white',
        accentLine: 'bg-gradient-to-r from-[#EC4899] to-[#E30613]'
      };
    } else {
      return {
        primary: '#2563EB',
        isGradient: true,
        gradientColors: ['#2563EB', '#E30613'],
        gradStart: '#2563EB',
        gradEnd: '#E30613',
        text: 'text-red-600 font-black',
        bgLight: 'bg-gradient-to-br from-blue-50/40 to-red-50/40',
        bgMedium: 'bg-gradient-to-r from-[#2563EB] to-[#E30613]',
        bgHover: 'hover:opacity-90',
        border: 'border-red-200',
        ring: 'focus:ring-red-500/10',
        avatarBg: 'bg-gradient-to-br from-blue-100 to-red-100 text-[#E30613] border-red-200',
        badge: 'bg-gradient-to-r from-blue-50 to-red-50 text-red-800 border-red-150',
        cardHeader: 'from-[#2563EB] to-[#E30613] text-white',
        accentLine: 'bg-gradient-to-r from-[#2563EB] to-[#E30613]'
      };
    }
  }

  // 1. Jefe / Subjefe -> ROJO (Red)
  if (cargoLower.includes('jefe') || cargoLower.includes('subjefe')) {
    return {
      primary: '#E30613',
      text: 'text-red-600',
      bgLight: 'bg-red-50/50',
      bgMedium: 'bg-[#E30613]',
      bgHover: 'hover:bg-red-750',
      border: 'border-red-200',
      ring: 'focus:ring-red-500/10',
      avatarBg: 'bg-red-100 text-[#E30613] border-red-250',
      badge: 'bg-red-50 text-red-800 border-red-100',
      cardHeader: 'from-red-600 to-red-700 text-white',
      accentLine: 'bg-[#E30613]'
    };
  }

  // 2. Cajero -> TEAL/EMERALD (Caja de facturación)
  if (cargoLower.includes('caje')) {
    return {
      primary: '#00A389',
      text: 'text-teal-600',
      bgLight: 'bg-teal-50/50',
      bgMedium: 'bg-[#00A389]',
      bgHover: 'hover:bg-teal-700',
      border: 'border-teal-200',
      ring: 'focus:ring-teal-500/10',
      avatarBg: 'bg-teal-100 text-[#00A389] border-teal-250',
      badge: 'bg-teal-50 text-teal-800 border-teal-100',
      cardHeader: 'from-teal-500 to-teal-600 text-white',
      accentLine: 'bg-[#00A389]'
    };
  }

  // 3. Bodeguero -> BROWN/CARAMEL (Bodega)
  if (cargoLower.includes('bodeg')) {
    return {
      primary: '#B45309',
      text: 'text-amber-700',
      bgLight: 'bg-amber-50/50',
      bgMedium: 'bg-[#B45309]',
      bgHover: 'hover:bg-amber-800',
      border: 'border-amber-200',
      ring: 'focus:ring-amber-500/10',
      avatarBg: 'bg-amber-100 text-amber-800 border-amber-250',
      badge: 'bg-amber-50 text-amber-800 border-amber-100',
      cardHeader: 'from-amber-600 to-amber-700 text-white',
      accentLine: 'bg-[#B45309]'
    };
  }

  // 4. Operativo -> NEUTRAL SLATE (Operativos)
  if (cargoLower.includes('operat')) {
    return {
      primary: '#64748B',
      text: 'text-slate-600',
      bgLight: 'bg-slate-50/50',
      bgMedium: 'bg-slate-500',
      bgHover: 'hover:bg-slate-700',
      border: 'border-slate-200',
      ring: 'focus:ring-slate-500/10',
      avatarBg: 'bg-slate-100 text-slate-600 border-slate-300',
      badge: 'bg-slate-50 text-slate-800 border-slate-100',
      cardHeader: 'from-slate-500 to-slate-600 text-white',
      accentLine: 'bg-slate-500'
    };
  }

  // 5. Asesores (Asesores de Ventas)
  // Determinar género por primer nombre
  const femaleNames = ['SAMANTHA', 'LAYLA', 'KERLY', 'GENESIS', 'SHANIA', 'PAOLA', 'MARÍA', 'MARIA', 'SARA', 'DIANA', 'CARMEN', 'ANA', 'JULEXY', 'ANAIS'];
  const isFemale = femaleNames.some(name => nombreFirst.includes(name));

  if (isFemale) {
    // MUJER -> VIBRANT PINK/ROSE (Divertido para mujeres)
    return {
      primary: '#EC4899',
      text: 'text-pink-600',
      bgLight: 'bg-pink-50/50',
      bgMedium: 'bg-pink-500',
      bgHover: 'hover:bg-pink-600',
      border: 'border-pink-200',
      ring: 'focus:ring-pink-500/10',
      avatarBg: 'bg-pink-100 text-pink-600 border-pink-250',
      badge: 'bg-pink-50 text-pink-850 border-pink-100',
      cardHeader: 'from-pink-500 to-pink-600 text-white',
      accentLine: 'bg-pink-500'
    };
  } else {
    // HOMBRE -> VIBRANT BLUE/INDIGO (Divertido para hombres)
    return {
      primary: '#2563EB',
      text: 'text-blue-600',
      bgLight: 'bg-blue-50/50',
      bgMedium: 'bg-blue-500',
      bgHover: 'hover:bg-blue-600',
      border: 'border-blue-200',
      ring: 'focus:ring-blue-500/10',
      avatarBg: 'bg-blue-100 text-blue-600 border-blue-250',
      badge: 'bg-blue-50 text-blue-850 border-blue-100',
      cardHeader: 'from-blue-500 to-blue-600 text-white',
      accentLine: 'bg-blue-500'
    };
  }
}
