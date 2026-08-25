# GUÍA DE DESARROLLO Y DESPLIEGUE (HORARIO & METAS)

Este documento contiene las instrucciones técnicas para iniciar el servidor de desarrollo local, compilar la aplicación para producción y configurarla en un entorno local o de despliegue en la nube (como Netlify).

---

## 🛠️ Requisitos Previos
Debes tener instalado:
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada).
- Una cuenta de Supabase si deseas enlazar tu base de datos de producción real.

---

## 🚫 REGLA ESTRICTA DE COMPILACIÓN (NO CAMBIAR RUTAS)
> [!IMPORTANT]
> **REGLA DE DESPLIEGUE Y COMPILACIÓN:**
> La carpeta oficial para los resultados de producción (build) es única y está unificada en la raíz del proyecto:
> `C:\Users\User\Desktop\pagina horarios mcp1\dist`
> 
> * **Prohibido** volver a compilar en `frontend/dist` u otras subcarpetas.
> * El archivo `frontend/vite.config.js` está configurado con `build.outDir: '../dist'` para dirigir de manera forzada la compilación a la raíz del proyecto. **No modificar esta directiva.**
> * Toda actualización para Netlify se realiza subiendo el contenido de esta carpeta raíz `/dist`.

---

## 💻 Desarrollo Local

### 1. Ubicación del Proyecto
El proyecto activo para realizar cambios y desarrollo se encuentra en la ruta:
`C:\Users\User\Desktop\pagina horarios mcp1`

### 2. Levantar el Servidor de Desarrollo
Para arrancar el servidor web local con Vite, abre tu terminal (PowerShell, Bash o CMD) en la carpeta del frontend y ejecuta:
```bash
cd "C:\Users\User\Desktop\pagina horarios mcp1\frontend"
npm run dev
```
Esto abrirá un puerto local (ej: `http://localhost:5173`) para visualizar y probar el portal de forma interactiva con recarga automática al guardar cambios.

### 3. Compilación de Producción (Build)
Para compilar la aplicación en un paquete estático optimizado listo para subir a producción:
```bash
cd "C:\Users\User\Desktop\pagina horarios mcp1\frontend"
npm run build
```
La salida del compilador se generará directamente en la carpeta **`dist`** en la raíz (`C:\Users\User\Desktop\pagina horarios mcp1\dist`), que contiene el código HTML/JS/CSS optimizado.

---

## 🔑 Variables de Entorno (`.env`)

En la carpeta `frontend` se encuentra un archivo **`.env`** que contiene las credenciales de conexión a Supabase:
```env
VITE_SUPABASE_URL=https://gkjsnhbczjnljfjvmdoe.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_1TLdvss9uF_X31iT5u7GNA_WV9dvBjH
```

### 🔴 Modo de Simulación Local (Offline Mock Mode)
Si la red tiene problemas o deseas probar la aplicación localmente sin alterar la base de datos de Supabase, puedes activar el simulador local.
- Para forzar el modo de simulación, puedes configurar la variable de entorno en tu archivo `.env`:
  `VITE_FORCE_MOCK_MODE=true`
- Si la variable está activa, el portal utilizará las credenciales y datos de prueba locales definidos en `frontend/src/lib/supabaseMock.js` sin conectarse a internet.

---

## ☁️ Despliegue en la Nube (Netlify)

El proyecto incluye archivos de configuración listos para Netlify (`netlify.toml` tanto en la raíz como en la carpeta frontend).

### Pasos para Desplegar en Netlify:
1. Conecta tu repositorio de GitHub a tu cuenta de Netlify.
2. Configura los siguientes parámetros de construcción en Netlify:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (Configurado en netlify.toml como `../dist` debido a que el comando se ejecuta con base `frontend`)
   - **Base directory:** `frontend`
3. Agrega las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en la configuración de Variables de Entorno del panel de Netlify.
4. ¡Listo! Netlify reconstruirá la aplicación automáticamente en cada commit.
