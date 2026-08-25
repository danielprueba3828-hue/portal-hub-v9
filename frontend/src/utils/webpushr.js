/**
 * Utilidad para enviar notificaciones Push a todos los suscriptores usando la REST API de Webpushr.
 */
export const sendPushNotification = async (title, message, targetUrl = '') => {
  try {
    const payload = {
      title,
      message,
      target_url: targetUrl || window.location.origin
    };

    const response = await fetch('https://api.webpushr.com/v1/notification/send/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webpushrKey': 'afd629945bb5d815726abcae41274b15',
        'webpushrAuthToken': '122138'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Notificación Webpushr enviada:', data);
    return data;
  } catch (error) {
    console.error('Error al enviar notificación Webpushr:', error);
    return { status: 'error', error: error.message };
  }
};
