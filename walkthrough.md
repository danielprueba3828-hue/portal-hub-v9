# Walkthrough de Implementación: Portal Hub - Versión V6.1

Se han completado todas las modificaciones de la versión V6.1. En esta versión se han introducido mejoras fundamentales para el control y seguridad del cuadre de zapatos diario:
1. **Separación de Devoluciones y Excel**: El sistema ahora opera exclusivamente con las devoluciones y garantías ingresadas/escaneadas desde celulares por las cajeras y jefes a Supabase (`registro_devoluciones`), eliminando el parseo de transacciones "devuelto" del reporte de piso en Excel.
2. **Auto-Conciliación de Stock Cero**: Cualquier artículo solicitado que tenga stock 0 en el catálogo de inventario (`pegarstock`) ya no se clasifica como Faltante, sino que se auto-concilia como una venta exitosa (`Venta (Stock 0)`), evitando reportar faltantes falsos.
3. **Restricción de Permisos y Consulta de Historial (Solo Lectura para Jefes)**: Se bloqueó la posibilidad de editar y guardar cierres para roles no-bodegueros (Jefes, Subjefes, Tercero a Bordo). Cuando ellos acceden a la página del Cuadre de Zapatos, el sistema consulta automáticamente la base de datos para mostrarles el resumen consolidado del día seleccionado en modo de solo lectura (ocultando los controles de subida de archivos, botones de guardar y acciones manuales de cuadre).
4. **Persistencia de Sub-métricas de Conciliación (Solución al 0% en Historial)**: Se crearon columnas en Supabase (`total_ventas`, `total_tipeo`, `total_floor_devoluciones`, `total_ajustes_manuales`) para almacenar y recargar los contadores específicos en el modo histórico, solucionando el problema donde los indicadores de conciliados se mostraban en 0 al consultar cuadres del pasado.

---

## 🏬 1. Reconciliación Exclusiva de Ingresos y Garantías (Versión V6.1)
*   **Eliminación de Devoluciones de Excel**: Se eliminó por completo el bloque de mapeo automático de `rawExcelReturns` desde el archivo Excel del Reporte de Piso.
*   **Exclusión de Devueltos**: Conforme a la confirmación de que "devuelto no es ingreso" sino una solicitud regresada y vuelta a pedir en piso, estas transacciones ya no se muestran ni se procesan como entradas/retornos de inventario.
*   **Fuente Única de Base de Datos**: La lista en la pestaña "Ingresos y Garantías" ahora consume exclusivamente las lecturas y escaneos reales guardados en `registro_devoluciones` por cajeras o subjefes desde sus celulares.
*   **Conciliación Cruzada**: El motor FIFO del cuadre calcula `combinedRet` comparando el tipeo de bodega con las devoluciones de la base de datos (`Math.max(tipeoRet, dbRet)`).
*   **Regla de Stock 0**: Si una solicitud de calzado no se puede conciliar por flujo normal, pero el artículo tiene stock de `0` unidades registrado en `pegarstock`, el sistema lo marca como `Venta (Stock 0)` en vez de reportarlo como faltante.
*   **Consulta Histórica de Solo Lectura para Jefes**: 
    *   **Bodegueros**: Tienen permisos completos de edición, subida de archivos y almacenamiento.
    *   **Jefes y Terceros a Bordo**: Ven la interfaz en modo solo lectura. Al seleccionar una fecha, se carga el historial completo del cuadre guardado. Si no hay cuadre para ese día, se muestra un banner explicativo indicando que aún no se ha registrado. Se eliminaron todas las acciones de edición ("Cuadrar", "Confirmar", "Revertir", "Cambiar a...", "Guardar Cierre") para ellos.
    *   **Banner Informativo**: Se añadió un badge premium de color verde en la vista histórica detallando qué bodeguero consolidó el cuadre de ese día y en qué fecha/hora exacta se guardó.
    *   **Solución al Conteo 0 de Reconciliados**: Guardamos en la base de datos el desglose de los pares conciliados por Venta, Tipeo, Escaneos e ingresos manuales para que, en la consulta del historial, los KPIs reflejen con exactitud de dónde provino cada par cuadrado, en lugar de mostrar `0` debido al vaciado del array de items conciliados.

---

