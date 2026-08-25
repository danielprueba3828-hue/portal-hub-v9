-- =========================================================================
-- ESQUEMA DE BASE DE DATOS UNIFICADO Y LIMPIO — MARATHON SPORTS MCP1
-- Ejecuta este script completo en el SQL Editor de tu consola de Supabase.
-- =========================================================================

-- 1. LIMPIEZA DE TABLAS VIEJAS (Evita conflictos al reconstruir desde cero)
DROP TABLE IF EXISTS public.tienda_stats CASCADE;
DROP TABLE IF EXISTS public.metas CASCADE;
DROP TABLE IF EXISTS public.ventas_diarias CASCADE;
DROP TABLE IF EXISTS public.bitacoras_jefes CASCADE;
DROP TABLE IF EXISTS public.reportes_bodega CASCADE;
DROP TABLE IF EXISTS public.log_auditoria CASCADE;
DROP TABLE IF EXISTS public.log_accesos CASCADE;
DROP TABLE IF EXISTS public.solicitudes CASCADE;
DROP TABLE IF EXISTS public.turnos CASCADE;
DROP TABLE IF EXISTS public.empleados CASCADE;

-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 2. CREACIÓN DE TABLAS
-- =========================================================================

-- TABLA A: empleados
CREATE TABLE public.empleados (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula varchar(10) NOT NULL UNIQUE,
    nombres varchar(100) NOT NULL,
    apellidos varchar(100) NOT NULL,
    email varchar(150) NOT NULL UNIQUE,
    telefono varchar(15),
    telefono_urgencia varchar(15),
    cumpleanos date,
    cargo varchar(50) DEFAULT 'Asesor de Ventas',
    cargo_anterior varchar(50),
    zona varchar(50),
    fecha_ingreso date NOT NULL DEFAULT current_date,
    rol varchar(20) NOT NULL DEFAULT 'empleado' 
        CHECK (rol IN ('empleado', 'supervisor', 'admin', 'tercer_a_bordo')),
    activo boolean NOT NULL DEFAULT true,
    debe_cambiar_password boolean NOT NULL DEFAULT true,
    intentos_fallidos integer NOT NULL DEFAULT 0,
    bloqueado boolean NOT NULL DEFAULT false,
    password_hash varchar(255) NOT NULL, -- Cédula o hash personalizado
    genero varchar(10) DEFAULT 'Hombre' CHECK (genero IN ('Hombre', 'Mujer'))
);

CREATE INDEX idx_empleados_cedula ON public.empleados(cedula);
CREATE INDEX idx_empleados_email ON public.empleados(email);


-- TABLA B: turnos
CREATE TABLE public.turnos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_cedula varchar(10) NOT NULL REFERENCES public.empleados(cedula) ON DELETE CASCADE,
    fecha date NOT NULL,
    tipo_turno varchar(20) NOT NULL DEFAULT 'Descanso' 
        CHECK (tipo_turno IN ('Mañana', 'Tarde', 'Descanso', 'Feriado/Novedad')),
    hora_inicio varchar(5) NOT NULL DEFAULT '00:00',
    hora_fin varchar(5) NOT NULL DEFAULT '00:00',
    creado_por varchar(10) NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(empleado_cedula, fecha)
);

CREATE INDEX idx_turnos_empleado_fecha ON public.turnos(empleado_cedula, fecha);


-- TABLA C: solicitudes
CREATE TABLE public.solicitudes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_cedula varchar(10) NOT NULL REFERENCES public.empleados(cedula) ON DELETE CASCADE,
    tipo varchar(20) NOT NULL CHECK (tipo IN ('Día Libre', 'Vacaciones', 'Compensación')),
    duracion_tipo varchar(10) NOT NULL DEFAULT 'Días' CHECK (duracion_tipo IN ('Días', 'Horas')),
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    hora_inicio varchar(5) NOT NULL DEFAULT '00:00',
    hora_fin varchar(5) NOT NULL DEFAULT '00:00',
    motivo text NOT NULL,
    estado varchar(20) NOT NULL DEFAULT 'Pendiente' 
        CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
    comentario_admin text,
    fecha_solicitud timestamp with time zone DEFAULT timezone('utc'::text, now()),
    procesado_por varchar(10),
    fecha_procesado timestamp with time zone
);

CREATE INDEX idx_solicitudes_empleado ON public.solicitudes(empleado_cedula);


-- TABLA D: log_accesos
CREATE TABLE public.log_accesos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula varchar(10) NOT NULL,
    resultado varchar(50) NOT NULL,
    fecha_hora timestamp with time zone DEFAULT timezone('utc'::text, now())
);


-- TABLA E: log_auditoria
CREATE TABLE public.log_auditoria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_cedula varchar(10) NOT NULL,
    accion varchar(100) NOT NULL,
    detalles text NOT NULL,
    fecha_hora timestamp with time zone DEFAULT timezone('utc'::text, now())
);


-- TABLA F: reportes_bodega
CREATE TABLE public.reportes_bodega (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha date NOT NULL,
    colaborador varchar(150) NOT NULL,
    turno varchar(20) NOT NULL,
    actividades text NOT NULL,
    guias_realizadas varchar(10) NOT NULL,
    guias_descripcion text,
    video_confirmado varchar(10) NOT NULL DEFAULT 'No',
    novedades text,
    pendientes text,
    ev_operativa jsonb DEFAULT '[]'::jsonb,
    ev_jigsaw_filezilla jsonb DEFAULT '[]'::jsonb,
    comentarios_jefes jsonb DEFAULT '[]'::jsonb, -- Almacena check-ins e historial de firmas
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


-- TABLA G: ventas_diarias
CREATE TABLE public.ventas_diarias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula varchar(10) NOT NULL REFERENCES public.empleados(cedula) ON DELETE CASCADE,
    dia integer NOT NULL CHECK (dia >= 1 AND dia <= 31),
    monto numeric(10,2) NOT NULL DEFAULT 0.00,
    mes integer NOT NULL DEFAULT extract(month from current_date),
    anio integer NOT NULL DEFAULT extract(year from current_date),
    registrado_por varchar(10),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(cedula, dia, mes, anio)
);

