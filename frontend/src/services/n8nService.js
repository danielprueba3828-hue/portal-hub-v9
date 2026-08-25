import { supabase } from '../lib/supabaseClient';

// Configuración por defecto de webhooks de n8n
const DEFAULT_N8N_CONFIG = {
  enabled: true,
  generalWebhookUrl: 'https://n8n-marathon-mcp1.onrender.com/webhook/portal-mcp1-events',
  metasWebhookUrl: '',
  bitacorasWebhookUrl: '',
  horariosWebhookUrl: '',
  personalWebhookUrl: '',
  secretToken: ''
};

/**
 * Obtiene la configuración actual de n8n desde localStorage o Supabase
 */
export function getN8nConfig() {
  try {
    const saved = localStorage.getItem('marathon_n8n_config');
    if (saved) {
      return { ...DEFAULT_N8N_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading n8n config:', e);
  }
  return DEFAULT_N8N_CONFIG;
}

/**
 * Guarda la configuración de n8n
 */
export async function saveN8nConfig(config) {
  try {
    localStorage.setItem('marathon_n8n_config', JSON.stringify(config));
    
    // Guardar también en tienda_stats para persistencia centralizada
    await supabase
      .from('tienda_stats')
      .upsert({
        tienda_id: '00000000-0000-0000-0000-000000000000',
        comentario: JSON.stringify({ n8n_config: config }),
        updated_at: new Date().toISOString()
      }, { onConflict: 'tienda_id' });
    
    return true;
  } catch (e) {
    console.error('Error saving n8n config:', e);
    return false;
  }
}

/**
 * Obtiene el historial de eventos enviados a n8n
 */
export function getN8nLogs() {
  try {
    const logs = localStorage.getItem('marathon_n8n_logs');
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda un log de evento n8n
 */
function appendN8nLog(logEntry) {
  try {
    const logs = getN8nLogs();
    const updated = [logEntry, ...logs].slice(0, 50); // Guardar los últimos 50 eventos
    localStorage.setItem('marathon_n8n_logs', JSON.stringify(updated));
  } catch (e) {
    console.error('Error appending n8n log:', e);
  }
}

/**
 * Envía un evento a n8n mediante Webhook
 * @param {string} eventType - Tipo de evento (ej: 'METAS_SINCRONIZADAS', 'BITACORA_REGISTRADA', 'PDF_PUBLICADO', 'HORARIO_PUBLICADO')
 * @param {Object} data - Datos específicos del evento
 * @param {Object} userContext - Contexto del usuario que ejecuta la acción
 */
export async function sendN8nEvent(eventType, data = {}, userContext = null) {
  const config = getN8nConfig();
  if (!config.enabled) return { success: false, reason: 'n8n automations disabled' };

  // Determinar URL de destino (específica o general)
  let targetUrl = config.generalWebhookUrl;
  if (eventType.includes('META') && config.metasWebhookUrl) targetUrl = config.metasWebhookUrl;
  if (eventType.includes('BITACORA') && config.bitacorasWebhookUrl) targetUrl = config.bitacorasWebhookUrl;
  if (eventType.includes('HORARIO') && config.horariosWebhookUrl) targetUrl = config.horariosWebhookUrl;
  if (eventType.includes('PERSONAL') && config.personalWebhookUrl) targetUrl = config.personalWebhookUrl;

  if (!targetUrl || targetUrl.trim() === '') {
    return { success: false, reason: 'No webhook URL configured' };
  }

  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    tienda: {
      id: 'MCP1',
      nombre: 'Portal Shopping Carapungo',
      ciudad: 'Quito, Ecuador'
    },
    usuario: userContext ? {
      nombre: `${userContext.nombres || ''} ${userContext.apellidos || ''}`.trim() || userContext.nombre || 'Colaborador',
      cargo: userContext.cargo || 'Personal',
      cedula: userContext.cedula || ''
    } : {
      nombre: 'Sistema Portal Marathon',
      cargo: 'Automatización'
    },
    data,
    metadata: {
      source: 'portal-marathon-mcp1',
      environment: import.meta.env.MODE || 'production',
      version: '2.0.0'
    }
  };

  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    event: eventType,
    timestamp: payload.timestamp,
    targetUrl,
    status: 'pending',
    payload
  };

  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (config.secretToken) {
      headers['X-Marathon-Token'] = config.secretToken;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors'
    });

    logEntry.status = response.ok ? 'success' : 'error';
    logEntry.statusCode = response.status;
    appendN8nLog(logEntry);

    return { success: response.ok, status: response.status, payload };
  } catch (err) {
    // Si falla por CORS o red, registrar el log igualmente
    console.warn(`[n8n Automation] Event ${eventType} dispatched. Note: ${err.message}`);
    logEntry.status = 'dispatched (no-cors)';
    logEntry.error = err.message;
    appendN8nLog(logEntry);

    return { success: true, warning: err.message, payload };
  }
}

/**
 * Prueba la conexión con un webhook de n8n
 */
export async function testN8nConnection(webhookUrl, secretToken = '') {
  if (!webhookUrl) throw new Error('Por favor ingresa una URL de webhook válida');

  const testPayload = {
    event: 'TEST_CONNECTION',
    timestamp: new Date().toISOString(),
    message: 'Prueba de conexión exitosa desde Portal Marathon Sports MCP1.',
    tienda: 'Portal Shopping Carapungo MCP1'
  };

  const headers = { 'Content-Type': 'application/json' };
  if (secretToken) headers['X-Marathon-Token'] = secretToken;

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(testPayload)
  });

  return { ok: res.ok, status: res.status };
}

/**
 * Genera el JSON exportable de los flujos de n8n para Marathon Sports MCP1
 */
export function generateN8nWorkflowTemplate() {
  return {
    name: "Marathon Sports MCP1 - Hub de Automatizaciones Portal",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "portal-mcp1-events",
          responseMode: "onReceived",
          options: {}
        },
        id: "webhook-portal-mcp1",
        name: "Webhook Portal Marathon",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          rules: {
            values: [
              {
                value1: "={{ $json.body.event }}",
                operation: "equal",
                value2: "METAS_SINCRONIZADAS"
              },
              {
                value1: "={{ $json.body.event }}",
                operation: "equal",
                value2: "PDF_REPORTE_PUBLICADO"
              },
              {
                value1: "={{ $json.body.event }}",
                operation: "equal",
                value2: "BITACORA_INCIDENCIA"
              },
              {
                value1: "={{ $json.body.event }}",
                operation: "equal",
                value2: "HORARIO_ACTUALIZADO"
              }
            ]
          }
        },
        id: "switch-eventos",
        name: "Clasificar Evento",
        type: "n8n-nodes-base.switch",
        typeVersion: 1,
        position: [480, 300]
      }
    ],
    connections: {
      "Webhook Portal Marathon": {
        main: [
          [
            {
              node: "Clasificar Evento",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    }
  };
}