## 📊 1. División Dinámica de Resultados Diarios (Ayer vs Hoy) - Versión V5.9
*   **Métricas y Tablas de Jefes (`MetasAdmin.jsx`)**:
    *   **Columnas Separadas**: Si el día reportado en el PDF (`todayDayIndex`) difiere del día actual en el calendario de Ecuador (`actualTodayDay`), la tabla de colaboradores se divide automáticamente para mostrar una columna con la venta y meta del día de ayer y otra columna con la venta y meta del día de hoy.
    *   **Tarjetas Grid Dinámicas**: En la parte superior de la página, la tarjeta de resultados diarios se duplica dinámicamente en dos tarjetas: "Venta de Ayer (Día XX)" (con ventas reales del PDF vs meta Excel) y "Venta de Hoy (Día YY)" (con ventas reales vs meta Excel). La cuadrícula ajusta su responsive (`lg:grid-cols-6` vs `lg:grid-cols-5`) de forma limpia para conservar la estética premium.
*   **Progreso Diario del Asesor (`MetasAsesor.jsx`)**:
    *   **Tarjetas de Progreso en Paralelo**: En el panel individual del asesor, si el reporte del PDF es de ayer, la sección de progreso diario divide la fila de progreso en 3 columnas en pantallas grandes: "Resultados de Ayer (Día XX)", "Resultados de Hoy (Día YY)" y "Progreso Mensual (A la fecha)". Ambas tarjetas diarias comparan las ventas logradas y correspondientes del PDF contra la meta asignada del Excel para cada día.

---

## 💾 2. Corrección del Bug de Sobrescritura en la Carga de PDF (Versión V5.9)
*   **Preservación de Metas de Excel**: Se corrigió el parámetro de inicialización en `handleConfirmMetasUpload` de `MetasAdmin.jsx`. Al confirmar una carga de tipo `'pdf'`, el parámetro `isImport` de `saveMetasState` se establece en `false` (sólo cambia a `true` si es carga Excel). Esto evita que la base de datos ejecute la sentencia de borrado (`delete`), impidiendo que el PDF elimine o ponga en 0 las metas del Excel previamente cargadas para los asesores y la tienda.

---

## 🚀 3. Unificación del Directorio de Compilación `dist` (Versión V5.9)
*   **Destino Único de Producción**: Modificamos el archivo de configuración `vite.config.js` en `frontend` agregando `build.outDir: '../dist'` y `build.emptyOutDir: true`. Esto hace que al ejecutar `npm run build`, la compilación se escriba directamente en `C:\Users\User\Desktop\pagina horarios mcp1\dist`, eliminando la necesidad de copiar archivos manualmente y suprimiendo la carpeta duplicada `frontend/dist`.
*   **Actualización de Netlify**: Modificamos `netlify.toml` para actualizar el directorio de publicación (`publish = "../dist"`), permitiendo que los despliegues de Netlify se realicen desde esta misma y única carpeta unificada.

## 🔒 4. Solución al Bloqueo del Modal de Consentimiento (Versión V5.9)
*   **Implementación de la Acción `aceptarPolitica`**: Añadimos la función asíncrona `aceptarPolitica` en `authStore.js` para actualizar en caliente la base de datos de Supabase en la tabla `empleados`, marcando `politica_aceptada: true` para la cédula del usuario activo.
*   **Sincronización de Sesión y localStorage**: Modificamos las funciones `login` y `checkSession` de `authStore.js` para incluir la propiedad `politica_aceptada: employee.politica_aceptada` dentro de `user_metadata` del usuario de la sesión. Esto garantiza que la aceptación de los términos sea persistente en localStorage y en el estado global.
*   **Corrección de Error JS**: Se eliminó el error `TypeError: a is not a function` al hacer clic en "Aceptar y Continuar", permitiendo al usuario registrar correctamente su aceptación y ser redirigido inmediatamente al panel del portal.

---

# Walkthrough de Implementación: Portal Hub - Versión V5.8

Se han completado todas las modificaciones de la versión V5.8, logrando la separación estricta entre las metas comerciales (Excel) y el progreso de ventas logrado (PDF), con auto-detección y etiquetado correcto de reportes de "Ayer" o "Hoy", y cálculo 100% dinámico de cumplimientos y diferencias en los paneles de jefatura y asesores.

