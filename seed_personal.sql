-- =========================================================================
-- SCRIPT DE INYECCIÓN Y ACTUALIZACIÓN DE PERSONAL (MCP1 2026)
-- Ejecuta esto en el SQL Editor de tu consola de Supabase.
-- =========================================================================

-- 1. DATOS SEMILLA PARA TIENDA (tienda_stats)
INSERT INTO public.tienda_stats (
  id, ticket_promedio, facturas, conversion, meta_diaria_tienda, 
  meta_semanal_tienda, total_venta_lograda, venta_tienda, trafico
) VALUES (
  1, 112.82, 1528, 72.47, 3800.00, 22800.00, 0.00, 172388.96, 2108.46
) ON CONFLICT (id) DO NOTHING;

-- 2. REGISTRO DE COLABORADORES (empleados)
INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  'eaadb624-c2e3-45d0-bfd4-cfff17604804', '1310559917', 'ANGEL CASIMIRO', 'VELASQUEZ DELGADO', 'ismaelvalencia481@gmail.com', 
  '0969057406', '0969057406', '2026-01-27', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1310559917', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '1b2670f4-63d3-4546-b822-7aba36072719', '1729153807', 'JOSE DANIEL', 'LUNA ENRIQUEZ', 'dl198349@gmail.com', 
  '0978764148', '0978764148', '2026-07-27', 'Bodeguero', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1729153807', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  'fa4642f4-5241-4554-b83e-116151bbee42', '1150688420', 'ANTONY STIVEN', 'GAONA JIMENEZ', 'gaonaantoni2@gmail.com', 
  '0991765242', '0991765242', '2026-12-27', 'Bodeguero', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1150688420', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  'ab7d2b87-6251-4d5e-8bda-50dd95b001cd', '1725290454', 'SAMANTHA DENISSE', 'VERA MORA', 'verasammy27@gmail.com', 
  '0992777043', '0992777043', '2026-08-29', 'Cajero', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1725290454', 'Mujer'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '10b77325-e73b-4991-b52d-7bff3f8d019f', '1755859038', 'LAYLA VALENTINA', 'MONTANO HURTADO', 'laylamontanomab@gmail.com', 
  '0998952209', '0998952209', '2026-05-27', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1755859038', 'Mujer'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '7082cc89-dcb4-4d83-9e24-ca81a20489ff', '1753456738', 'ALAIN', 'CRUZ CEVALLOS', 'cruzalain640@gmail.com', 
  '0991218319', '0991218319', '2026-12-29', 'Jefe de Tienda', 
  '2024-01-01', 'admin', true, false, 
  0, false, '1753456738', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '35fbb723-fca6-44df-840b-be66fcae0fcc', '0931982136', 'KERLY MELISA', 'ROSADO SANCHEZ', 'rosadomelisa@gmail.com', 
  '0960012405', '0960012405', '2026-01-18', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '0931982136', 'Mujer'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '68100dc5-6f2c-4d09-b3ff-446d2217cc93', '1727839142', 'WILSON OMAR', 'ARMIJOS MORETA', 'omar_wjr@hotmail.com', 
  '0939902571', '0939902571', '2026-08-27', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1727839142', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  'a6fb0862-9f8e-4ec4-bb54-73e126d9930e', '1724158850', 'JOSE LEONARDO', 'POSLIGUA MOLINA', 'leonardoposligua@hotmail.com', 
  '0998456195', '0998456195', '2026-11-30', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1724158850', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  'bb87ed17-c36e-4e53-aab1-8b194b41a968', '1761707502', 'BRAYAN STIK', 'NIETO RAMIREZ', 'bstick04@gmail.com', 
  '0962239999', '0962239999', '2026-03-03', 'Bodeguero', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1761707502', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '7ee35a89-babb-4984-9633-caa1ea449bd7', '1714768486', 'JOSE GUSTAVO', 'VALENZUELA TARAPUES', 'gvalenzuela1977.gv@gmail.com', 
  '0981336694', '0981336694', '2026-07-31', 'Jefe de Tienda', 
  '2024-01-01', 'admin', true, false, 
  0, false, '123456', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '85674c01-5b27-4a31-9b8c-d60350c1868f', '1753544103', 'GENESIS DARLYN', 'CHISCUET JIMENEZ', 'genechiscuet@gmail.com', 
  '99455935', '99455935', '2026-02-28', 'Tercero a bordo', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1753544103', 'Mujer'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '12ed1b78-2c41-4bb7-9e34-b96040cceaa1', '1712323359', 'SEGUNDO RAMIRO', 'TENORIO TOAPANTA', 'ramiroteorio2009@hotmail.com', 
  '0989272970', '0989272970', '2026-01-24', 'Asistente Operativo', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1712323359', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '9197003f-f0f8-4915-93a0-05c2357fd0e4', '1753997376', 'LUIS RENE', 'CARRION CAJAMARCA', 'luiscarrion079@gmail.com', 
  '0987480148', '0987480148', '2026-03-08', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1753997376', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '4487fba6-d247-4499-bd72-5bd2a90daf2a', '1726862194', 'SHANIA FIORELLA', 'FELIX VILLEGAS', 'shania.fiorella@gmail.com', 
  '0961145627', '0961145627', '2026-01-31', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1726862194', 'Mujer'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '33d214c1-5e1f-4391-ad82-388aeee2fabc', '1729461796', 'ELIANE FERNANDO', 'HERRERA CORREA', 'elianneherrera184@gmail.com', 
  '0983111606', '0983111606', '2026-05-01', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '1729461796', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '1f3f0f60-0d33-45af-b918-f53bbf389d72', '0803422948', 'PAOLA ESTEFANIE', 'BRAVO FARIAS', 'bravofariaspaolaestefania@hotmail.com', 
  '0959591066', '0959591066', '2026-04-23', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '0803422948', 'Mujer'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  '9646d671-f721-4149-acac-61e741ca4865', '1756162903', 'PABLO JULIÁN', 'FLORES ARMAS', 'pablo.julian.flores.armas@gmail.com', 
  '0995794306', '0995794306', '2001-01-27', 'Asesor de Ventas', 
  '2026-05-31', 'empleado', true, true, 
  0, false, '1756162903', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  'b66ce336-b9a0-4457-b3d9-ad77685ec588', '0803695311', 'JULEXY ANAIS', 'ROBINZON VALENCIA', 'julexyrobinzon@gmail.com', 
  '0998879159', '0998879159', '2026-04-05', 'Asesor de Ventas', 
  '2024-01-01', 'empleado', true, false, 
  0, false, '0803695311', 'Mujer'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

INSERT INTO public.empleados (
  id, cedula, nombres, apellidos, email, telefono, telefono_urgencia, 
  cumpleanos, cargo, fecha_ingreso, rol, activo, debe_cambiar_password, 
  intentos_fallidos, bloqueado, password_hash, genero
) VALUES (
  'e9b25396-5349-11ec-9131-0242ac130002', 'sup_mcp1', 'SUPERVISOR', 'MCP1', 'sup_mcp1@marathon.ec', 
  '0999999999', '0999999999', '1990-01-01', 'Supervisor', 
  '2026-06-04', 'supervisor', true, false, 
  0, false, 'sup*2026*', 'Hombre'
) ON CONFLICT (cedula) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  telefono_urgencia = EXCLUDED.telefono_urgencia,
  cumpleanos = EXCLUDED.cumpleanos,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  genero = EXCLUDED.genero;

