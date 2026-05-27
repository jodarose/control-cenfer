# Control Cenfer — Documento de diseño

**Fecha:** 2026-05-26
**Proyecto:** Control Cenfer — Sistema de control de acceso al recinto ferial Cenfer
**Versión del documento:** 1.0
**Estado:** Aprobado para implementación

## 1. Resumen ejecutivo

Control Cenfer es un sistema integral para administrar el ingreso de contratistas, proveedores, operarios, terceros y empresas invitadas al recinto ferial Cenfer. El sistema digitaliza el flujo completo desde la solicitud de acceso, la carga de personal por parte de la empresa contratista, la revisión documental por Seguridad y Salud en el Trabajo (SST), la emisión de credenciales digitales con código QR, hasta la validación en portería mediante app móvil nativa y la generación de reportes operativos y legales.

## 2. Objetivos y alcance

### 2.1 Objetivos
- Garantizar que ninguna persona ingrese al recinto sin habilitación documental válida por SST.
- Automatizar el flujo de invitación, carga de documentos y aprobación, reduciendo trabajo manual.
- Proveer trazabilidad legal completa (quién autorizó qué, cuándo, con qué evidencia).
- Dar a la portería herramientas rápidas y confiables para validar accesos en segundos.
- Generar reportes operativos en tiempo real y reportes históricos exportables.

### 2.2 No-objetivos (v1)
- Integración con sistemas biométricos (huella/facial).
- Reconocimiento automático de cédula por OCR avanzado (solo lectura por teclado y QR en v1).
- WhatsApp como canal de notificación (queda planeado para fase 2).
- Aplicación móvil para personas invitadas (reciben credencial por email).
- Multi-tenant: el sistema atiende solo a Cenfer.

## 3. Decisiones tomadas

| # | Decisión | Razón |
|---|---|---|
| 1 | Web app + app móvil nativa (Expo) para portero | Cámara optimizada para QR; el portero es el rol más operativo |
| 2 | Validación en portería: cédula + QR + lista del día | Cubre 100% de casos (preparados o no preparados) |
| 3 | Documentos SST mínimos: cédula, ARL, EPS, PILA, foto, inducción digital | Cumplimiento legal Colombia + foto para credencial |
| 4 | Flujo híbrido: Cenfer crea solicitud, empresa carga personal, SST aprueba persona por persona | Cenfer controla quién entra al sistema; empresa hace el trabajo pesado de cargar docs; SST mantiene última palabra |
| 5 | 6 roles: Super Admin, SST, Recepción, Empresa, Portero, Persona | Cubren todos los actores sin redundancia |
| 6 | Notificaciones: email + in-app (v1) | WhatsApp en fase 2 cuando se mida adopción |
| 7 | Stack: Supabase + Next.js + Expo + TypeScript + monorepo (pnpm + Turborepo) | Backend manejado, tipos compartidos, dominio claro |
| 8 | Escala: ~500 ingresos/día, 2 porterías, internet estable | Supabase Pro suficiente, offline ligero |
| 9 | Reportes: todos (presencia en tiempo real, historial, vencimientos, no-salieron, auditoría legal, dashboards) | Operación y cumplimiento |

## 4. Arquitectura

### 4.1 Stack tecnológico

- **Frontend web:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Recharts.
- **Frontend móvil:** Expo (React Native), TypeScript, expo-camera, expo-secure-store.
- **Backend:** Supabase Cloud (Postgres 15, Auth, Storage, Realtime, Edge Functions).
- **Email:** Resend.
- **Validación:** Zod (compartido cliente y servidor vía paquete `shared`).
- **Estado:** TanStack Query (server state), Zustand (UI state local).
- **Pruebas:** Vitest (unit), Playwright (e2e web), Maestro o Detox (e2e mobile), pgTAP (RLS).
- **CI/CD:** GitHub Actions, Vercel para web, EAS para mobile.
- **Observabilidad:** Sentry, Supabase Logs, Vercel Logs.

