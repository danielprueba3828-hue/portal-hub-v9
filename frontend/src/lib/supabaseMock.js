/**
 * Simulador de Supabase utilizando LocalStorage
 * Permite ejecutar la aplicación al 100% de manera local.
 */

// Datos semilla generados a partir de los Excel de escritorio del usuario
const SEED_DATA = {
  empleados: [
  {
    "id": "1b2670f4-63d3-4546-b822-7aba36072719",
    "cedula": "1729153807",
    "nombres": "JOSE DANIEL",
    "apellidos": "LUNA ENRIQUEZ",
    "email": "dl198349@gmail.com",
    "telefono": "0978764148",
    "telefono_urgencia": "0978764148",
    "cumpleanos": "2026-07-27",
    "cargo": "Bodeguero",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1729153807",
    "genero": "Hombre"
  },
  {
    "id": "a6fb0862-9f8e-4ec4-bb54-73e126d9930e",
    "cedula": "1724158850",
    "nombres": "JOSE LEONARDO",
    "apellidos": "POSLIGUA MOLINA",
    "email": "leonardoposligua@hotmail.com",
    "telefono": "0998456195",
    "telefono_urgencia": "0998456195",
    "cumpleanos": "2026-11-30",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1724158850",
    "genero": "Hombre"
  },
  {
    "id": "eaadb624-c2e3-45d0-bfd4-cfff17604804",
    "cedula": "1310559917",
    "nombres": "ANGEL CASIMIRO",
    "apellidos": "VELASQUEZ DELGADO",
    "email": "ismaelvalencia481@gmail.com",
    "telefono": "0969057406",
    "telefono_urgencia": "0969057406",
    "cumpleanos": "2026-01-27",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1310559917",
    "genero": "Hombre"
  },
  {
    "id": "fa4642f4-5241-4554-b83e-116151bbee42",
    "cedula": "1150688420",
    "nombres": "ANTONY STIVEN",
    "apellidos": "GAONA JIMENEZ",
    "email": "gaonaantoni2@gmail.com",
    "telefono": "0991765242",
    "telefono_urgencia": "0991765242",
    "cumpleanos": "2026-12-27",
    "cargo": "Bodeguero",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1150688420",
    "genero": "Hombre"
  },
  {
    "id": "ab7d2b87-6251-4d5e-8bda-50dd95b001cd",
    "cedula": "1725290454",
    "nombres": "SAMANTHA DENISSE",
    "apellidos": "VERA MORA",
    "email": "verasammy27@gmail.com",
    "telefono": "0992777043",
    "telefono_urgencia": "0992777043",
    "cumpleanos": "2026-08-29",
    "cargo": "Cajero",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1725290454",
    "genero": "Mujer"
  },
  {
    "id": "10b77325-e73b-4991-b52d-7bff3f8d019f",
    "cedula": "1755859038",
    "nombres": "LAYLA VALENTINA",
    "apellidos": "MONTANO HURTADO",
    "email": "laylamontanomab@gmail.com",
    "telefono": "0998952209",
    "telefono_urgencia": "0998952209",
    "cumpleanos": "2026-05-27",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1755859038",
    "genero": "Mujer",
    "zona": "CATEGORIZACION"
  },
  {
    "id": "7082cc89-dcb4-4d83-9e24-ca81a20489ff",
    "cedula": "1753456738",
    "nombres": "ALAIN",
    "apellidos": "CRUZ CEVALLOS",
    "email": "cruzalain640@gmail.com",
    "telefono": "0991218319",
    "telefono_urgencia": "0991218319",
    "cumpleanos": "2026-12-29",
    "cargo": "Subjefe",
    "fecha_ingreso": "2024-01-01",
    "rol": "admin",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1753456738",
    "genero": "Hombre"
  },
  {
    "id": "35fbb723-fca6-44df-840b-be66fcae0fcc",
    "cedula": "0931982136",
    "nombres": "KERLY MELISA",
    "apellidos": "ROSADO SANCHEZ",
    "email": "rosadomelisa@gmail.com",
    "telefono": "0960012405",
    "telefono_urgencia": "0960012405",
    "cumpleanos": "2026-01-18",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "0931982136",
    "genero": "Mujer"
  },
  {
    "id": "68100dc5-6f2c-4d09-b3ff-446d2217cc93",
    "cedula": "1727839142",
    "nombres": "WILSON OMAR",
    "apellidos": "ARMIJOS MORETA",
    "email": "omar_wjr@hotmail.com",
    "telefono": "0939902571",
    "telefono_urgencia": "0939902571",
    "cumpleanos": "2026-08-27",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1727839142",
    "genero": "Hombre",
    "zona": "ZONA HOMBRE"
  },
  {
    "id": "bb87ed17-c36e-4e53-aab1-8b194b41a968",
    "cedula": "1761707502",
    "nombres": "BRAYAN STIK",
    "apellidos": "NIETO RAMIREZ",
    "email": "bstick04@gmail.com",
    "telefono": "0962239999",
    "telefono_urgencia": "0962239999",
    "cumpleanos": "2026-03-03",
    "cargo": "Bodeguero",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1761707502",
    "genero": "Hombre"
  },
  {
    "id": "85674c01-5b27-4a31-9b8c-d60350c1868f",
    "cedula": "1753544103",
    "nombres": "GENESIS DARLYN",
    "apellidos": "CHISCUET JIMENEZ",
    "email": "genechiscuet@gmail.com",
    "telefono": "099455935",
    "telefono_urgencia": "099455935",
    "cumpleanos": "2026-02-28",
    "cargo": "Cajero",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1753544103",
    "genero": "Mujer"
  },
  {
    "id": "12ed1b78-2c41-4bb7-9e34-b96040cceaa1",
    "cedula": "1712323359",
    "nombres": "SEGUNDO RAMIRO",
    "apellidos": "TENORIO TOAPANTA",
    "email": "ramiroteorio2009@hotmail.com",
    "telefono": "0989272970",
    "telefono_urgencia": "0989272970",
    "cumpleanos": "2026-01-24",
    "cargo": "Operativo",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1712323359",
    "genero": "Hombre"
  },
  {
    "id": "9197003f-f0f8-4915-93a0-05c2357fd0e4",
    "cedula": "1753997376",
    "nombres": "LUIS RENE",
    "apellidos": "CARRION CAJAMARCA",
    "email": "luiscarrion079@gmail.com",
    "telefono": "0987480148",
    "telefono_urgencia": "0987480148",
    "cumpleanos": "2026-03-08",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1753997376",
    "genero": "Hombre"
  },
  {
    "id": "33d214c1-5e1f-4391-ad82-388aeee2fabc",
    "cedula": "1729461796",
    "nombres": "ELIANE FERNANDO",
    "apellidos": "HERRERA CORREA",
    "email": "elianneherrera184@gmail.com",
    "telefono": "0983111606",
    "telefono_urgencia": "0983111606",
    "cumpleanos": "2026-05-01",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1729461796",
    "genero": "Hombre"
  },
  {
    "id": "1f3f0f60-0d33-45af-b918-f53bbf389d72",
    "cedula": "0803422948",
    "nombres": "PAOLA ESTEFANIE",
    "apellidos": "BRAVO FARIAS",
    "email": "bravofariaspaolaestefania@hotmail.com",
    "telefono": "0959591066",
    "telefono_urgencia": "0959591066",
    "cumpleanos": "2026-04-23",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "0803422948",
    "genero": "Mujer",
    "zona": "ZONA MUJER"
  },
  {
    "id": "9646d671-f721-4149-acac-61e741ca4865",
    "cedula": "1756162903",
    "nombres": "Pablo Julián",
    "apellidos": "Flores Armas",
    "email": "pablo.julian.flores.armas@gmail.com",
    "telefono": "0995794306",
    "telefono_urgencia": "0995794306",
    "cumpleanos": "2001-01-27",
    "cargo": "Operativo",
    "fecha_ingreso": "2026-05-31",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": true,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1756162903",
    "genero": "Hombre"
  },
  {
    "id": "1ad9b253-9653-491c-8510-91811e6ae63f",
    "cedula": "2450019076",
    "nombres": "PERALTA NIEVES",
    "apellidos": "LUIS FERNANDO",
    "email": "luisperaltanieves1999@gmail.com",
    "telefono": "0991730392",
    "telefono_urgencia": "0991730392",
    "cumpleanos": "2026-01-05",
    "cargo": "Asesor de Ventas",
    "fecha_ingreso": "2024-01-01",
    "rol": "supervisor",
    "activo": false,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "2450019076",
    "genero": "Hombre"
  },
  {
    "id": "1dd3656d-9b67-4bc4-9327-e6bc2f089c9d",
    "cedula": "1700000001",
    "nombres": "OPERATIVO MOCK",
    "apellidos": "PABLO",
    "email": "pablo@marathon.ec",
    "telefono": "0999999999",
    "telefono_urgencia": null,
    "cumpleanos": null,
    "cargo": "Operativo",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": false,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1700000001",
    "genero": "Hombre"
  },
  {
    "id": "7ee35a89-babb-4984-9633-caa1ea449bd7",
    "cedula": "1714768486",
    "nombres": "JOSE GUSTAVO",
    "apellidos": "VALENZUELA TARAPUES",
    "email": "gvalenzuela1977.gv@gmail.com",
    "telefono": "0981336694",
    "telefono_urgencia": "0981336694",
    "cumpleanos": "2026-07-31",
    "cargo": "Jefe",
    "fecha_ingreso": "2024-01-01",
    "rol": "admin",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "123456",
    "genero": "Hombre"
  },
  {
    "id": "4487fba6-d247-4499-bd72-5bd2a90daf2a",
    "cedula": "1726862194",
    "nombres": "SHANIA FIORELLA",
    "apellidos": "FELIX VILLEGAS",
    "email": "shania.fiorella@gmail.com",
    "telefono": "0961145627",
    "telefono_urgencia": "0961145627",
    "cumpleanos": "2026-01-31",
    "cargo": "Cajero",
    "fecha_ingreso": "2024-01-01",
    "rol": "empleado",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "1726862194",
    "genero": "Mujer"
  },
  {
    "id": "e9b25396-5349-11ec-9131-0242ac130002",
    "cedula": "sup_mcp1",
    "nombres": "SUPERVISOR",
    "apellidos": "MCP1",
    "email": "sup_mcp1@marathon.ec",
    "telefono": "0999999999",
    "telefono_urgencia": "0999999999",
    "cumpleanos": "1990-01-01",
    "cargo": "Supervisor",
    "fecha_ingreso": "2026-06-04",
    "rol": "supervisor",
    "activo": true,
    "debe_cambiar_password": false,
    "intentos_fallidos": 0,
    "bloqueado": false,
    "password_hash": "sup*2026*",
    "genero": "Hombre"
  }
],
  turnos: [
    {
        "id": "t-2450019076-1",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-01",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-2",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-02",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-3",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-03",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-4",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-04",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-5",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-6",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-7",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-8",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-08",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-9",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-10",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-10",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-11",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-11",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-12",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-12",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-13",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-14",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-15",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-16",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-17",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-17",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-18",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-18",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-19",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-20",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-21",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-21",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-22",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-23",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-24",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-25",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-25",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-26",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-27",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-28",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-28",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-29",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-29",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-2450019076-30",
        "empleado_cedula": "2450019076",
        "fecha": "2026-06-30",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-1",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-01",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-2",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-3",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-03",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-4",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-04",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-5",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-05",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-6",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-7",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-8",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-08",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-9",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-10",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-10",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-11",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-11",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-12",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-13",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-14",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-15",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-16",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-17",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-17",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-18",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-18",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-19",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-20",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-21",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-22",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-23",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-24",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-24",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-25",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-25",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-26",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-27",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-28",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-29",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-29",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1755859038-30",
        "empleado_cedula": "1755859038",
        "fecha": "2026-06-30",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-1",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-01",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-2",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-02",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-3",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-03",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-4",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-04",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-5",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-6",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-7",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-8",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-9",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-10",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-10",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-11",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-11",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-12",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-12",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-13",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-14",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-15",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-16",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-17",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-17",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-18",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-18",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-19",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-19",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-20",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-21",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-22",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-23",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-24",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-24",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-25",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-25",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-26",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-26",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-27",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-28",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-29",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0931982136-30",
        "empleado_cedula": "0931982136",
        "fecha": "2026-06-30",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-1",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-01",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-2",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-02",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-3",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-03",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-4",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-04",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-5",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-05",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-6",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-7",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-07",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-8",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-08",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-9",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-09",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-10",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-10",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-11",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-11",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-12",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-12",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-13",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-14",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-14",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-15",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-15",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-16",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-16",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-17",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-17",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-18",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-18",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-19",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-19",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-20",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-21",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-21",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-22",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-22",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-23",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-23",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-24",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-25",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-25",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-26",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-26",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-27",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-28",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-28",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-29",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1724158850-30",
        "empleado_cedula": "1724158850",
        "fecha": "2026-06-30",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-1",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-01",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-2",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-02",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-3",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-03",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-4",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-04",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-5",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-6",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-7",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-07",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-8",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-08",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-9",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-10",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-10",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-11",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-11",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-12",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-12",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-13",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-14",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-14",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-15",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-16",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-17",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-17",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-18",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-18",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-19",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-19",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-20",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-21",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-21",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-22",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-23",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-24",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-25",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-25",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-26",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-26",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-27",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-28",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-28",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-29",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1727839142-30",
        "empleado_cedula": "1727839142",
        "fecha": "2026-06-30",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-1",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-01",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-2",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-3",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-03",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-4",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-04",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-5",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-05",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-6",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-7",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-8",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-9",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-10",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-10",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-11",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-11",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-12",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-13",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-14",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-15",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-16",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-17",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-17",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-18",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-18",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-19",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-20",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-21",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-22",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-23",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-24",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-24",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-25",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-25",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-26",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-27",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-28",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-29",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729461796-30",
        "empleado_cedula": "1729461796",
        "fecha": "2026-06-30",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-1",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-01",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-2",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-3",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-03",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-4",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-04",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-5",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-6",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-7",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-8",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-9",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-10",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-10",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-11",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-11",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-12",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-13",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-14",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-15",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-16",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-17",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-17",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-18",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-18",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-19",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-20",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-21",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-22",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-23",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-24",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-24",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-25",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-25",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-26",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-27",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-28",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-29",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-29",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-0803422948-30",
        "empleado_cedula": "0803422948",
        "fecha": "2026-06-30",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-1",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-01",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-2",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-02",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-3",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-03",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-4",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-04",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-5",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-05",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-6",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-7",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-8",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-9",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-10",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-10",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-11",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-11",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-12",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-13",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-14",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-15",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-16",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-17",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-17",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-18",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-18",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-19",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-20",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-21",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-22",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-23",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-24",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-24",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-25",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-25",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-26",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-27",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-28",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-29",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1310559917-30",
        "empleado_cedula": "1310559917",
        "fecha": "2026-06-30",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-1",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-01",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-2",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-02",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-3",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-03",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-4",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-04",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-5",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-6",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-7",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-07",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-8",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-08",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-9",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-09",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-10",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-10",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-11",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-11",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-12",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-12",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-13",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-14",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-14",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-15",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-16",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-16",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-17",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-17",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-18",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-18",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-19",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-19",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-20",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-21",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-21",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-22",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-23",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-23",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-24",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-25",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-25",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-26",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-26",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-27",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-28",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-28",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-29",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753997376-30",
        "empleado_cedula": "1753997376",
        "fecha": "2026-06-30",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-1",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-01",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-2",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-3",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-03",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-4",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-04",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-5",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-6",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-7",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-8",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-08",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-9",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-10",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-10",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-11",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-11",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-12",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-12",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-13",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-14",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-15",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-16",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-17",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-17",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-18",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-18",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-19",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-19",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-20",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-21",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-22",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-23",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-24",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-24",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-25",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-25",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-26",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-26",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-27",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-28",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-29",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1726862194-30",
        "empleado_cedula": "1726862194",
        "fecha": "2026-06-30",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-1",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-01",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-2",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-02",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-3",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-03",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-4",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-04",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-5",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "15:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-6",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-7",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-07",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-8",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-9",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-09",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-10",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-10",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-11",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-11",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-12",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-12",
        "tipo_turno": "Tarde",
        "hora_inicio": "15:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-13",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-14",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-14",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-15",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-16",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-16",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-17",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-17",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-18",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-18",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-19",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-19",
        "tipo_turno": "Tarde",
        "hora_inicio": "15:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-20",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-21",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-21",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-22",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-23",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-23",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-24",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-24",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-25",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-25",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-26",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-26",
        "tipo_turno": "Tarde",
        "hora_inicio": "15:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-27",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-28",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-28",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-29",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-29",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1714768486-30",
        "empleado_cedula": "1714768486",
        "fecha": "2026-06-30",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-1",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-01",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-2",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-3",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-03",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-4",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-04",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-5",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-05",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "15:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-6",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "17:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-7",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-07",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-8",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-08",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-9",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-10",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-10",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-11",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-11",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-12",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "15:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-13",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "17:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-14",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-14",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-15",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-16",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-17",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-17",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-18",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-18",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-19",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "15:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-20",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "17:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-21",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-21",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-22",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-23",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-24",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-25",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-25",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-26",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "15:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-27",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "17:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-28",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-28",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-29",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-29",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753456738-30",
        "empleado_cedula": "1753456738",
        "fecha": "2026-06-30",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-1",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-01",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-2",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-02",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-3",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-03",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-4",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-04",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-5",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-05",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-6",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-7",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-8",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-08",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-9",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-10",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-10",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-11",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-11",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-12",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-12",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-13",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-14",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-15",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-15",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-16",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-17",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-17",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-18",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-18",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-19",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-19",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-20",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-21",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-22",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-22",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-23",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-24",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-25",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-25",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-26",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-26",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-27",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-28",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-29",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-29",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1729153807-30",
        "empleado_cedula": "1729153807",
        "fecha": "2026-06-30",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-1",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-01",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-2",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-02",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-3",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-03",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-4",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-04",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-5",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-05",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-6",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-7",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-07",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-8",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-9",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-10",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-10",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-11",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-11",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-12",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-13",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-14",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-14",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-15",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-16",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-17",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-17",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-18",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-18",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-19",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-20",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-21",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-21",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-22",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-23",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-24",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-24",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-25",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-25",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-26",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-27",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-28",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-28",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-29",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "18:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1150688420-30",
        "empleado_cedula": "1150688420",
        "fecha": "2026-06-30",
        "tipo_turno": "Feriado/Novedad",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-1",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-01",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-2",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-3",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-03",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-4",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-04",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-5",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-05",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-6",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-7",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-07",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-8",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-08",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-9",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-10",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-10",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-11",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-11",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-12",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-13",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-14",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-14",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-15",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-16",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-17",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-17",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-18",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-18",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-19",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-20",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-21",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-21",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-22",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-23",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-24",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-24",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-25",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-25",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-26",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-27",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-28",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-28",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-29",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-29",
        "tipo_turno": "Tarde",
        "hora_inicio": "13:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1761707502-30",
        "empleado_cedula": "1761707502",
        "fecha": "2026-06-30",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-1",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-01",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-2",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-3",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-03",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-4",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-04",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-5",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-05",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-6",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-7",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-07",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-8",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-08",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-9",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-10",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-10",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-11",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-11",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-12",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-12",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-13",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-14",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-14",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-15",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-15",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-16",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-17",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-17",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-18",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-18",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-19",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-19",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-20",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-21",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-21",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-22",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-22",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-23",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-24",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-25",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-25",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-26",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-26",
        "tipo_turno": "Mañana",
        "hora_inicio": "08:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-27",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-28",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-28",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-29",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-29",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1712323359-30",
        "empleado_cedula": "1712323359",
        "fecha": "2026-06-30",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-1",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-01",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-2",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-02",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-3",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-03",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-4",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-04",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-5",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-6",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-7",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-8",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-9",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-10",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-10",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-11",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-11",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-12",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-12",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-13",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-14",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-15",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-16",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-17",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-17",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-18",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-18",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-19",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-19",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-20",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-21",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-22",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-23",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-24",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-24",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-25",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-25",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-26",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-26",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-27",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-28",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "13:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-29",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-29",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1700000001-30",
        "empleado_cedula": "1700000001",
        "fecha": "2026-06-30",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-1",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-01",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-2",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-02",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-3",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-03",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-4",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-04",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-5",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-05",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-6",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-06",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-7",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-8",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-08",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-9",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-09",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-10",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-10",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-11",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-11",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-12",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-12",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-13",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-13",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-14",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-15",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-15",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-16",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-16",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-17",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-17",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-18",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-18",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-19",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-19",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-20",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-20",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-21",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-22",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-22",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-23",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-23",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-24",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-24",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-25",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-25",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-26",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-26",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-27",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-27",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-28",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "11:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-29",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-29",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1725290454-30",
        "empleado_cedula": "1725290454",
        "fecha": "2026-06-30",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-1",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-01",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-2",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-02",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-3",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-03",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-4",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-04",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-5",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-05",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-6",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-06",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-7",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-07",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-8",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-08",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-9",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-09",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-10",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-10",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-11",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-11",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-12",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-12",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-13",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-13",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-14",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-14",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-15",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-15",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-16",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-16",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-17",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-17",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-18",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-18",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-19",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-19",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-20",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-20",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-21",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-21",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-22",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-22",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-23",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-23",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-24",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-24",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-25",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-25",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-26",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-26",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-27",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-27",
        "tipo_turno": "Tarde",
        "hora_inicio": "12:00",
        "hora_fin": "21:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-28",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-28",
        "tipo_turno": "Mañana",
        "hora_inicio": "10:00",
        "hora_fin": "20:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-29",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-29",
        "tipo_turno": "Descanso",
        "hora_inicio": "00:00",
        "hora_fin": "00:00",
        "creado_por": "1714768486"
    },
    {
        "id": "t-1753544103-30",
        "empleado_cedula": "1753544103",
        "fecha": "2026-06-30",
        "tipo_turno": "Mañana",
        "hora_inicio": "09:00",
        "hora_fin": "19:00",
        "creado_por": "1714768486"
    }
],
  solicitudes: [
    {
      id: "sol-1",
      empleado_cedula: "1729153807",
      tipo: "Vacaciones",
      fecha_inicio: "2026-06-15",
      fecha_fin: "2026-06-22",
      duracion_tipo: "Días",
      hora_inicio: "00:00",
      hora_fin: "00:00",
      motivo: "Vacaciones anuales familiares.",
      estado: "Pendiente",
      comentario_admin: "",
      fecha_solicitud: "2026-05-28T10:30:00Z"
    },
    {
      id: "sol-2",
      empleado_cedula: "1725290454",
      tipo: "Día Libre",
"hora_inicio": "00:00",
      "hora_fin": "00:00",
      "motivo": "Trámites notariales personales.",
      "estado": "Aprobado",
      "comentario_admin": "Aprobado por Alain.",
      "fecha_solicitud": "2026-05-27T08:15:00Z",
      "procesado_por": "1753456738",
      "fecha_procesado": "2026-05-27T16:00:00Z"
    }
  ],
  "log_accesos": [
    { "id": "la-1", "cedula": "1714768486", "resultado": "Exitoso", "fecha_hora": "2026-05-30T18:00:00Z" }
  ],
  "log_auditoria": [
    { "id": "au-1", "usuario_cedula": "1714768486", "accion": "Carga Inicial", "detalles": "Inyección automática de datos de personal y horarios desde Excel.", "fecha_hora": "2026-05-30T18:00:00Z" }
  ],
  "bitacoras_jefes": [
    {
      "id": "bit-mock-1",
      "created_at": "2026-06-01T17:30:00.000Z",
      "fecha": "2026-06-01",
      "colaborador": "Jefe de Tienda",
      "cargo": "Jefe",
      "cumplimiento_meta": 104.5,
      "autorizaciones_cc": "Sí",
      "reviso_horario": "Sí",
      "observaciones": "Hoy tuvimos un excelente día de ventas. Se realizaron todas las exhibiciones de calzado de fútbol y se capacitó al personal nuevo en el sistema POS.",
      "evidencias": [
        {
          "name": "exhibicion_calzado.jpg",
          "size": 450000,
          "url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600",
          "path": "evidencias/exhibicion_calzado.jpg"
        }
      ],
      "observaciones_supervisor": [
        {
          "id": "_lecturas_bitacora_",
          "texto": "",
          "autor": "_system_",
          "rol": "system",
          "creado_en": "2026-06-01T17:30:00Z",
          "vistos": [
            { "usuario": "Jefe de Tienda", "rol": "jefatura", "fecha": "2026-06-01T17:30:00Z", "marcado_por": "Jefe de Tienda" },
            { "usuario": "Supervisor", "rol": "supervisor", "fecha": "2026-06-01T18:15:00Z", "marcado_por": "Supervisor" }
          ]
        },
        {
          "id": "obs-1",
          "texto": "Excelente trabajo con la meta de ventas. Las exhibiciones se ven impecables. ¡Sigamos así!",
          "autor": "Supervisor",
          "rol": "supervisor",
          "creado_en": "2026-06-01T18:16:00Z",
          "vistos": [
            { "usuario": "Jefe de Tienda", "rol": "jefatura", "fecha": "2026-06-01T18:30:00Z", "marcado_por": "Jefe de Tienda" }
          ]
        }
      ],
      "adm_metas_mensuales": "Sí",
      "adm_horarios_mes": "Sí",
      "op_categorizacion_pared": "Sí",
      "op_exhib_zapatos": "Sí",
      "op_tallar_paredes_marathon": "Sí"
    }
  ],
  "reportes_bodega": [
    {
      "id": "rep-mock-1",
      "created_at": "2026-06-01T19:00:00.000Z",
      "fecha": "2026-06-01",
      "colaborador": "JOSE DANIEL LUNA ENRIQUEZ",
      "turno": "Completo",
      "actividades": "Se realizó recepción de mercadería de camión (45 cartones). Todo revisado y cuadró al 100%. Se organizó la percha de calzado de running y se separaron las liquidaciones de marcas alternas en el mueble del fondo.",
      "guias_realizadas": "Sí",
      "guias_descripcion": "Se liquidaron 3 guías de traslado (GT-884, GT-885 y GT-886) por un total de 112 ítems. Se subieron los XML a FileZilla exitosamente.",
      "video_confirmado": "Sí",
      "novedades": "Ninguna novedad de infraestructura. El sensor de seguridad de la puerta trasera pitó una vez por falso contacto pero ya fue solventado.",
      "pendientes": "Queda pendiente perchar 5 cajas de accesorios Jigsaw que llegaron al final de la tarde.",
      "ev_operativa": [
        {
          "name": "bodega_ordenada.jpg",
          "size": 520000,
          "url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600",
          "path": "operativa/bodega_ordenada.jpg"
        }
      ],
      "ev_jigsaw_filezilla": [
        {
          "name": "guias_filezilla.png",
          "size": 150000,
          "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600",
          "path": "jigsaw/guias_filezilla.png"
        }
      ]
    }
  ],
  "preguntas_ninebox": [
    { "id": "p1", "seccion": "desempeno", "pregunta": "Cumplimiento de metas", "active": true },
    { "id": "p2", "seccion": "desempeno", "pregunta": "Evaluación conductual", "active": true },
    { "id": "p3", "seccion": "desempeno", "pregunta": "Elementos clave de liderazgo", "active": true },
    { "id": "p4", "seccion": "desempeno", "pregunta": "Oportunidades de mejora", "active": true },
    { "id": "p5", "seccion": "conocimientos", "pregunta": "¿Cómo me siento?", "active": true },
    { "id": "p6", "seccion": "conocimientos", "pregunta": "¿Qué espero o necesito?", "active": true },
    { "id": "p7", "seccion": "conocimientos", "pregunta": "¿A qué me comprometo?", "active": true }
  ],
  "evaluaciones_ninebox": [
    {
      "id": "ev-nine-1",
      "created_at": "2026-06-15T10:00:00.000Z",
      "fecha": "2026-06-15",
      "evaluador_cedula": "1714768486",
      "evaluado_cedula": "1724158850",
      "tienda_id": "dab81bc9-c174-475d-8b52-f67d20c77c2a",
      "periodo": "Junio 2026",
      "motivo": "Retroalimentación Mensual",
      "respuestas_desempeno": [
        { "pregunta": "Cumplimiento de metas", "evaluador": 4, "evaluado": 4 },
        { "pregunta": "Evaluación conductual", "evaluador": 4, "evaluado": 5 },
        { "pregunta": "Elementos clave de liderazgo", "evaluador": 3, "evaluado": 4 },
        { "pregunta": "Oportunidades de mejora", "evaluador": 4, "evaluado": 4 }
      ],
      "observaciones_desempeno": "Buen desempeño en ventas y actitud de equipo. Debe enfocarse en liderar más iniciativas.",
      "respuestas_conocimientos": [
        { "pregunta": "¿Cómo me siento?", "evaluador": "Motivado y con ganas de crecer", "evaluado": "Me siento muy cómodo con el equipo" },
        { "pregunta": "¿Qué espero o necesito?", "evaluador": "Capacitación en técnicas de cierre", "evaluado": "Espero más coaching del jefe" },
        { "pregunta": "¿A qué me comprometo?", "evaluador": "Llegar a la meta diaria sin excusas", "evaluado": "Mantener mi conversión arriba del 70%" }
      ],
      "observaciones_conocimientos": "El colaborador muestra gran nivel de compromiso y claridad en su rol.",
      "potencial": "Medio",
      "desempeno": "Alto",
      "plan_accion": "1. Capacitación semanal en técnicas de cierre.\n2. Monitoreo diario de conversión individual."
    }
  ]
};

