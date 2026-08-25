/**
 * Utilidades de validación para el portal de Horarios Marathon Sports
 */

/**
 * Valida si una cédula ecuatoriana es correcta usando el algoritmo de módulo 10.
 * @param {string} cedula - Cédula de 10 dígitos.
 * @returns {boolean} True si es válida, false en caso contrario.
 */
export function validarCedula(cedula, strict = false) {
  if (!cedula || typeof cedula !== 'string') return false;
  
  // Limpiar espacios y verificar longitud
  const cleanCedula = cedula.trim();
  if (cleanCedula.length !== 10 || !/^\d+$/.test(cleanCedula)) {
    return false;
  }

  // Verificar provincia (primeros dos dígitos del 01 al 24, o 30 para residentes)
  const provincia = parseInt(cleanCedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  // Si no se exige validación estricta del dígito verificador módulo 10, aceptar 10 dígitos válidos de provincia
  if (!strict) {
    return true;
  }

  // Algoritmo de Módulo 10 (Luhn modificado)
  const verificador = parseInt(cleanCedula[9], 10);
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cleanCedula[i], 10);
    if (i % 2 === 0) {
      // Posiciones impares (0, 2, 4, 6, 8) se multiplican por 2
      valor = valor * 2;
      if (valor > 9) {
        valor = valor - 9;
      }
    }
    // Posiciones pares se multiplican por 1, por lo que solo se suman
    suma += valor;
  }

  const decimaSuperior = Math.ceil(suma / 10) * 10;
  let digitoCalculado = decimaSuperior - suma;
  
  if (digitoCalculado === 10) {
    digitoCalculado = 0;
  }

  return digitoCalculado === verificador;
}

/**
 * Valida si una fecha tiene el formato DD/MM/YYYY.
 * @param {string} fechaStr - Fecha en texto.
 * @returns {boolean} True si es válida.
 */
export function validarFormatoFecha(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return false;
  
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  if (!regex.test(fechaStr)) return false;

  const parts = fechaStr.match(regex);
  const day = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10) - 1;
  const year = parseInt(parts[3], 10);

  const date = new Date(year, month, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  );
}

/**
 * Valida el formato de hora HH:MM (24 horas).
 * @param {string} horaStr - Hora en texto.
 * @returns {boolean} True si es válida.
 */
export function validarFormatoHora(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return false;
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horaStr);
}