### 4.2 Estructura del monorepo

```
control-cenfer/
├── apps/
│   ├── web/                Next.js (Admin, SST, Recepción, Empresa, Persona)
│   └── mobile/             Expo (Portero)
├── packages/
│   ├── shared/             Tipos, esquemas Zod, lógica de dominio pura
│   ├── supabase/           Cliente Supabase tipado + tipos generados de la BD
│   └── ui/                 Componentes UI compartidos
├── supabase/
│   ├── migrations/         Migraciones SQL versionadas
│   ├── functions/          Edge Functions
│   ├── tests/              Tests pgTAP de RLS
│   └── seed.sql
├── .github/workflows/
├── docs/
└── turbo.json, pnpm-workspace.yaml
```

### 4.3 Capas (Clean Architecture)

Dentro de cada `apps/*` y `packages/shared`:

- **Dominio** (`packages/shared/domain/`): entidades (Solicitud, Persona, Documento), reglas de negocio puras. Sin dependencias externas.
- **Casos de uso** (`packages/shared/use-cases/`): orquestación (`AprobarSolicitud`, `RegistrarIngreso`). Hablan con repositorios mediante interfaces.
- **Adaptadores de interfaz** (`apps/*/src/adapters/`): implementaciones concretas de repositorios Supabase, controladores HTTP (Next.js Route Handlers), componentes React.
- **Frameworks y drivers** (`apps/*/src/infrastructure/`): cliente Supabase, Edge Functions, integración Resend.

La dependencia siempre apunta hacia adentro: UI → use cases → dominio. Nunca al revés.

### 4.4 Módulos funcionales (web)

1. Identidad y roles
2. Empresas contratistas
3. Solicitudes de acceso
4. Registro de personal (lado empresa, link público)
5. Revisión SST
6. Credenciales y QR
7. Inducción digital
8. Catálogos (actividades, áreas, document types, niveles de riesgo)
9. Reportes y auditoría
10. Notificaciones (Edge Functions)

### 4.5 Módulos funcionales (mobile portero)

1. Login simplificado + PIN local
2. Escaneo de QR
3. Búsqueda por cédula
4. Lista del día (sincronizada vía Realtime)
5. Registro de entrada/salida
6. Modo offline ligero (cache de lista del día + cola de eventos)

## 5. Modelo de datos

Todas las tablas incluyen `id uuid`, `created_at timestamptz`, `updated_at timestamptz`, y tienen RLS activada.

### 5.1 Identidad y organización

- **`profiles`** — extiende `auth.users`. Campos: `nombre`, `apellido`, `telefono`, `rol` (enum: `super_admin`, `sst`, `recepcion`, `empresa`, `portero`, `persona`).
- **`companies`** — empresas contratistas. `nit` (único), `razon_social`, `contacto_nombre`, `contacto_email`, `contacto_telefono`, `documentos_legales` (jsonb).
- **`company_users`** — vincula usuarios `empresa` con su `company_id`.
- **`porterias`** — `nombre`, `ubicacion`.

### 5.2 Catálogos

- **`activities`** — `nombre`, `nivel_riesgo_default`, `documentos_requeridos` (array de keys).
- **`risk_levels`** — `bajo`, `medio`, `alto`, con `documentos_requeridos` mínimos.
- **`areas`** — pabellones, stands, zonas del recinto.
- **`document_types`** — `cedula`, `arl`, `eps`, `pila`, `foto`, `induccion`, `alturas`, `examen_medico`, etc.

### 5.3 Flujo de acceso