// Cargar los 570 turnos desde seed_result en el script
// Inicializar base de datos local si no existe
const initDb = () => {
  const currentDb = localStorage.getItem('marathon_db');
  if (!currentDb) {
    localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
  } else {
    try {
      const db = JSON.parse(currentDb);
      if (!db || !Array.isArray(db.empleados) || !Array.isArray(db.turnos)) {
        localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
        console.log("marathon_db: Base de datos reconstruida desde semilla por inconsistencias.");
        return;
      }
      
      // Inyectar tablas de bitácoras si no existen en la base actual
      let cambiado = false;
      if (!db.bitacoras_jefes) {
        db.bitacoras_jefes = SEED_DATA.bitacoras_jefes;
        cambiado = true;
      }
      if (!db.reportes_bodega) {
        db.reportes_bodega = SEED_DATA.reportes_bodega;
        cambiado = true;
      }
      if (!db.preguntas_ninebox) {
        db.preguntas_ninebox = SEED_DATA.preguntas_ninebox;
        cambiado = true;
      }
      if (!db.evaluaciones_ninebox) {
        db.evaluaciones_ninebox = SEED_DATA.evaluaciones_ninebox;
        cambiado = true;
      }

      const testEmp = db.empleados.find(e => e.cedula === "1310559917");
      const testJefe = db.empleados.find(e => e.cedula === "1714768486");
      if (
        (testEmp && testEmp.email === "1310559917@marathon-portal.ec") ||
        (testJefe && (testJefe.nombres === "JOSE" || testJefe.nombres !== "JOSE GUSTAVO"))
      ) {
        db.empleados = SEED_DATA.empleados;
        db.turnos = SEED_DATA.turnos;
        cambiado = true;
      }

      if (cambiado) {
        localStorage.setItem('marathon_db', JSON.stringify(db));
        console.log("marathon_db: Base de datos local actualizada con éxito.");
      }
    } catch (e) {
      localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
    }
  }
};
initDb();

