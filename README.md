# Control Cenfer

Sistema de control de acceso al recinto ferial Cenfer.

Ver el diseño completo en [docs/superpowers/specs/2026-05-26-control-cenfer-design.md](docs/superpowers/specs/2026-05-26-control-cenfer-design.md).

## Desarrollo local

Prerrequisitos: Node 20+, pnpm 9+, Docker Desktop (para Supabase local), Expo Go en celular para mobile.

````bash
pnpm install
pnpm dev
````

## Estructura

- `apps/web` — Next.js (Admin, SST, Recepción, Empresa, Persona)
- `apps/mobile` — Expo (Portero)
- `packages/shared` — Dominio puro + Zod
- `packages/supabase` — Cliente tipado
- `packages/ui` — Componentes UI
- `supabase/` — Migraciones SQL + Edge Functions