- **`access_requests`** — `company_id`, `activity_id`, `area_id`, `fecha_desde`, `fecha_hasta`, `horario_inicio`, `horario_fin`, `responsable_cenfer_id`, `nivel_riesgo`, `cantidad_estimada`, `observaciones`, `estado` (enum: `borrador`, `enviada`, `en_carga`, `en_revision_sst`, `aprobada`, `rechazada`, `vigente`, `vencida`, `cancelada`), `public_token` (uuid), `public_token_expires_at`.
- **`request_vehicles`** — `access_request_id`, `placa`, `tipo`, `conductor_person_id`.
- **`request_tools`** — `access_request_id`, `descripcion`, `cantidad`, `serial` (opcional).
- **`request_misc`** — `access_request_id`, `descripcion` (insumos, materiales, etc.).

### 5.4 Personas y documentos

- **`people`** — `cedula` (único, indexado), `nombre`, `apellido`, `telefono`, `email`, `eps`, `arl`, `cargo`, `foto_url`, `company_id`.
- **`person_documents`** — `person_id`, `document_type`, `archivo_url` (Supabase Storage path), `fecha_emision`, `fecha_vencimiento`, `estado` (`pendiente`, `aprobado`, `rechazado`), `revisado_por`, `revisado_at`, `motivo_rechazo`.
- **`request_people`** — tabla puente: `access_request_id`, `person_id`, `estado_individual` (`pendiente_docs`, `en_revision`, `aprobada`, `rechazada`), `qr_code` (string firmado HMAC), `qr_expires_at`.

### 5.5 Inducción

- **`inductions`** — `version`, `video_url`, `cuestionario_json`, `vigencia_meses`.
- **`induction_completions`** — `person_id`, `induction_id`, `respuestas_json`, `aprobada`, `firma_simple`, `completed_at`, `expires_at`.

### 5.6 Operación de portería

- **`access_events`** — `request_person_id`, `tipo` (`entrada`, `salida`), `portero_id`, `porteria_id`, `metodo` (`cedula`, `qr`, `manual`), `created_at`. Índice compuesto en (`created_at`, `porteria_id`).

### 5.7 Auditoría

- **`audit_log`** — `actor_id`, `accion`, `entidad`, `entidad_id`, `payload_diff_json`, `created_at`. Inmutable (solo INSERT vía trigger).

### 5.8 Vistas y materializadas

- **`v_personas_dentro`** — quién está dentro ahora.
- **`v_documentos_por_vencer`** — documentos con `fecha_vencimiento` ≤ 30 días.
- **`v_no_salieron_hoy`** — personas con entrada hoy sin salida.
- Vistas materializadas (refresh cada hora vía cron Edge Function) para dashboards pesados.

### 5.9 Storage de Supabase

- **`documentos`** (privado): ARL, EPS, PILA, certificados, cédulas. Acceso vía signed URL (5 min).
- **`fotos_personas`** (privado): fotos para credencial.
- **`inducciones`** (lectura pública): videos de inducción.
- Límite por archivo: 2 MB (para caber en Supabase Free 1 GB). Fotos se comprimen en cliente a ≤ 300 KB. Tipos permitidos: PDF, JPG, PNG.

## 6. Flujos clave

### 6.1 Flujo A — Crear solicitud y carga de personal

1. Recepción inicia sesión en web → "Nueva solicitud".
2. Llena formulario (empresa, actividad, área, fechas, horario, responsable, riesgo, vehículos, herramientas, varios). Guarda como `borrador`.
3. "Enviar a empresa" → estado `enviada`, se genera `public_token` con expiración `fecha_hasta + 7 días`, se envía email al contacto con link único.
4. Empresa abre `controlcenfer.com/empresa/{token}` (sin login obligatorio).
5. Empresa carga personal y documentos. Personas existentes (misma cédula) se sugieren para reutilizar.
6. La persona recibe email con link a inducción digital y firma.
7. Empresa pulsa "Enviar a SST" → estado `en_revision_sst`.

### 6.2 Flujo B — Revisión SST

1. SST abre bandeja → solicitudes ordenadas por urgencia.
2. Por persona: revisa cada documento (signed URL), valida vencimiento, marca aprobado o rechazado con motivo.
3. Cuando todas las personas están aprobadas, SST aprueba la solicitud → estado `aprobada`. Si `fecha_desde` ya llegó → `vigente`.
4. El sistema dispara: generación de QR firmado HMAC por persona, email a cada persona con credencial digital, email de resumen a la empresa.