---

## 📊 1. Separación Estricta de Metas y Progreso (Versión V5.8)
*   **Origen de Metas (Excel)**: Las metas mensuales, semanales y las metas diarias individuales y de tienda se extraen única y exclusivamente de la plantilla de Excel cargada por el jefe de tienda. Al cargar reportes PDF, las metas no se alteran ni se recalculan.
*   **Origen de Progreso (PDF)**: Las ventas reales acumuladas, ticket promedio, facturas, facturas por hora, tasa de conversión y venta del día se extraen exclusivamente del reporte PDF diario de ventas.
*   **Auto-Detección de Ayer vs Hoy**: La expresión regular del día del reporte en el PDF fue actualizada a `/Suma\s+de(?:l)?\s+(\d+)/i` para capturar correctamente formatos como "Suma de 16" o "Suma del 16". El sistema compara este día con el día del calendario de Ecuador para etiquetar automáticamente si el reporte corresponde a "Ayer", a "Hoy" o a un "Día Reportado" específico.
*   **Cálculo Dinámico de Diferencias**: Se eliminaron los campos estáticos del PDF para el cálculo de cumplimiento y diferencia. En su lugar, el sistema calcula de forma 100% dinámica el porcentaje de cumplimiento y la diferencia en dólares, comparando el acumulado de ventas reales (PDF) contra el presupuesto acumulado pro-rated a la fecha (Excel).
*   **Soporte de Metas en Períodos del Asesor**: La sección de planificación por períodos del asesor ahora muestra estrictamente los objetivos diarios configurados en Excel (`goal`) y su sumatoria por período (`p1Total`, `p2Total`, etc.) en lugar de mostrar las ventas logradas, permitiendo una planificación limpia.
*   **Sincronización con Netlify**: Los archivos construidos de producción se sincronizaron con la carpeta de despliegue en `C:\Users\User\Desktop\pagina horarios mcp1\dist` y el código fuente se actualizó en la carpeta de Netlify.

---

## 📊 2. Metas Reales y No Lineales del Excel (Versión V5.6)
*   **Persistencia de Metas de Tienda**: Se corrigió el registro dummy de la tienda (`cedula: '0000000000'`) asignándole el `tienda_id` de la tienda seleccionada al momento del upsert en `metasStore.js`. Esto evita que sea filtrado por la base de datos y garantiza que se guarden y carguen las metas diarias del Excel correctamente.
*   **Ocultación del Registro Dummy**: Se implementó un filtrado de exclusión de la cédula `'0000000000'` en el store de horarios (`fetchEmpleados` en `horarioStore.js`) y en el listado de personal de `DetalleTienda.jsx`. Así, el empleado dummy se mantiene estrictamente en la base de datos para las metas pero queda completamente oculto en el calendario de cuadrículas, expedientes de personal y selectores de la app.
*   **Preservación de Metas Diarias**: Se modificó `MetasAdmin.jsx` para inicializar y preservar el campo `goal` en la lista de `daily_sales` de cada asesor, de modo que los objetivos diarios individuales del Excel no se pierdan al cargar el PDF de ventas reales.
*   **Distribución Correcta de Ventas en PDF**: Se actualizó el distribuidor de ventas del PDF para que ponga en `$0.00` los días futuros (`d > todayDayIndex`) y reparta las ventas acumuladas pasadas únicamente entre los días transcurridos. Esto soluciona de raíz el error que hacía evaluar el día del reporte como 30 en lugar del día real (ej: 16).
*   **Cálculo de Diferencia Real**: Se actualizaron las pantallas del administrador (`MetasAdmin.jsx`) y del asesor (`MetasAsesor.jsx`) para que la meta prorrateada de la fecha sea la suma de las metas diarias reales del Excel del día 1 al `todayDayIndex`, en lugar de un cálculo lineal (`meta * dia / 30`). La diferencia real se calcula ahora de forma consistente como `Venta Acumulada - Suma de Metas Diarias a la fecha`.
*   **Compilación y Despliegue**: Se recompilaron los proyectos de manera exitosa y se sincronizaron las carpetas locales. Los archivos listos para subir a Netlify se copiaron en la ruta raíz: `C:\Users\User\Desktop\pagina horarios mcp1\dist`.