// Inyectar los turnos reales de manera segura al cargar el mock
const loadTurnosIntoSeed = () => {
  const db = getDb();
  if (db.turnos && db.turnos.length === 0) {
     // Si la base está vacía de turnos, jalamos de la semilla inyectada
     // Usaremos un script de node para rellenar este archivo con los turnos
  }
};

const getDb = () => {
  try {
    const db = JSON.parse(localStorage.getItem('marathon_db'));
    if (db && Array.isArray(db.empleados) && Array.isArray(db.turnos)) {
      return db;
    }
  } catch (e) {}
  localStorage.setItem('marathon_db', JSON.stringify(SEED_DATA));
  return SEED_DATA;
};
const saveDb = (db) => localStorage.setItem('marathon_db', JSON.stringify(db));

const authListeners = new Set();

export const supabaseMock = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      initDb();
      const db = getDb();
      const emp = db.empleados.find(e => e.email === email || e.cedula === email);
      
      const logAccess = (cedula, resultado) => {
        const log = {
          id: `la-${Math.random().toString(36).substring(2)}`,
          cedula,
          resultado,
          fecha_hora: new Date().toISOString()
        };
        db.log_accesos.unshift(log);
        saveDb(db);
      };

      if (!emp) {
        return { data: { user: null, session: null }, error: { message: "Usuario no registrado en el sistema." } };
      }

      if (!emp.activo) {
        logAccess(emp.cedula, "Error: Cuenta desactivada");
        return { data: { user: null, session: null }, error: { message: "Esta cuenta está desactivada. Contacte a su administrador." } };
      }

      if (emp.bloqueado) {
        logAccess(emp.cedula, "Error: Cuenta bloqueada");
        return { data: { user: null, session: null }, error: { message: "Esta cuenta está bloqueada. Contacte a su administrador." } };
      }

      if (emp.password_hash !== password) {
        emp.intentos_fallidos += 1;
        let errMsg = "Contraseña incorrecta.";
        
        if (emp.intentos_fallidos >= 5) {
          emp.bloqueado = true;
          errMsg = "Cuenta bloqueada tras 5 intentos fallidos.";
          logAccess(emp.cedula, "Bloqueo por intentos fallidos");
        } else {
          logAccess(emp.cedula, `Fallo (Intento ${emp.intentos_fallidos})`);
        }
        
        saveDb(db);
        return { data: { user: null, session: null }, error: { message: errMsg } };
      }

      emp.intentos_fallidos = 0;
      saveDb(db);
      
      logAccess(emp.cedula, "Exitoso");

      const sessionUser = {
        id: emp.id,
        email: emp.email,
        user_metadata: {
          cedula: emp.cedula,
          nombres: emp.nombres,
          apellidos: emp.apellidos,
          cargo: emp.cargo,
          rol: emp.rol,
          debe_cambiar_password: emp.debe_cambiar_password
        }
      };

      const session = {
        access_token: `mock-jwt-${emp.id}-${Date.now()}`,
        expires_at: Math.floor(Date.now() / 1000) + 8 * 3600,
        user: sessionUser
      };

      localStorage.setItem('marathon_session', JSON.stringify(session));
      authListeners.forEach(listener => listener('SIGNED_IN', session));

      return { data: { user: sessionUser, session }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('marathon_session');
      authListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    },

    getSession: async () => {
      const sessionStr = localStorage.getItem('marathon_session');
      if (!sessionStr) return { data: { session: null }, error: null };
      const session = JSON.parse(sessionStr);
      return { data: { session }, error: null };
    },

    onAuthStateChange: (callback) => {
      authListeners.add(callback);
      const sessionStr = localStorage.getItem('marathon_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            }
          }
        }
      };
    }
  },

  from: (tableName) => {
    initDb();
    
    const getTableData = () => {
      const db = getDb();
      return db[tableName] || [];
    };

    let queryData = getTableData();

    const builder = {
      select: (fields = '*') => {
        return builder;
      },

      insert: async (records) => {
        const db = getDb();
        const rows = Array.isArray(records) ? records : [records];
        const newRows = rows.map(r => ({
          id: r.id || `${tableName.substring(0, 3)}-${Math.random().toString(36).substring(2)}`,
          ...r
        }));
        
        db[tableName] = [...(db[tableName] || []), ...newRows];
        saveDb(db);
        
        if (tableName !== 'log_accesos' && tableName !== 'log_auditoria') {
          const session = JSON.parse(localStorage.getItem('marathon_session') || '{}');
          const adminCedula = session.user?.user_metadata?.cedula || 'Sistema';
          const audit = {
            id: `au-${Math.random().toString(36).substring(2)}`,
            usuario_cedula: adminCedula,
            accion: `Inserción en ${tableName}`,
            detalles: `Registrados ${newRows.length} fila(s).`,
            fecha_hora: new Date().toISOString()
          };
          db.log_auditoria.unshift(audit);
          saveDb(db);
        }

        return { data: newRows, error: null };
      },

      upsert: async (records) => {
        const db = getDb();
        const rows = Array.isArray(records) ? records : [records];
        const existingData = db[tableName] || [];
        const updatedRows = [];

        rows.forEach(record => {
          let foundIdx = -1;
          
          if (tableName === 'turnos') {
            foundIdx = existingData.findIndex(t => t.empleado_cedula === record.empleado_cedula && t.fecha === record.fecha);
          } else if (record.id) {
            foundIdx = existingData.findIndex(e => e.id === record.id);
          } else if (record.cedula) {
            foundIdx = existingData.findIndex(e => e.cedula === record.cedula);
          }

          if (foundIdx > -1) {
            existingData[foundIdx] = { ...existingData[foundIdx], ...record };
            updatedRows.push(existingData[foundIdx]);
          } else {
            const newRecord = {
              id: record.id || `${tableName.substring(0, 3)}-${Math.random().toString(36).substring(2)}`,
              ...record
            };
            existingData.push(newRecord);
            updatedRows.push(newRecord);
          }
        });

        db[tableName] = existingData;
        saveDb(db);
        return { data: updatedRows, error: null };
      },

      update: (updates) => {
        return {
          eq: async (field, value) => {
            const db = getDb();
            let updatedCount = 0;
            
            db[tableName] = (db[tableName] || []).map(row => {
              if (row[field] === value) {
                updatedCount++;
                return { ...row, ...updates };
              }
              return row;
            });
            
            saveDb(db);
            
            const session = JSON.parse(localStorage.getItem('marathon_session') || '{}');
            const adminCedula = session.user?.user_metadata?.cedula || 'Sistema';
            
            if (tableName === 'empleados' && updates.activo === false) {
              const audit = {
                id: `au-${Math.random().toString(36).substring(2)}`,
                usuario_cedula: adminCedula,
                accion: "Baja de empleado",
                detalles: `Baja del empleado con ${field}: ${value}.`,
                fecha_hora: new Date().toISOString()
              };
              db.log_auditoria.unshift(audit);
              saveDb(db);
            } else if (tableName !== 'log_accesos' && tableName !== 'log_auditoria') {
              const audit = {
                id: `au-${Math.random().toString(36).substring(2)}`,
                usuario_cedula: adminCedula,
                accion: `Actualización en ${tableName}`,
                detalles: `Modificado(s) ${updatedCount} registro(s) donde ${field} = ${value}.`,
                fecha_hora: new Date().toISOString()
              };
              db.log_auditoria.unshift(audit);
              saveDb(db);
            }

            const updatedRows = db[tableName].filter(row => row[field] === value);
            return { data: updatedRows, error: null };
          }
        };
      },

      delete: () => {
        return {
          eq: async (field, value) => {
            const db = getDb();
            const originalRows = db[tableName] || [];
            const dataToKeep = originalRows.filter(row => row[field] !== value);
            const deletedData = originalRows.filter(row => row[field] === value);
            
            db[tableName] = dataToKeep;
            saveDb(db);
            
            const session = JSON.parse(localStorage.getItem('marathon_session') || '{}');
            const adminCedula = session.user?.user_metadata?.cedula || 'Sistema';
            
            const audit = {
              id: `au-${Math.random().toString(36).substring(2)}`,
              usuario_cedula: adminCedula,
              accion: `Eliminación en ${tableName}`,
              detalles: `Eliminado(s) ${deletedData.length} registro(s) donde ${field} = ${value}.`,
              fecha_hora: new Date().toISOString()
            };
            db.log_auditoria.unshift(audit);
            saveDb(db);

            return { data: deletedData, error: null };
          }
        };
      },

      eq: (field, value) => {
        queryData = queryData.filter(row => row[field] === value);
        return builder;
      },

      neq: (field, value) => {
        queryData = queryData.filter(row => row[field] !== value);
        return builder;
      },

      gte: (field, value) => {
        queryData = queryData.filter(row => row[field] >= value);
        return builder;
      },

      lte: (field, value) => {
        queryData = queryData.filter(row => row[field] <= value);
        return builder;
      },

      in: (field, valuesArray) => {
        queryData = queryData.filter(row => valuesArray.includes(row[field]));
        return builder;
      },

      or: (orString) => {
        queryData = queryData.filter(row => {
          const conditions = orString.split(',');
          return conditions.some(cond => {
            const match = cond.match(/^([^.]+)\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.*)$/);
            if (!match) return false;
            const [_, field, op, val] = match;
            const rowVal = row[field];
            
            let compareVal = val;
            if (val === 'null') compareVal = null;
            else if (val === 'true') compareVal = true;
            else if (val === 'false') compareVal = false;

            if (op === 'eq' || op === 'is') {
              return String(rowVal) === String(compareVal);
            } else if (op === 'neq') {
              return String(rowVal) !== String(compareVal);
            } else if (op === 'gt') {
              return rowVal > compareVal;
            } else if (op === 'gte') {
              return rowVal >= compareVal;
            } else if (op === 'lt') {
              return rowVal < compareVal;
            } else if (op === 'lte') {
              return rowVal <= compareVal;
            } else if (op === 'like' || op === 'ilike') {
              return String(rowVal).toLowerCase().includes(String(compareVal).toLowerCase());
            } else if (op === 'in') {
              const cleanVal = compareVal.replace(/^\((.*)\)$/, '$1');
              const vals = cleanVal.split('.');
              return vals.includes(String(rowVal));
            }
            return false;
          });
        });
        return builder;
      },

      order: (field, { ascending = true } = {}) => {
        queryData = [...queryData].sort((a, b) => {
          if (a[field] < b[field]) return ascending ? -1 : 1;
          if (a[field] > b[field]) return ascending ? 1 : -1;
          return 0;
        });
        return builder;
      },

      limit: (count) => {
        if (typeof count === 'number' && count >= 0) {
          queryData = queryData.slice(0, count);
        }
        return builder;
      },

      range: (from, to) => {
        queryData = queryData.slice(from, to + 1);
        return builder;
      },

      match: (obj) => {
        Object.entries(obj || {}).forEach(([k, v]) => {
          queryData = queryData.filter(row => String(row[k]) === String(v));
        });
        return builder;
      },

      maybeSingle: () => {
        const result = queryData.length > 0 ? queryData[0] : null;
        return Promise.resolve({ data: result, error: null });
      },

      single: () => {
        if (queryData.length === 0) {
          return Promise.resolve({ data: null, error: { message: 'JSON object requested, multiple or no rows returned' } });
        }
        return Promise.resolve({ data: queryData[0], error: null });
      },

      then: (onSuccess, onError) => {
        return Promise.resolve({ data: queryData, error: null }).then(onSuccess, onError);
      }
    };

    return builder;
  },

  channel: (channelName) => {
    const mockChannel = {
      on: (event, filter, callback) => mockChannel,
      subscribe: (callback) => {
        if (callback) callback('SUBSCRIBED');
        return mockChannel;
      },
      unsubscribe: () => {}
    };
    return mockChannel;
  },

  removeChannel: (channel) => {
    return Promise.resolve({ error: null });
  }
};