### 6.3 Flujo C — Validación en portería (app móvil)

1. Portero abre la app, ya logueado, desbloquea con PIN local.
2. Tres botones grandes: **Escanear QR**, **Buscar por cédula**, **Lista del día**.
3. **QR:** abre cámara → lee QR → valida firma HMAC + vigencia + rango de fechas + horario → muestra tarjeta verde/roja con foto, nombre, empresa, actividad, vigencia.
4. **Cédula:** teclea número → busca solicitudes vigentes asociadas para hoy → mismo resultado.
5. Verde: portero pulsa "Registrar ENTRADA" o "SALIDA" → crea `access_event`.
6. Rojo: muestra motivo específico (vencido, fuera de rango, no aprobada, fuera de horario).
7. Lista del día sincronizada vía Realtime.

### 6.4 Flujo D — Vencimientos

- Edge Function diaria (cron) revisa documentos a vencer en 7/15/30 días → email a persona y empresa.
- Si un documento vence durante una solicitud vigente, la persona queda bloqueada automáticamente.

### 6.5 Flujo E — Cierre de día

- Edge Function a las 23:00 (configurable) detecta entradas sin salida → email a SST y responsable Cenfer.

## 7. Seguridad y permisos

### 7.1 Autenticación

- Supabase Auth (email + contraseña) para Admin, SST, Recepción, Empresa, Portero.
- 2FA TOTP obligatorio para `super_admin` y `sst`.
- Personas invitadas no requieren cuenta; reciben credencial QR por email. Pueden crear cuenta opcional para ver historial y renovar documentos.
- Portero móvil: token de larga duración + PIN local (expo-secure-store).
- Acceso público vía `public_token` con expiración para el contacto de la empresa.

### 7.2 Autorización (RLS)

- **`profiles`**: usuario ve solo el suyo; admin ve todos.
- **`companies`**: empresa ve solo la suya; recepción/SST/admin ven todas.
- **`access_requests`**: empresa ve solo las suyas; recepción ve las creadas por ella; SST ve `en_revision_sst` en adelante; admin ve todas.
- **`people` y `person_documents`**: empresa ve solo las suyas; SST/admin ven todas; portero solo lee personas con solicitud vigente para hoy.
- **`access_events`**: portero inserta solo en su portería; admin/SST/recepción leen todos; empresa lee solo de su personal.
- **`audit_log`**: lectura solo admin/SST; insert solo vía trigger.
- Acceso vía token público: función `get_request_by_token` (SECURITY DEFINER) valida token + expiración.

### 7.3 Storage

- Buckets privados; acceso vía signed URL (5 min) emitida por Edge Function que valida permisos.

### 7.4 Validación

- Zod en cliente y servidor (paquete `shared`).
- Triggers Postgres validan invariantes (fechas coherentes, no aprobar solicitud sin todas las personas aprobadas, etc.).

### 7.5 QR firmado

- QR contiene `request_person_id` + firma HMAC con secreto del servidor. Imposible falsificar o adivinar.
- Cada escaneo valida la firma en el servidor antes de marcar el evento.

### 7.6 Protecciones operativas

- Rate limiting en endpoints públicos (Edge Functions): máx. 30 req/min por IP.
- Cumplimiento Habeas Data (Colombia): consentimiento explícito al cargar datos, política de privacidad versionada, derecho a solicitar borrado.

### 7.7 Auditoría

- Triggers en `access_requests`, `person_documents`, `request_people` registran cada mutación en `audit_log` con `actor_id` y diff JSON. Inmutable.

## 8. Reportes y dashboards

### 8.1 Reportes exportables (Excel y PDF)