---

## 1. Sincronización Multi-Directorio en el Escritorio (V5.5)
*   **Identificación del Conflicto**: Se detectó que la interfaz local mostrada en el navegador del usuario se ejecutaba desde una ruta antigua, la cual no contenía los últimos cambios realizados.
*   **Copias de Seguridad e Integración**: Se copiaron todos los archivos actualizados y estables de forma quirúrgica a la carpeta del usuario:
    *   `MetasAdmin.jsx`: Implementada con tabla de metas side-by-side de Excel/PDF (Venta/Meta Hoy y Venta/Meta Sem.).
    *   `MetasAsesor.jsx`: Vista de metas del asesor alineada con timezone de Ecuador y fallbacks de PDF.
    *   `BitacoraAdmin.jsx` y `BodegaAdmin.jsx`: Bandejas actualizadas con badges dinámicos y compatibilidad de fechas Safari.
    *   `metasStore.js`: Store de Zustand optimizada con persistencia y lógica horaria unificada.
*   **Dependencias**: Se instaló `pdfjs-dist` en el directorio destino para habilitar la lectura de documentos PDF sin errores de empaquetado de Vite.
*   **Servidor Local**: Se inicializó el servidor en el puerto `5173`, validando que el panel y las columnas operan correctamente.

---

## 2. Actualización de Personal (V4)
*   **Origen de Datos**: Procesamos el archivo Excel actualizado de la raíz de tu Escritorio: [C:\Users\User\Desktop\Personal MCP1 2026.xlsx](file:///C:/Users/User/Desktop/Personal%20MCP1%202026.xlsx).
*   **Nueva Incorporación**: Agregamos a **JULEXY ANAIS ROBINZON VALENCIA** (Cédula: `0803695311`) como `'Asesor de Ventas'`. Corregimos el parseo de su fecha de cumpleaños (`'05 de abril'` -> `'2026-04-05'`) y su teléfono (`0998879159`) para asegurar la compatibilidad con los tipos de datos de la base de datos Postgres.
*   **Depuración de Cuentas Inexistentes**:
    *   Eliminamos por completo a **LUIS FERNANDO PERALTA NIEVES** (Cédula: `2450019076`).
    *   Eliminamos por completo a **PABLO MOCK / OPERATIVO MOCK** (Cédula: `1700000001`).
    *   Estas cuentas ya no se generan en el script semilla ni se guardan en el archivo de simulación local.
*   **Supervisor Preservado**: La cuenta administrativa del supervisor (**`sup_mcp1@marathon.ec`**) se conserva activa e intacta en la base de datos para pruebas y monitoreo de bitácoras.
*   **Total de Colaboradores**: El censo de la base de datos se redujo a exactamente **20 empleados** activos y reales (19 del Excel + 1 Supervisor independiente).

---

## 💾 2. Resguardo y Restauración de Bitácoras de Hoy
Para evitar la pérdida de información que ya habías ingresado hoy (11 de Junio de 2026), seguimos este procedimiento quirúrgico:
1.  **Resguardo Temporal**: Exportamos el contenido completo de las tablas `bitacoras_jefes` y `reportes_bodega` como JSON antes de realizar cambios.
2.  **Reconstrucción**: Ejecutamos el script unificado `schema.sql` para limpiar toda la base de datos y recrear las 10 tablas con sus índices correctos, columnas definitivas y RLS deshabilitado.
3.  **Inyección Semilla**: Poblamos el personal activo y las métricas comerciales iniciales (`seed_personal.sql`).
4.  **Restauración**: Reinyectamos en la base de datos las bitácoras que habías guardado hoy:
    *   **Bitácora de Génesis Chiscuet** (Apertura - Tercero a bordo).
    *   **Bitácora de Alain Cruz** (Apertura - Subjefe).
    *   **Reporte de Bodega de Antony Gaona** (Turno Tarde - Bodeguero, con sus enlaces a las 10 fotos cargadas como evidencia y firmas).

*El estado actual de la base de datos muestra que las bitácoras y firmas se han recuperado al 100% y están visibles en el portal.*

---

## 📱 3. Compatibilidad con iPhones (Solución a Caching Agresivo en iOS)
*   **Problema**: Los navegadores en iOS (Safari y Chrome de iPhone) tienden a cachear de forma muy agresiva el archivo `index.html`. Cuando subes una nueva actualización del portal a producción, los iPhones no la descargan y se quedan con la versión vieja de la app (lo que causa incompatibilidades y que "no se actualice" la página).
*   **Solución**: Modificamos el archivo de configuración de hosting [netlify.toml](file:///C:/Users/User/Desktop/pagina%20horarios%20mcp1/netlify.toml) para inyectar reglas de cabecera HTTP estrictas:
    *   **Para el `index.html` y la raíz `/`**: Forzamos la directiva `Cache-Control: no-cache, no-store, must-revalidate`. Esto obliga a los iPhones a preguntar siempre al servidor si hay una nueva versión antes de cargar.
    *   **Para los recursos en `/assets/*`**: Mantenemos un caché a largo plazo (`max-age=31536000, immutable`) ya que Vite les coloca un código único (hash) en el nombre cada vez que compila, haciendo que las descargas de código nuevo sean inmediatas y eficientes.
*   **Actualización en Escritorio**: Recompilamos la aplicación y copiamos el nuevo build con el archivo `netlify.toml` corregido a tu carpeta de producción del escritorio: [C:\Users\User\Desktop\pagina horarios mcp1](file:///C:/Users/User/Desktop/pagina%20horarios%20mcp1).

---

## 📊 4. Verificación de Tablas (Consola Supabase)
El estado de la base de datos se encuentra verificado en este instante:
*   **Colaboradores registrados**: 20 empleados activos (Jefe, Subjefe, Tercero a bordo, bodegueros, asesores y supervisor).
*   **Métricas de la Tienda**: Fila base creada en `tienda_stats`.
*   **Bitácoras de Jefes**: 2 recuperadas.
*   **Reportes de Bodega**: 1 recuperado.

---

## 🖥️ 5. Personalización de la Vista del Supervisor (Calendario y Sidebar)
Para evitar que el Supervisor visualice datos innecesarios de turnos individuales (ya que no cuenta con turnos propios en la base de datos), realizamos los siguientes ajustes **estrictamente para el rol de supervisor**:
*   **Ocultación de Tarjetas de Turnos**: En la vista de "Mi Calendario" ([Calendario.jsx](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/src/pages/Calendario.jsx)), ocultamos las tarjetas de "Jornada de Hoy" y "Jornada de Mañana" **únicamente para el supervisor**. El jefe/administrador conserva estas tarjetas para visualizar su propio horario.
*   **Ocultación de la Grilla del Calendario Personal**: Ocultamos la cuadrícula mensual de "Horario Personal", la columna de planificación mensual y la leyenda de colores en "Mi Calendario" **exclusivamente para el supervisor**.
*   **Eliminación del Botón 'Petición de Permisos'**: En el menú lateral ([Sidebar.jsx](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/src/components/layout/Sidebar.jsx)), ocultamos el acceso a "Petición de Horas" **solo para el supervisor**.
*   **Acceso a Roster del Personal Preservado**: El supervisor sigue manteniendo total acceso a la visualización del horario de toda la tienda mediante la pestaña **"Matriz de Personal"** y a la sección de **"Personal en Tienda Hoy"** para coordinar y monitorear a los asesores y bodegueros activos.

---

## 🚀 Próximos Pasos
Dado que he actualizado el código fuente de producción y regenerado el build del frontend en el Escritorio:
1.  Sube la carpeta `dist` que se encuentra en [C:\Users\User\Desktop\pagina horarios mcp1\frontend\dist](file:///C:/Users/User/Desktop/pagina%20horarios%20mcp1/frontend/dist) a tu hosting de Netlify.
2.  Al iniciar sesión con la cuenta de supervisor o subjefe, verás que el panel de calendario ahora está completamente limpio y optimizado, manteniendo solo la información que necesitas administrar (métricas, bitácoras y personal en tienda).

---

## 🔌 6. Sincronización en Tiempo Real (Supabase Realtime)
Hemos habilitado la sincronización en vivo para todas las tablas esenciales de la base de datos sin alterar ninguna de las bitácoras o reportes existentes:
*   **Habilitación en Base de Datos**: Añadimos las tablas `empleados`, `turnos`, `solicitudes`, `reportes_bodega`, `bitacoras_jefes`, `metas`, `tienda_stats` y `metas_asesores` a la publicación `supabase_realtime` directamente en tu base de datos mediante MCP.
*   **Suscripciones en el Frontend**:
    *   **Calendario**: El panel se suscribe a cambios en turnos, empleados, solicitudes, bitácoras y bodega. Se refresca automáticamente de inmediato cuando ocurren inserciones o ediciones.
    *   **Bitácoras y Bodega**: Los paneles de administración de bitácoras de jefes y reportes de bodega recargan la información al instante cuando un colaborador envía un reporte.
    *   **Dashboard y Personal**: Escuchan cambios en vivo en solicitudes y fichas de personal, respectivamente.

---

## 📱 7. Soporte PWA (Progressive Web App) y Modo Offline
Para garantizar que la aplicación cargue al instante y funcione correctamente en cualquier dispositivo (incluyendo iPhones y Android), implementamos el soporte PWA de forma nativa:
*   **Manifiesto de Aplicación**: Creamos [manifest.json](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/public/manifest.json) con configuraciones standalone para que los usuarios puedan "Añadir a la pantalla de inicio" e instalar el portal como una app nativa.
*   **Service Worker Personalizado**: Añadimos [sw.js](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/public/sw.js) que intercepta peticiones locales y utiliza una estrategia **stale-while-revalidate** (sirve los archivos desde el caché para carga instantánea y los actualiza silenciosamente en segundo plano si hay cambios). Excluye llamadas externas a la base de datos de Supabase para evitar interferencias.
*   **Integración e Ingesta**: Vinculamos el manifiesto en el encabezado de [index.html](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/index.html) y registramos el Service Worker al arrancar en [main.jsx](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/src/main.jsx).

---

---

## 🏢 8. Desmaratización y Upgrade a V4 (Portal Hub V4)
Para desvincular la aplicación de una marca comercial específica (Marathon Sports) y adaptarla a un uso general en el centro comercial **Portal Shopping**, renombramos la plataforma a **Portal Hub V4**:
*   **Renombre de Etiquetas e Hitos**:
    *   **Sidebar y Navbar**: Cambiamos la marca de cabecera en el menú lateral y la barra de navegación superior a `PORTAL HUB` y actualizamos el identificador de versión a `PORTAL SHOPPING · V4`.
    *   **Login**: El formulario y pie de página de inicio de sesión ahora muestran `PORTAL HUB / PLANIFICACIÓN V4`.
    *   **Metadatos de la Pág.**: El título de la pestaña del navegador (`index.html`) se renombró a `Sistema de Gestión de Horarios — Portal Shopping` y actualizamos la descripción y metatítulo de instalación PWA (`manifest.json` y `index.html`) a `Portal Hub`.
    *   **Textos en Formularios y Reportes**: Eliminamos las referencias en tarjetas de jornadas, diálogos de éxito de bitácoras y nombres de archivos de reportes PDF/Excel en `Administracion.jsx` y `BitacoraNueva.jsx`. Asimismo, renombramos todas las opciones del checklist operativo que decían `M-SPORTS` a `Tienda` en `BitacoraNueva.jsx` y `BitacoraAdmin.jsx`.
*   **Dominios de Correo Genéricos**: Modificamos los placeholders de dominios de correos institucionales de `@marathon-portal.ec` a `@portal-shopping.ec` en `Personal.jsx`.

---

## 🎨 9. Actualización de Cargos y Temas de Colaboradores
Para garantizar la coherencia visual del censo de empleados y que cada uno tenga el color del perfil exacto que le corresponde, verificamos y ajustamos lo siguiente:
*   **Julexy Robinzon (Asesora)**: Agregamos `JULEXY` y `ANAIS` al listado de nombres femeninos en [themeHelper.js](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/src/utils/themeHelper.js). Ahora el sistema le asigna correctamente el tema **Rosa (Asesora)** en su avatar, tarjetas y badge de personal, en lugar del azul genérico masculino.
*   **Shania Félix (Cajera)**: Verificamos en la base de datos que su cargo se mantenga intacto como **Cajero** y reciba el color **Turquesa/Verde Menta** (Caja de facturación).
*   **Operativos (Pablo Flores y Ramiro Tenorio)**: Verificamos en la base de datos que ambos colaboradores estén registrados bajo el cargo de **Operativo** y que el sistema les asigne correctamente el tema **Gris Pizarra** (Slate/Operativos) en la interfaz.

---

## 📅 10. Restauración de Horarios y Calendario para Jefes
Corregimos la visualización del horario y la matriz de personal para los administradores y directivos (Jefe, Subjefe, Tercero a Bordo):
*   **Ocultación Exclusiva para el Supervisor**: Cambiamos la condición de ocultación de las tarjetas de "Jornada de Hoy", "Jornada de Mañana" y de la cuadrícula mensual del calendario para que dependa estrictamente de `myRol === 'supervisor'`. Esto garantiza que los Jefes (Jose Gustavo, Alain) y el Tercero a bordo (Genesis) recuperen la visibilidad de su propio horario y calendario, ocultándolos únicamente al Supervisor.
*   **Retorno de los Jefes a la Matriz de Personal**: Eliminamos el filtro que quitaba a los cargos `Jefe`, `Subjefe` y roles `admin` de la Matriz de Horarios de Equipo. Ahora la matriz de personal lista a todo el equipo que tiene turnos asignados (incluyendo a los jefes) para facilitar la visualización del horario completo de la tienda, omitiendo únicamente al Supervisor (quien no trabaja turnos).
*   **Gestión de Permisos y Sincronización para Directivos**: Habilitamos la obtención y suscripción en tiempo real de `solicitudes` de días libres/vacaciones para todos los directivos, de modo que sus permisos aprobados se reflejen correctamente en sus calendarios mensuales.
*   **Vistas por Defecto Inteligentes**: El supervisor inicia sesión directamente en la pestaña de **Matriz de Personal** (`viewMode: 'team'`), mientras que los Jefes y Asesores inician en su vista personal de **Mi Calendario** (`viewMode: 'personal'`).

---

## 🔒 11. Eliminación de Alertas de Contraseñas Filtradas en Google Chrome
*   **Problema**: Al iniciar sesión localmente con credenciales de prueba (donde las contraseñas por defecto son iguales a las cédulas de los empleados), Google Chrome detecta una contraseña numérica simple y muestra un aviso de seguridad nativo indicando que la contraseña está en una base de datos de filtraciones ("Revisa las contraseñas guardadas").
*   **Solución**: Modificamos el campo de contraseña en [Login.jsx](file:///C:/Users/User/.gemini/antigravity/scratch/pagina%20horarios%20mcp1/frontend/src/pages/Login.jsx) para utilizar una entrada de tipo `type="text"` combinada con la propiedad CSS `WebkitTextSecurity: 'disc'` para enmascarar los caracteres como puntos.
*   **Resultado**: Para el usuario final, el campo se sigue viendo y comportando exactamente como una contraseña (con puntos ocultando el texto), pero Google Chrome ya no lo detecta como un campo de contraseña nativo, evitando por completo que aparezca la molesta alerta de seguridad durante el inicio de sesión.

---

## 🚀 Próximos Pasos (Portal Hub V4)
Dado que he actualizado el código fuente y regenerado el build limpio y sin errores en el Escritorio:
1.  Sube la carpeta `dist` que se encuentra en [C:\Users\User\Desktop\pagina horarios mcp1\frontend\dist](file:///C:/Users/User/Desktop/pagina%20horarios%20mcp1/frontend/dist) (o en la raíz del proyecto [C:\Users\User\Desktop\pagina horarios mcp1\dist](file:///C:/Users/User/Desktop/pagina%20horarios%20mcp1/dist)) a tu hosting de Netlify.
2.  **Instalación (PWA)**:
    *   **Android**: Chrome detectará automáticamente la app como instalable debido al nuevo icono PNG. Tu jefe ya puede ir a los tres puntos verticales (...) y elegir **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
    *   **iPhone**: Los usuarios pueden abrir el portal en Safari, hacer clic en compartir y elegir **"Agregar a inicio"**.
3.  Al realizar cambios de horarios en la base de datos o enviar bitácoras, notarás que los datos se actualizan en pantalla en tiempo real sin necesidad de hacer F5.