CREATE INDEX idx_ventas_diarias_cedula ON public.ventas_diarias(cedula);
CREATE INDEX idx_ventas_diarias_dia ON public.ventas_diarias(dia, mes, anio);


-- TABLA H: metas (Presupuesto individual de ventas por asesor)
CREATE TABLE public.metas (
    cedula varchar(10) PRIMARY KEY REFERENCES public.empleados(cedula) ON DELETE CASCADE,
    nombres varchar(100),
    apellidos varchar(100),
    meta_mensual numeric(10,2) DEFAULT 0.00,
    meta_semanal numeric(10,2) DEFAULT 0.00,
    meta_diaria numeric(10,2) DEFAULT 0.00,
    acum_ventas numeric(10,2) DEFAULT 0.00,
    pct integer DEFAULT 0,
    comentario text,
    daily_sales jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


-- TABLA I: tienda_stats (Métricas comerciales globales de la tienda)
CREATE TABLE public.tienda_stats (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    ticket_promedio numeric(10,2) DEFAULT 112.82,
    facturas integer DEFAULT 1528,
    conversion numeric(10,2) DEFAULT 72.47,
    meta_diaria_tienda numeric(10,2) DEFAULT 3800.00,
    meta_semanal_tienda numeric(10,2) DEFAULT 0.00,
    total_venta_lograda numeric(10,2) DEFAULT 0.00,
    venta_tienda numeric(10,2) DEFAULT 0.00,
    trafico numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


-- TABLA J: bitacoras_jefes (Bitácora de apertura/cierre de tienda)
CREATE TABLE public.bitacoras_jefes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha date NOT NULL,
    cedula_jefe varchar(10),
    nombre_jefe varchar(150),
    turno varchar(20),
    apertura_cierre varchar(20) DEFAULT 'Apertura',
    meta_dia numeric(10,2) DEFAULT 0,
    venta_dia numeric(10,2) DEFAULT 0,
    cumplimiento varchar(10) DEFAULT '0%',
    novedades text,
    pendientes text,
    colaborador varchar(150),
    cargo varchar(50),
    cumplimiento_meta numeric(10,2),
    autorizaciones_cc varchar(20) DEFAULT 'No aplica',
    reviso_horario varchar(10) DEFAULT 'No',
    observaciones text,
    evidencias jsonb DEFAULT '[]'::jsonb,
    checklist_data jsonb DEFAULT '{}'::jsonb,
    observaciones_supervisor jsonb DEFAULT '[]'::jsonb, -- Firmas y comentarios de supervisores/jefes
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    
    -- Checklist Administrativo (adm_...)
    adm_induccion_personal varchar(5),
    adm_autorizacion_horas varchar(5),
    adm_baja_personal varchar(5),
    adm_solicitud_pop varchar(5),
    adm_solicitud_rollos varchar(5),
    adm_solicitud_paco varchar(5),
    adm_solicitud_fundas varchar(5),
    adm_metas_mensuales varchar(5),
    adm_horarios_mes varchar(5),
    adm_solicitud_cc varchar(5),
    adm_retroalimentacion varchar(5),
    adm_recepcion_web varchar(5),
    adm_pedido_codigos varchar(5),
    adm_instalaciones varchar(5),
    adm_solicitud_uniformes varchar(5),
    adm_visitas_tienda varchar(5),
    adm_limpieza_industrial varchar(5),
    
    -- Checklist Operativo (op_...)
    op_categorizacion_pared varchar(5),
    op_cambio_pvp_calzado varchar(5),
    op_verif_pvp_ropa varchar(5),
    op_verif_pvp_accesorios varchar(5),
    op_exhib_accesorios varchar(5),
    op_exhib_ropa varchar(5),
    op_exhib_zapatos varchar(5),
    op_cambio_paredes_ropa_marcas varchar(5),
    op_cambio_paredes_ropa_marathon varchar(5),
    op_cambio_paredes_accesorios varchar(5),
    op_cambio_muebles_ropa_marcas varchar(5),
    op_cambio_muebles_ropa_marathon varchar(5),
    op_cambio_muebles_accesorios varchar(5),
    op_cambio_mesas varchar(5),
    op_maniquies_marathon varchar(5),
    op_maniquies_marcas varchar(5),
    op_limp_muebles_marathon varchar(5),
    op_limp_muebles_marcas varchar(5),
    op_limp_bases_marathon varchar(5),
    op_limp_bases_marcas varchar(5),
    op_limp_micas varchar(5),
    op_tallar_muebles_marathon varchar(5),
    op_tallar_muebles_zonas varchar(5),
    op_tallar_paredes_marathon varchar(5),
    op_tallar_paredes_marcas varchar(5),
    op_liquidacion_mercaderia varchar(5),
    op_tags_promocion varchar(5)
);

-- =========================================================================
-- 3. CONFIGURACIÓN DE SEGURIDAD (Deshabilitación de RLS)
-- =========================================================================
-- Debido a que la aplicación utiliza una sesión personalizada en localStorage y
-- realiza consultas directas bajo el rol 'anon' (anónimo), Row Level Security (RLS)
-- se mantiene deshabilitado para evitar conflictos de políticas de seguridad.

ALTER TABLE public.empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_accesos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_auditoria DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_bodega DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_diarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tienda_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacoras_jefes DISABLE ROW LEVEL SECURITY;