| Código | Reporte | Notas |
|---|---|---|
| a | Quién está dentro AHORA | Tiempo real (Realtime) |
| b | Historial ingresos/salidas | Filtros por persona, empresa, fecha, portería |
| c | Documentos por vencer/vencidos | Con botón "enviar recordatorio" |
| d | Tiempos y cuellos de botella | Vistas materializadas refrescadas cada hora |
| e | No salieron al cierre | Histórico de cierres diarios |
| f | Reporte legal/auditoría | PDF con membrete Cenfer, trazabilidad completa |
| g | Dashboard por actividad/empresa | Gráficas con Recharts |

### 8.2 Implementación

- Live (a, e): Supabase Realtime + vistas Postgres.
- Históricos (b, d, f, g): consultas SQL con índices apropiados.
- Vistas materializadas refrescadas vía cron Edge Function cada hora.
- Export Excel: `exceljs`. Export PDF: `@react-pdf/renderer`.
- Búsqueda: full-text search Postgres en `people.cedula`, `people.nombre`, `companies.razon_social`.

### 8.3 Notificaciones automáticas

- Solicitud creada → email a empresa.
- Personal cargado → email a SST.
- Aprobado/rechazado → email a persona y empresa.
- Documento por vencer (30/15/7 días) → email.
- Documento vencido → bloqueo + email.
- No salió al cierre → email a SST y responsable.

## 9. Estrategia de pruebas

| Capa | Herramienta | Cobertura objetivo |
|---|---|---|
| Dominio puro (`packages/shared`) | Vitest | 90%+ |
| Validaciones Zod | Vitest | 100% de esquemas |
| RLS y funciones Postgres | pgTAP | Por rol y por tabla |
| Edge Functions | Deno test | Generación QR, emails, jobs |
| E2E web | Playwright | ~10 flujos críticos |
| E2E mobile | Maestro o Detox | ~5 flujos críticos |
| Smoke producción | Health check Edge Function | Cada 5 minutos |

No se harán unit tests de componentes UI triviales.

## 10. Entornos y despliegue

### 10.1 Entornos

- **Local:** Supabase Docker, datos seed.
- **Staging:** proyecto Supabase separado, `staging.controlcenfer.com`.
- **Producción:** Supabase plan Pro, `controlcenfer.com`.

### 10.2 CI/CD

- PR: lint + typecheck + tests unitarios + tests RLS.
- Merge a `main`: deploy automático a staging, migraciones via `supabase db push`.
- Producción: deploy manual con aprobación en GitHub Actions.
- Mobile: OTA vía EAS Update para parches; builds nativos para cambios de SDK.

### 10.3 Hosting (planes gratuitos)

Decisión: arrancar 100% en planes gratuitos. Se acepta el riesgo conscientemente y se monitorea para subir de plan cuando se sature algún límite.

| Servicio | Plan | Límites relevantes |
|---|---|---|
| Web | Vercel Hobby (free) | 100 GB bandwidth, dominios custom, SSL. Términos: uso no comercial — revisar antes de salir a producción comercial real |
| Backend / DB / Storage / Auth | Supabase Free | 500 MB DB, 1 GB storage, 5 GB egress, 50K MAU, 500K invocations Edge Functions, proyecto se pausa tras 7 días sin actividad, sin backups automáticos |
| Email transaccional | Resend Free | 3,000 emails/mes, máx. 100/día, 1 dominio verificado |
| Errores | Sentry Free | 5K eventos/mes |
| Mobile builds | EAS Free | 30 builds Android + 30 iOS por mes, cola compartida |
| CI/CD | GitHub Actions | Gratis ilimitado en repos públicos; 2,000 min/mes en privados |
| Dominio | Compra anual | ~USD $1/mes amortizado |

**Costo estimado v1:** USD ~$1/mes (solo el dominio).

### 10.4 Riesgos del plan free y mitigaciones obligatorias

