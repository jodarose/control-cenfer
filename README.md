# Control Cenfer

Sistema de control de acceso al recinto ferial Cenfer.

- **Diseño:** [docs/superpowers/specs/2026-05-26-control-cenfer-design.md](docs/superpowers/specs/2026-05-26-control-cenfer-design.md)
- **Plan:** [docs/superpowers/plans/2026-05-26-control-cenfer.md](docs/superpowers/plans/2026-05-26-control-cenfer.md)

## Entornos

| Entorno | URL |
|---|---|
| Producción | https://control-cenfer.vercel.app |
| Supabase | https://xihkwvcxodhsoetjppqw.supabase.co (project `ControlCenfer`) |
| Repo | https://github.com/jodarose/control-cenfer |

## Estado actual (MVP funcional vía web)

### Implementado y desplegado

- **Auth** con 6 roles (super_admin, sst, recepcion, empresa, portero, persona).
- **Catálogos** (admin): actividades, áreas, porterías, document_types.
- **Empresas contratistas** (recepción/admin).
- **Solicitudes de acceso** (recepción crea → link público → SST aprueba):
  - `/dashboard/solicitudes` y `/dashboard/solicitudes/nueva`.
  - `/empresa/{token}` portal público sin login para que la empresa cargue su personal y documentos a Supabase Storage.
- **Revisión SST** (`/dashboard/sst/bandeja`):
  - Bandeja priorizada por fecha.
  - Aprobar/rechazar cada documento (con motivo) y luego la solicitud completa.
  - Al aprobar, el sistema genera automáticamente el QR para cada persona aprobada.
- **Credencial digital pública** (`/credencial/{qrCode}`): tarjeta con foto, datos y QR re-renderizado.
- **Portería web** (`/dashboard/porteria`):
  - Selección de portería (guardada en localStorage).
  - Validación por cédula o QR (verde/rojo card) con verificación de vigencia, horario, rango de fechas, duplicados.
  - Registro de entrada/salida.
  - Lista del día.
  - Personas dentro ahora.
- **Reportes** (`/dashboard/reportes`):
  - Documentos por vencer.
  - Personas que no salieron hoy.
  - Historial filtrable por fecha y empresa.
  - Dashboard métricas por empresa y por actividad.

### Diferido (requiere acciones manuales o trabajo adicional)

| Pendiente | Razón |
|---|---|
| Emails automáticos (Resend) | Requiere `RESEND_API_KEY` + deploy de Edge Functions |
| App móvil nativa Expo (portero) | Requiere setup Expo/EAS, builds, distribución |
| Inducción digital (video + cuestionario) | Requiere hosting de video y diseño UX |
| Cron nocturnos (vencimientos, no salieron, keep-alive) | Requiere `supabase functions deploy` desde CLI |
| Tests E2E Playwright + Maestro | Tiempo extra de QA |
| WhatsApp notifications (fase 2) | Costo variable |

## Cómo probar el MVP en producción

### 1. Crear un usuario admin

Ve a https://supabase.com/dashboard → proyecto `ControlCenfer` → **Authentication → Users → "Add user"**:
- Email y contraseña a tu gusto. Marca "Auto Confirm User".

Luego ve a **SQL Editor** y ejecuta (reemplazando el UUID por el ID del usuario que acabas de crear, lo ves en la lista de users):

```sql
insert into profiles (id, nombre, apellido, rol)
values ('<UUID-del-usuario>', 'Admin', 'Cenfer', 'super_admin');
```

### 2. Probar el flujo completo

Login en https://control-cenfer.vercel.app/login con tu usuario admin.

**Paso 1 — Configurar catálogos:**
- `/dashboard/admin/catalogos/actividades` → crea "Montaje stand" (riesgo medio), "Mantenimiento eléctrico" (alto), "Aseo" (bajo).
- `/dashboard/admin/catalogos/areas` → crea "Pabellón A", "Pabellón B".
- `/dashboard/admin/catalogos/porterias` → crea "Portería Norte", "Portería Sur".

**Paso 2 — Crear empresa contratista:**
- `/dashboard/empresas/nueva` → NIT, razón social, contacto (puedes usar tu propio email como contacto).

**Paso 3 — Crear solicitud:**
- `/dashboard/solicitudes/nueva` → llena el formulario, guarda.
- En la pantalla de detalle de la solicitud aparece un **link público** copiable.

**Paso 4 — Probar el portal público (puede ser en navegador incógnito):**
- Pega el link `/empresa/{token}`.
- Agrega 1-2 personas (cédula, nombre, apellido).
- Sube documentos (PDFs/JPGs ≤ 2 MB) para cada uno: cédula, ARL, EPS, PILA, foto, inducción.
- Click **"Enviar a SST"** → la solicitud pasa a `en_revision_sst`.

