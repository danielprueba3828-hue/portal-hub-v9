// Helper para gestionar notificaciones push mediante Webpushr y Capacitor Local Notifications

export const registerPushAttributes = (user) => {
  if (typeof window !== 'undefined' && window.webpushr) {
    try {
      const cargo = (user?.user_metadata?.cargo || user?.cargo || '').toLowerCase();
      const rol = (user?.user_metadata?.rol || user?.rol || '').toLowerCase();
      const zona = (user?.user_metadata?.zona || user?.zona || '').toLowerCase();
      
      const esJefe = ['jefe', 'subjefe', 'tercer', 'supervisor', 'admin'].some(r => cargo.includes(r) || rol.includes(r));
      const esBodeguero = ['bodega', 'bodeguero'].some(r => cargo.includes(r) || zona.includes('bodega'));
      const esAsesor = ['asesor', 'ventas'].some(r => cargo.includes(r) || rol.includes(r)) && !esJefe;

      window.webpushr('attributes', {
        'es_jefe': esJefe ? 'si' : 'no',
        'es_bodeguero': esBodeguero ? 'si' : 'no',
        'es_asesor': esAsesor ? 'si' : 'no',
        'recibe_bitacoras': (esJefe || esBodeguero) ? 'si' : 'no',
        'recibe_metas': (esAsesor || esJefe) ? 'si' : 'no',
        'cargo': user?.user_metadata?.cargo || 'Colaborador',
        'cedula': user?.user_metadata?.cedula || user?.cedula || ''
      });
      
      console.log('Atributos de Webpushr registrados con éxito:', {
        es_jefe: esJefe ? 'si' : 'no',
        es_bodeguero: esBodeguero ? 'si' : 'no',
        es_asesor: esAsesor ? 'si' : 'no'
      });
    } catch (err) {
      console.error('Error al registrar atributos en Webpushr:', err);
    }
  }
};

/**
 * Enviar notificación push segmentada
 * targetSegment: 'todos' | 'jefes' | 'bodegueros' | 'bodega_y_jefes' | 'asesores'
 */
export const sendPushNotification = async ({ targetSegment = 'todos', type, title, message, targetUrl }) => {
  const keys = {
    webpushrKey: 'afd629945bb5d815726abcae41274b15',
    webpushrAuthToken: '122138'
  };

  const segment = targetSegment || type;
  let endpoint = 'https://api.webpushr.com/v1/notification/send/all';
  let payload = {
    title: title || 'Portal Marathon MCP1',
    message: message || 'Tienes una nueva actualización en el portal.',
    target_url: targetUrl ? (targetUrl.startsWith('http') ? targetUrl : `${window.location.origin}${targetUrl}`) : window.location.origin
  };

  if (segment === 'jefes') {
    endpoint = 'https://api.webpushr.com/v1/notification/send/attribute';
    payload.attribute = { key: 'es_jefe', value: 'si' };
  } else if (segment === 'bodegueros') {
    endpoint = 'https://api.webpushr.com/v1/notification/send/attribute';
    payload.attribute = { key: 'es_bodeguero', value: 'si' };
  } else if (segment === 'bodega_y_jefes' || segment === 'bitacoras') {
    endpoint = 'https://api.webpushr.com/v1/notification/send/attribute';
    payload.attribute = { key: 'recibe_bitacoras', value: 'si' };
  } else if (segment === 'asesores' || segment === 'metas') {
    endpoint = 'https://api.webpushr.com/v1/notification/send/attribute';
    payload.attribute = { key: 'recibe_metas', value: 'si' };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webpushrKey': keys.webpushrKey,
        'webpushrAuthToken': keys.webpushrAuthToken
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log(`Push despachado a segmento [${segment}]:`, data);
    return data;
  } catch (err) {
    console.error('Fallo al despachar notificación push:', err);
    return null;
  }
};
