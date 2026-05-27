# Control Cenfer

Sistema de control de acceso al recinto ferial Cenfer.

Ver el diseño completo en [docs/superpowers/specs/2026-05-26-control-cenfer-design.md](docs/superpowers/specs/2026-05-26-control-cenfer-design.md) y el plan en [docs/superpowers/plans/2026-05-26-control-cenfer.md](docs/superpowers/plans/2026-05-26-control-cenfer.md).

## Desarrollo local

Prerrequisitos: Node 20+, pnpm 9+.

```bash
pnpm install
pnpm --filter @cenfer/web dev
```

Abrir http://localhost:3000.

## Estructura

- `apps/web` — Next.js (Admin, SST, Recepción, Empresa, Persona)
- `apps/mobile` — Expo (Portero) — pendiente Fase 4
- `packages/shared` — Dominio puro + Zod
- `packages/supabase` — Cliente tipado
- `packages/ui` — Componentes UI compartidos — pendiente
- `supabase/` — Migraciones SQL + Edge Functions

## Entornos

| Entorno | URL |
|---|---|
| Producción | https://control-cenfer.vercel.app |
| Supabase | https://xihkwvcxodhsoetjppqw.supabase.co (project `ControlCenfer`) |
| Repo | https://github.com/jodarose/control-cenfer |

## Deploy

Push a `main` dispara auto-deploy en Vercel (proyecto `control-cenfer`, Root Directory `apps/web`).

Deploy manual desde local:

```bash
vercel deploy --prod
```

Variables de entorno (configuradas en Vercel para Production y Development):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Comandos útiles

```bash
pnpm typecheck         # typecheck todos los paquetes
pnpm lint              # lint
pnpm test              # vitest
pnpm --filter @cenfer/web dev    # solo web
pnpm --filter @cenfer/web build  # build web
```

## Migraciones a Supabase

Las migraciones SQL viven en `supabase/migrations/` y se aplican vía:

```bash
supabase link --project-ref xihkwvcxodhsoetjppqw
supabase db push
```

O usando el MCP de Supabase para aplicar SQL directamente.