**Paso 5 — Revisión SST (puedes seguir como admin, o crea un usuario rol `sst`):**
- `/dashboard/sst/bandeja` → entra a la solicitud.
- Por cada documento click **"Ver archivo"** (abre signed URL), luego **Aprobar** o **Rechazar con motivo**.
- Cuando todos los documentos de una persona están aprobados, la persona pasa a `aprobada` automáticamente.
- Click **"Aprobar solicitud"** → la solicitud pasa a `aprobada` o `vigente` (si la fecha ya empezó) y se generan los QR.

**Paso 6 — Ver credencial:**
- Vuelve al detalle de la solicitud en `/dashboard/solicitudes/{id}` o entra al portal `/empresa/{token}` — verás que las personas tienen estado `aprobada`.
- Para ver la credencial real abre `/credencial/{qr_code}` (cualquiera con el QR puede verla; para encontrar el qr_code, en SQL Editor: `select qr_code from request_people where person_id = '...'`).

**Paso 7 — Portería:**
- `/dashboard/porteria` → selecciona la portería.
- `/dashboard/porteria/check` → ingresa la cédula → click **"Verificar para ENTRADA"** → aparece tarjeta verde → click **"Registrar ENTRADA"**.
- `/dashboard/porteria/dentro` → ahora la persona aparece en la lista.

**Paso 8 — Reportes:**
- `/dashboard/reportes` → explora cada uno.

### 3. Crear otros usuarios con roles distintos

Mismo proceso del paso 1, cambiando el rol al insertar en `profiles`:

```sql
-- Para SST
insert into profiles (id, nombre, apellido, rol) values ('<uuid>', 'Juan', 'SST', 'sst');

-- Para Recepción
insert into profiles (id, nombre, apellido, rol) values ('<uuid>', 'María', 'Recepcion', 'recepcion');

-- Para Portero
insert into profiles (id, nombre, apellido, rol) values ('<uuid>', 'Pedro', 'Portero', 'portero');

-- Para Empresa contratista (asociar con una empresa)
insert into profiles (id, nombre, apellido, rol) values ('<uuid>', 'Contacto', 'Empresa', 'empresa');
insert into company_users (user_id, company_id) values ('<uuid>', '<company_id>');
```

## Desarrollo local

Prerrequisitos: Node 20+, pnpm 9+.

```bash
pnpm install
pnpm --filter @cenfer/web dev   # http://localhost:3000
```

Variables de entorno (en `apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://xihkwvcxodhsoetjppqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Estructura del repositorio

- `apps/web` — Next.js 14 (App Router) con Tailwind.
- `apps/mobile` — Expo (pendiente).
- `packages/shared` — Tipos, dominio puro, Zod schemas (`Role`, `Profile`, `Activity`, `Area`, `Company`, `AccessRequest`, `Person`, `canSubmitRequest`).
- `packages/supabase` — Cliente Supabase tipado.
- `supabase/migrations/` — 12 migraciones SQL versionadas.

## Migraciones aplicadas (Supabase Cloud)

| Versión | Nombre |
|---|---|
| 20260527013829 | init |
| 20260527013854 | fix_rls_recursion |
| 20260527020821 | catalogs |
| 20260527020836 | companies |
| 20260527022605 | access_requests |
| 20260527022625 | access_requests_rls |
| 20260527022637 | get_request_by_token |
| 20260527030000 | storage_buckets |
| 20260527031000 | public_portal_rpc |
| 20260527040000 | sst_review_triggers |
| 20260527050000 | access_events |
| 20260527060000 | reporting_views |

## Comandos útiles

```bash
pnpm typecheck                    # typecheck todos los paquetes
pnpm lint                         # lint
pnpm test                         # vitest (25+ tests)
pnpm --filter @cenfer/web dev     # solo web
pnpm --filter @cenfer/web build   # build web
vercel deploy --prod              # deploy manual a Vercel
```

## Aplicar nuevas migraciones

Vía CLI:
```bash
supabase link --project-ref xihkwvcxodhsoetjppqw
supabase db push
```

Vía MCP (usado durante desarrollo): `apply_migration` del servidor Supabase MCP con `project_id: xihkwvcxodhsoetjppqw`.

## Próximos pasos sugeridos

1. **Probar el flujo extremo a extremo** con datos reales (1 hora).
2. **Decidir si seguimos** con: emails automáticos, app móvil nativa, o inducción digital.
3. **Habeas Data**: agregar política de privacidad y checkbox de consentimiento en el portal público.
4. **E2E con Playwright** para los flujos críticos.
5. **Backup semanal** automático via Edge Function (importante para evitar pérdida de evidencia legal).