| Riesgo | Mitigación dentro del código |
|---|---|
| Storage Supabase 1 GB se llena con documentos | Comprimir imágenes en cliente antes de subir (objetivo ≤ 300 KB por foto); validar tamaño máximo 2 MB en lugar de 5 MB; rutina mensual de archivado a almacenamiento externo (manual al inicio) |
| Sin backups automáticos en Supabase Free | Edge Function semanal que exporta tablas críticas (`access_requests`, `request_people`, `person_documents`, `access_events`, `audit_log`) a un archivo JSON/CSV y lo sube al bucket `documentos/backups/` con timestamp |
| Proyecto Supabase se pausa tras 7 días sin actividad | Edge Function cron diaria (health check) que hace un SELECT trivial — mantiene el proyecto activo |
| Resend 100 emails/día (puede limitar día pico) | Cola de envíos con throttling: tabla `email_queue` y Edge Function que procesa máx. 90 emails/día; emails priorizados (credencial > rechazo > vencimiento > recordatorio); diferir lo no urgente al día siguiente |
| Vercel Hobby es técnicamente no comercial | Documentar como riesgo legal aceptado; preparar migración a Pro lista (cambio de configuración menor); monitorear notificaciones de Vercel |
| Producción sin redundancia | Documento de "Disaster Recovery": pasos manuales para restaurar desde los exports semanales |

### 10.5 Triggers para subir de plan

Definidos por adelantado para no improvisar:

- **Subir Supabase a Pro (USD $25/mes)** cuando se cumpla cualquiera de: storage > 800 MB, DB > 400 MB, egress mensual > 4 GB, o tras 60 días en producción real (lo que ocurra primero).
- **Subir Resend a Pro (USD $20/mes)** cuando la cola de emails empiece a diferir más del 10% de los mensajes a más de 24h.
- **Subir Vercel a Pro (USD $20/mes)** antes del primer evento ferial real en producción (cumplimiento de términos comerciales) o si el bandwidth se acerca a 80 GB/mes.

### 10.6 Observabilidad

- Logs: Supabase Logs + Vercel Logs.
- Errores: Sentry Free.
- Alertas: webhook Supabase a email.

## 11. Plan de desarrollo

| Fase | Descripción | Duración |
|---|---|---|
| 0 | Cimientos: monorepo, Supabase local, auth, roles, RLS base, CI | ~1 semana |
| 1 | Catálogos y empresas | ~3 días |
| 2 | Solicitudes + carga empresa (Flujo A) | ~1.5 semanas |
| 3 | Revisión SST + credencial QR (Flujo B) | ~1.5 semanas |
| 4 | App móvil portero (Flujo C) | ~2 semanas |
| 5 | Inducción digital | ~1 semana |
| 6 | Reportes y dashboards | ~1.5 semanas |
| 7 | Jobs nocturnos (vencimientos, no-salieron) | ~3 días |
| 8 | Pulido, pruebas, capacitación, piloto | ~1 semana |

**Total estimado:** 10–12 semanas (1 dev fullstack senior) · 7–8 semanas (2 personas).

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Adopción lenta por contratistas no técnicos | UX simplificada en link público, sin login obligatorio, soporte por email |
| Portería sin internet momentáneo | Cache de lista del día + cola de eventos offline |
| Documentos PDF maliciosos | Validación de tipo MIME + límite 5 MB + escaneo (opcional) |
| Falsificación de QR | Firma HMAC + validación servidor en cada escaneo |
| Pérdida de cumplimiento Habeas Data | Consentimiento versionado, derecho a borrado, retención definida |
| Salida de un dev clave | Monorepo bien documentado, README por paquete, tests como documentación |

## 13. Glosario

- **SST:** Seguridad y Salud en el Trabajo.
- **ARL:** Administradora de Riesgos Laborales (Colombia).
- **EPS:** Entidad Promotora de Salud (Colombia).
- **PILA:** Planilla Integrada de Liquidación de Aportes (seguridad social).
- **RLS:** Row Level Security (Postgres).
- **HMAC:** Hash-based Message Authentication Code.
- **OTA:** Over-The-Air update (Expo).
