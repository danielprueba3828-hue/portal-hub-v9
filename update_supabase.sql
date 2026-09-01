-- =========================================================================
-- SCRIPT DE ACTUALIZACIÓN PARA BBDD REAL DE SUPABASE
-- =========================================================================
-- Ejecuta este script en el SQL Editor de tu consola de Supabase para
-- habilitar las columnas correspondientes al checklist administrativo
-- y operativo de la Bitácora de Jefes.
-- =========================================================================

-- Columnas Generales Adicionales
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS cargo_anterior varchar(50);
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS zona varchar(50);
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS zonas_semanales jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.empleados ALTER COLUMN email DROP NOT NULL;

-- Optimización y ampliación de columnas en turnos
ALTER TABLE public.turnos ALTER COLUMN tipo_turno TYPE varchar(50);
ALTER TABLE public.turnos ALTER COLUMN creado_por TYPE varchar(50);
ALTER TABLE public.turnos DROP CONSTRAINT IF EXISTS turnos_tipo_turno_check;
ALTER TABLE public.reportes_bodega ADD COLUMN IF NOT EXISTS comentarios_jefes jsonb default '[]'::jsonb;
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS colaborador varchar(150);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS cargo varchar(50);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS cumplimiento_meta numeric(10,2);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS autorizaciones_cc varchar(20) default 'No aplica';
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS reviso_horario varchar(10) default 'No';
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS evidencias jsonb default '[]'::jsonb;
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS checklist_data jsonb default '{}'::jsonb;

-- Hacer que las columnas legacy de bitacoras_jefes sean opcionales (nullable) ya que no son enviadas por la interfaz
ALTER TABLE public.bitacoras_jefes ALTER COLUMN cedula_jefe DROP NOT NULL;
ALTER TABLE public.bitacoras_jefes ALTER COLUMN nombre_jefe DROP NOT NULL;
ALTER TABLE public.bitacoras_jefes ALTER COLUMN turno DROP NOT NULL;

-- Columnas del Checklist Administrativo (adm_...)
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_induccion_personal varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_autorizacion_horas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_baja_personal varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_solicitud_pop varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_solicitud_rollos varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_solicitud_paco varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_solicitud_fundas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_metas_mensuales varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_horarios_mes varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_solicitud_cc varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_retroalimentacion varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_recepcion_web varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_pedido_codigos varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_instalaciones varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_solicitud_uniformes varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_visitas_tienda varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS adm_limpieza_industrial varchar(5);

-- Columnas del Checklist Operativo (op_...)
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_categorizacion_pared varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_pvp_calzado varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_verif_pvp_ropa varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_verif_pvp_accesorios varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_exhib_accesorios varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_exhib_ropa varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_exhib_zapatos varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_paredes_ropa_marcas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_paredes_ropa_marathon varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_paredes_accesorios varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_muebles_ropa_marcas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_muebles_ropa_marathon varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_muebles_accesorios varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_cambio_mesas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_maniquies_marathon varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_maniquies_marcas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_limp_muebles_marathon varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_limp_muebles_marcas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_limp_bases_marathon varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_limp_bases_marcas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_limp_micas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_tallar_muebles_marathon varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_tallar_muebles_zonas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_tallar_paredes_marathon varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_tallar_paredes_marcas varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_liquidacion_mercaderia varchar(5);
ALTER TABLE public.bitacoras_jefes ADD COLUMN IF NOT EXISTS op_tags_promocion varchar(5);

-- =========================================================================
-- DESHABILITAR ROW LEVEL SECURITY (RLS) PARA EVITAR VIOLACIONES DE POLÍTICA EN MODO ANÓNIMO
-- =========================================================================
-- Debido a que la aplicación utiliza una sesión personalizada en localStorage y
-- no realiza un inicio de sesión nativo en Supabase Auth, todas las consultas
-- desde el cliente frontend se ejecutan bajo el rol 'anon' (anónimo).
-- Para permitir que la aplicación funcione correctamente en producción,
-- deshabilitamos RLS en las tablas del portal.

ALTER TABLE public.empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_bodega DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_diarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacoras_jefes DISABLE ROW LEVEL SECURITY;

-- Limpieza de políticas antiguas
DROP POLICY IF EXISTS "Empleados leen sus propios datos" ON public.empleados;
DROP POLICY IF EXISTS "Admin y Superv leen todos los empleados" ON public.empleados;
DROP POLICY IF EXISTS "Solo admin edita empleados" ON public.empleados;
DROP POLICY IF EXISTS "empleado lee sus datos" ON public.empleados;
DROP POLICY IF EXISTS "jefe lee todos empleados" ON public.empleados;
DROP POLICY IF EXISTS "admin edita empleados" ON public.empleados;

DROP POLICY IF EXISTS "Cualquier empleado lee turnos" ON public.turnos;
DROP POLICY IF EXISTS "Admin y Superv editan turnos" ON public.turnos;
DROP POLICY IF EXISTS "autenticados leen turnos" ON public.turnos;
DROP POLICY IF EXISTS "jefes editan turnos" ON public.turnos;

DROP POLICY IF EXISTS "Empleados gestionan sus propias solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "Admin y Superv gestionan todas las solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "empleado gestiona sus solicitudes" ON public.solicitudes;
DROP POLICY IF EXISTS "jefes gestionan todas solicitudes" ON public.solicitudes;

DROP POLICY IF EXISTS "Cualquier empleado inserta reportes_bodega" ON public.reportes_bodega;
DROP POLICY IF EXISTS "Jefes y Tercer a bordo leen reportes_bodega" ON public.reportes_bodega;
DROP POLICY IF EXISTS "autenticados insertan bodega" ON public.reportes_bodega;
DROP POLICY IF EXISTS "jefes leen bodega" ON public.reportes_bodega;

DROP POLICY IF EXISTS "Empleados autenticados leen ventas_diarias" ON public.ventas_diarias;
DROP POLICY IF EXISTS "Jefes gestionan ventas_diarias" ON public.ventas_diarias;
DROP POLICY IF EXISTS "autenticados leen ventas" ON public.ventas_diarias;
DROP POLICY IF EXISTS "jefes gestionan ventas" ON public.ventas_diarias;

DROP POLICY IF EXISTS "Jefes y Tercer a Bordo gestionan bitacoras_jefes" ON public.bitacoras_jefes;
DROP POLICY IF EXISTS "jefes gestionan bitacoras" ON public.bitacoras_jefes;

-- =========================================================================
-- TABLA K: notificaciones (Para notificaciones internas de cambios de horario/metas)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_cedula varchar(10) NOT NULL REFERENCES public.empleados(cedula) ON DELETE CASCADE,
    titulo varchar(150) NOT NULL,
    mensaje text NOT NULL,
    leido boolean NOT NULL DEFAULT false,
    tipo varchar(20) DEFAULT 'general',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.notificaciones DISABLE ROW LEVEL SECURITY;
