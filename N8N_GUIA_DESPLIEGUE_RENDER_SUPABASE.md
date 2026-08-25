# 🚀 Guía de Despliegue n8n en Render.com + Supabase (100% Gratis 24/7)

Esta guía te permite desplegar **n8n oficial** en la nube de forma totalmente gratuita y persistente, conectada a tu base de datos de Supabase para **Marathon Sports MCP1**.

---

## 📋 Resumen de Conexión de tu Proyecto

* **Proyecto Supabase**: `Portal Horarios MCP1` (`aqknspjscmyvdabzgmwz`)
* **Esquema Creado**: `n8n` *(creado y listo en Supabase)*
* **Host Postgres**: `db.aqknspjscmyvdabzgmwz.supabase.co`
* **Puerto**: `5432`
* **Base de Datos**: `postgres`
* **Usuario**: `postgres`
* **Clave de Encriptación generada**: `n8vZjSQTmJ4tacCTh3AzbOHecyA=`

---

## 🛠️ Paso 1: Crear el Servicio Web en Render.com

1. Ve a [https://dashboard.render.com/](https://dashboard.render.com/) e inicia sesión.
2. Haz clic en el botón **"New +"** → **"Web Service"**.
3. Selecciona la opción **"Existing Image"** (o Docker Image).
4. En el campo de imagen introduce:
   ```text
   docker.n8n.io/n8nio/n8n:latest
   ```
5. Configura los datos básicos del servicio:
   * **Name**: `n8n-marathon-mcp1` *(o el nombre que prefieras)*
   * **Region**: `Ohio (US East)` o `Oregon (US West)` *(la más cercana)*
   * **Instance Type**: **Free (512MB RAM)**

---

## 🔐 Paso 2: Variables de Entorno en Render.com

En la sección **"Environment Variables"** de Render, añade las siguientes variables:

| Variable | Valor Recomendado |
| :--- | :--- |
| `N8N_BASIC_AUTH_ACTIVE` | `true` |
| `N8N_BASIC_AUTH_USER` | `admin_marathon` *(o tu usuario)* |
| `N8N_BASIC_AUTH_PASSWORD` | `Marathon2026Secure!` *(tu contraseña)* |
| `N8N_ENCRYPTION_KEY` | `n8vZjSQTmJ4tacCTh3AzbOHecyA=` |
| `DB_TYPE` | `postgresdb` |
| `DB_POSTGRESDB_DATABASE` | `postgres` |
| `DB_POSTGRESDB_HOST` | `db.aqknspjscmyvdabzgmwz.supabase.co` |
| `DB_POSTGRESDB_PORT` | `5432` |
| `DB_POSTGRESDB_USER` | `postgres` |
| `DB_POSTGRESDB_PASSWORD` | `[TU_CONTRASEÑA_DE_SUPABASE]` |
| `DB_POSTGRESDB_SCHEMA` | `n8n` |
| `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED` | `false` |
| `WEBHOOK_URL` | `https://n8n-marathon-mcp1.onrender.com/` *(reemplazar con tu URL de Render)* |

Haz clic en **"Create Web Service"**. Render compilará y n8n creará automáticamente todas las tablas necesarias dentro del esquema `n8n` de Supabase.

---

## 💓 Paso 3: El Heartbeat Keep-Alive (Mantenerlo Vivo 24/7 Gratis)

Render apaga instancias gratuitas tras 15 minutos sin peticiones. Para mantenerlo activo 24/7 sin interrupciones:

1. Entra a tu panel de n8n en Render (`https://tu-servicio.onrender.com`).
2. Ve a **"Workflows"** → Menú de 3 puntos → **"Import from File"**.
3. Selecciona el archivo:
   ```text
   E:\proyectos\02_pagina-horarios-mcp1-v2\n8n_heartbeat_keepalive_workflow.json
   ```
4. En el nodo **"Auto-Ping a Render"**, cambia la URL por la tuya:
   `https://tu-servicio.onrender.com/webhook/heartbeat-ping`
5. Activa el switch **"Active"** del workflow.

¡Listo! El workflow se auto-enviará un ping cada 5 minutos, manteniendo tu n8n siempre encendido y respondiendo al instante.

---

## 🎯 Paso 4: Conectar tu Webhook al Portal Marathon

1. En n8n, crea tu flujo para recibir los eventos del portal.
2. Copia la URL del nodo Webhook de n8n (ej: `https://tu-servicio.onrender.com/webhook/portal-mcp1-events`).
3. Ve a tu Portal Marathon → Pestaña **n8n** (`/automatizaciones`).
4. Pega la URL en **"URL de Webhook General"** y haz clic en **"Guardar Configuración"**.
5. ¡Prueba los botones del simulador y verás tus datos llegar en tiempo real!
