# Control Cenfer — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir Control Cenfer, sistema de control de acceso al recinto ferial Cenfer, con flujo completo desde solicitud → carga empresa → aprobación SST → credencial QR → validación en portería → reportes.

**Architecture:** Monorepo (pnpm + Turborepo) con `apps/web` (Next.js 14), `apps/mobile` (Expo) y `packages/shared|supabase|ui`. Backend Supabase (Postgres + Auth + Storage + Realtime + Edge Functions). Clean Architecture: dominio puro → use cases → adaptadores → infraestructura. RLS para autorización. Todo TypeScript. Hosting 100% en planes gratuitos (Vercel Hobby + Supabase Free + Resend Free).

**Tech Stack:** TypeScript · Next.js 14 (App Router) · React 18 · Tailwind · shadcn/ui · TanStack Query · Zustand · Zod · Expo (React Native) · expo-camera · expo-secure-store · Supabase · Postgres · Vitest · Playwright · Maestro · pgTAP · GitHub Actions · Resend · Sentry.

**Convenciones de commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`. Cada paso "Commit" usa esta convención.

**Convención de tests:** TDD estricto donde aplique — primero el test que falla, luego el código que lo hace pasar. Para scaffolding (configuración, instalación) no aplica TDD.

**Referencias al spec:** ver [docs/superpowers/specs/2026-05-26-control-cenfer-design.md](../specs/2026-05-26-control-cenfer-design.md).

---

## Estructura final del repositorio

```
control-cenfer/
├── apps/
│   ├── web/                 Next.js — Admin/SST/Recepción/Empresa/Persona
│   │   ├── src/
│   │   │   ├── app/         App Router routes
│   │   │   ├── components/  React components
│   │   │   ├── adapters/    Repositorios Supabase, controladores
│   │   │   └── infrastructure/  Cliente Supabase, integraciones
│   │   ├── tests/           Unit + integration
│   │   ├── e2e/             Playwright
│   │   └── package.json
│   └── mobile/              Expo — Portero
│       ├── src/
│       ├── app/             Expo Router
│       ├── tests/
│       └── package.json
├── packages/
│   ├── shared/              Tipos, Zod, dominio puro
│   │   ├── src/
│   │   │   ├── domain/      Entidades + reglas de negocio
│   │   │   ├── use-cases/   Casos de uso
│   │   │   └── schemas/     Zod schemas
│   │   └── tests/
│   ├── supabase/            Cliente tipado + tipos generados
│   │   └── src/
│   └── ui/                  Componentes UI compartidos (shadcn extendido)
├── supabase/
│   ├── migrations/          *.sql versionados
│   ├── functions/           Edge Functions (Deno)
│   ├── tests/               pgTAP
│   ├── config.toml
│   └── seed.sql
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

# FASE 0 — Cimientos

Objetivo: monorepo con auth, los 6 roles definidos, RLS base, CI verde, primer despliegue a Vercel + Supabase Cloud.

## Task 0.1: Inicializar repositorio y monorepo

**Files:**
- Create: `/Users/joserojas/CODE/Proyecto/ControlCenfer/.gitignore`
- Create: `/Users/joserojas/CODE/Proyecto/ControlCenfer/package.json`
- Create: `/Users/joserojas/CODE/Proyecto/ControlCenfer/pnpm-workspace.yaml`
- Create: `/Users/joserojas/CODE/Proyecto/ControlCenfer/turbo.json`
- Create: `/Users/joserojas/CODE/Proyecto/ControlCenfer/README.md`

- [ ] **Step 1: Inicializar git**

```bash
cd /Users/joserojas/CODE/Proyecto/ControlCenfer
git init -b main
```

- [ ] **Step 2: Crear `.gitignore`**

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
.expo/
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env*.local

# Supabase
.branches
.temp

# IDE
.vscode/
.idea/
*.swp
.DS_Store

# Test outputs
coverage/
playwright-report/
test-results/

# Brainstorm artifacts (kept locally)
.superpowers/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Misc
.turbo
```

- [ ] **Step 3: Crear `package.json` raíz**

```json
{
  "name": "control-cenfer",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.7.0",
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 4: Crear `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 5: Crear `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 6: Crear `README.md`**

```markdown
# Control Cenfer

Sistema de control de acceso al recinto ferial Cenfer.

Ver el diseño completo en [docs/superpowers/specs/2026-05-26-control-cenfer-design.md](docs/superpowers/specs/2026-05-26-control-cenfer-design.md).

## Desarrollo local

Prerrequisitos: Node 20+, pnpm 9+, Docker Desktop (para Supabase local), Expo Go en celular para mobile.

```bash
pnpm install
pnpm dev
```

## Estructura

- `apps/web` — Next.js (Admin, SST, Recepción, Empresa, Persona)
- `apps/mobile` — Expo (Portero)
- `packages/shared` — Dominio puro + Zod
- `packages/supabase` — Cliente tipado
- `packages/ui` — Componentes UI
- `supabase/` — Migraciones SQL + Edge Functions
```

- [ ] **Step 7: Instalar dependencias raíz**

```bash
pnpm install
```

Expected: instala turbo, prettier, typescript.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: initialize monorepo with pnpm workspaces and turborepo"
```

---

## Task 0.2: Configurar TypeScript y Prettier base

**Files:**
- Create: `tsconfig.base.json`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: Crear `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "exclude": ["node_modules", "dist", ".next", ".expo"]
}
```

- [ ] **Step 2: Crear `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

- [ ] **Step 3: Crear `.prettierignore`**

```
node_modules
.next
.expo
dist
build
coverage
pnpm-lock.yaml
.superpowers
```

- [ ] **Step 4: Commit**

```bash
git add tsconfig.base.json .prettierrc.json .prettierignore
git commit -m "chore: add base TypeScript and Prettier config"
```

---

## Task 0.3: Crear paquete `shared` (dominio puro + Zod)

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/domain/roles.ts`
- Create: `packages/shared/src/schemas/profile.ts`
- Create: `packages/shared/tests/roles.test.ts`
- Create: `packages/shared/vitest.config.ts`

- [ ] **Step 1: Crear `packages/shared/package.json`**

```json
{
  "name": "@cenfer/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Crear `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Crear `packages/shared/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
  },
});
```

- [ ] **Step 4: Escribir test que falla — `packages/shared/tests/roles.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { Role, isAdminRole, ALL_ROLES } from '../src/domain/roles';

describe('roles', () => {
  it('exposes all 6 roles', () => {
    expect(ALL_ROLES).toEqual([
      'super_admin',
      'sst',
      'recepcion',
      'empresa',
      'portero',
      'persona',
    ]);
  });

  it('identifies admin roles', () => {
    expect(isAdminRole('super_admin')).toBe(true);
    expect(isAdminRole('sst')).toBe(false);
    expect(isAdminRole('empresa')).toBe(false);
  });
});
```

- [ ] **Step 5: Correr test y confirmar que falla**

```bash
pnpm --filter @cenfer/shared install
pnpm --filter @cenfer/shared test
```

Expected: FAIL — cannot find module `../src/domain/roles`.

- [ ] **Step 6: Crear `packages/shared/src/domain/roles.ts`**

```ts
export const ALL_ROLES = [
  'super_admin',
  'sst',
  'recepcion',
  'empresa',
  'portero',
  'persona',
] as const;

export type Role = (typeof ALL_ROLES)[number];

export function isAdminRole(role: Role): boolean {
  return role === 'super_admin';
}
```

- [ ] **Step 7: Crear `packages/shared/src/schemas/profile.ts`**

```ts
import { z } from 'zod';
import { ALL_ROLES } from '../domain/roles';

export const RoleSchema = z.enum(ALL_ROLES);

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  telefono: z.string().regex(/^\+?[\d\s-]{7,15}$/).optional(),
  rol: RoleSchema,
});

export type Profile = z.infer<typeof ProfileSchema>;
```

- [ ] **Step 8: Crear `packages/shared/src/index.ts`**

```ts
export * from './domain/roles';
export * from './schemas/profile';
```

- [ ] **Step 9: Correr test, debe pasar**

```bash
pnpm --filter @cenfer/shared test
pnpm --filter @cenfer/shared typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add Role domain type and Profile Zod schema"
```

---

## Task 0.4: Inicializar Supabase local

**Files:**
- Create: `supabase/config.toml` (generado)
- Create: `supabase/migrations/00000000000000_init.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Instalar Supabase CLI (si no está)**

```bash
brew install supabase/tap/supabase
supabase --version
```

Expected: imprime versión ≥ 1.190.

- [ ] **Step 2: Inicializar proyecto Supabase**

```bash
cd /Users/joserojas/CODE/Proyecto/ControlCenfer
supabase init
```

Expected: crea `supabase/config.toml`.

- [ ] **Step 3: Arrancar Supabase local (requiere Docker)**

```bash
supabase start
```

Expected: imprime URLs `API URL`, `DB URL`, `Studio URL`, `JWT secret`, `anon key`, `service_role key`. Guardar estos valores.

- [ ] **Step 4: Crear primera migración — `supabase/migrations/00000000000000_init.sql`**

```sql
-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enum de roles
create type role as enum (
  'super_admin',
  'sst',
  'recepcion',
  'empresa',
  'portero',
  'persona'
);

-- Tabla profiles (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  telefono text,
  rol role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at automático
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- RLS profiles
alter table profiles enable row level security;

create policy "profiles_select_self_or_admin"
  on profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.rol = 'super_admin'
    )
  );

create policy "profiles_insert_self"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self_or_admin"
  on profiles for update
  using (
    auth.uid() = id
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.rol = 'super_admin'
    )
  );

-- Función helper: obtener rol del usuario actual
create or replace function current_user_role()
returns role
language sql
stable
as $$
  select rol from profiles where id = auth.uid();
$$;
```

- [ ] **Step 5: Aplicar migración**

```bash
supabase db reset
```

Expected: corre la migración sin errores; muestra `Finished supabase db reset`.

- [ ] **Step 6: Crear seed mínimo — `supabase/seed.sql`**

```sql
-- Crear usuarios de prueba (uno por cada rol)
-- Usa el dashboard local para crear los auth.users manualmente en Studio
-- (http://localhost:54323) o vía supabase auth admin
-- Este seed solo prepara perfiles para usuarios que ya existan.

-- Catálogo inicial de actividades (se llena en Fase 1, dejamos placeholder)
-- (vacío por ahora)
```

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat(supabase): initialize local stack with profiles table and roles enum"
```

---

## Task 0.5: Paquete `@cenfer/supabase` — cliente tipado

**Files:**
- Create: `packages/supabase/package.json`
- Create: `packages/supabase/tsconfig.json`
- Create: `packages/supabase/src/index.ts`
- Create: `packages/supabase/src/types.ts` (generado por CLI)
- Create: `packages/supabase/src/client.ts`
- Create: `packages/supabase/src/server.ts`

- [ ] **Step 1: Crear `packages/supabase/package.json`**

```json
{
  "name": "@cenfer/supabase",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "gen:types": "supabase gen types typescript --local > src/types.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Crear `packages/supabase/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Generar tipos desde la BD local**

```bash
cd /Users/joserojas/CODE/Proyecto/ControlCenfer
pnpm install
pnpm --filter @cenfer/supabase exec supabase gen types typescript --local > packages/supabase/src/types.ts
```

Expected: archivo `types.ts` con `export type Database = { public: { Tables: { profiles: ... } } }`.

- [ ] **Step 4: Crear `packages/supabase/src/client.ts` (browser)**

```ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createSupabaseBrowserClient(url: string, anonKey: string) {
  return createBrowserClient<Database>(url, anonKey);
}
```

- [ ] **Step 5: Crear `packages/supabase/src/server.ts` (Next.js server)**

```ts
import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';

export function createSupabaseServerClient(
  url: string,
  anonKey: string,
  cookies: {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, options: Record<string, unknown>) => void;
    remove: (name: string, options: Record<string, unknown>) => void;
  },
) {
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get: cookies.get,
      set: cookies.set,
      remove: cookies.remove,
    },
  });
}
```

- [ ] **Step 6: Crear `packages/supabase/src/index.ts`**

```ts
export * from './client';
export * from './server';
export type { Database } from './types';
```

- [ ] **Step 7: Verificar typecheck**

```bash
pnpm --filter @cenfer/supabase typecheck
```

Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add packages/supabase pnpm-lock.yaml
git commit -m "feat(supabase): add typed client package for browser and server"
```

---

## Task 0.6: Crear `apps/web` con Next.js + auth

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/middleware.ts`
- Create: `apps/web/.env.local.example`

- [ ] **Step 1: Crear `apps/web/package.json`**

```json
{
  "name": "@cenfer/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cenfer/shared": "workspace:*",
    "@cenfer/supabase": "workspace:*",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.0",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Crear `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "noEmit": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts", "middleware.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Crear `apps/web/next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cenfer/shared', '@cenfer/supabase', '@cenfer/ui'],
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
};
export default nextConfig;
```

- [ ] **Step 4: Crear `apps/web/tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Crear `apps/web/postcss.config.mjs`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 6: Crear `apps/web/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Crear `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copiar de supabase status>
SUPABASE_SERVICE_ROLE_KEY=<copiar de supabase status, solo server>
QR_HMAC_SECRET=<generar con: openssl rand -base64 32>
RESEND_API_KEY=<vacío en local>
```

Copiar a `.env.local` y rellenar:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

- [ ] **Step 8: Crear `apps/web/src/lib/supabase/client.ts`**

```ts
import { createSupabaseBrowserClient } from '@cenfer/supabase';

export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 9: Crear `apps/web/src/lib/supabase/server.ts`**

```ts
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@cenfer/supabase';

export function createClient() {
  const cookieStore = cookies();
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component contexts no permiten set
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {}
      },
    },
  );
}
```

- [ ] **Step 10: Crear `apps/web/middleware.ts` (protege rutas autenticadas)**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/empresa/') || request.nextUrl.pathname === '/';

  if (!user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 11: Crear `apps/web/src/app/layout.tsx`**

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control Cenfer',
  description: 'Sistema de control de acceso al recinto ferial Cenfer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 12: Crear `apps/web/src/app/page.tsx`**

```tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Control Cenfer</h1>
      <p className="text-gray-600">Sistema de control de acceso al recinto ferial.</p>
      <Link href="/login" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Iniciar sesión
      </Link>
    </main>
  );
}
```

- [ ] **Step 13: Crear `apps/web/src/app/(auth)/login/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-4 text-xl font-semibold">Iniciar sesión</h1>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-gray-700">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 14: Instalar dependencias y correr dev**

```bash
pnpm install
pnpm --filter @cenfer/web dev
```

Abrir http://localhost:3000 → ver la landing → click "Iniciar sesión" → ver formulario.

- [ ] **Step 15: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold Next.js app with Supabase auth login"
```

---

## Task 0.7: Crear dashboard placeholder por rol

**Files:**
- Create: `apps/web/src/app/dashboard/page.tsx`
- Create: `apps/web/src/app/dashboard/layout.tsx`
- Create: `apps/web/src/lib/auth/get-user.ts`

- [ ] **Step 1: Crear `apps/web/src/lib/auth/get-user.ts`**

```ts
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Role } from '@cenfer/shared';

export async function getAuthenticatedUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, rol')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    redirect('/login');
  }

  return { user, profile: profile as { id: string; nombre: string; apellido: string; rol: Role } };
}
```

- [ ] **Step 2: Crear `apps/web/src/app/dashboard/layout.tsx`**

```tsx
import { getAuthenticatedUser } from '@/lib/auth/get-user';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getAuthenticatedUser();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Control Cenfer</span>
          <span className="text-sm text-gray-600">
            {profile.nombre} {profile.apellido} · {profile.rol}
          </span>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Crear `apps/web/src/app/dashboard/page.tsx`**

```tsx
import { getAuthenticatedUser } from '@/lib/auth/get-user';

export default async function DashboardPage() {
  const { profile } = await getAuthenticatedUser();
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Bienvenido, {profile.nombre}</h1>
      <p className="text-gray-600">Tu rol: <strong>{profile.rol}</strong></p>
      <p className="mt-4 text-sm text-gray-500">
        Las funcionalidades específicas por rol se construyen en las siguientes fases.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Probar manualmente**

1. Crear usuario via Supabase Studio (http://localhost:54323) en Authentication → Users → Add user → email + password.
2. Conectar a SQL Editor y correr:

```sql
insert into profiles (id, nombre, apellido, rol)
values ('<UUID del usuario recién creado>', 'Admin', 'Cenfer', 'super_admin');
```

3. Login en http://localhost:3000/login con ese usuario.
4. Verificar que redirige a `/dashboard` y muestra "Bienvenido, Admin · super_admin".

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/dashboard apps/web/src/lib/auth
git commit -m "feat(web): add role-aware dashboard placeholder"
```

---

## Task 0.8: Configurar Vitest + ESLint en web

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/.eslintrc.json`
- Create: `apps/web/tests/lib/auth.test.ts`

- [ ] **Step 1: Agregar Vitest a `apps/web/package.json` devDependencies**

```bash
pnpm --filter @cenfer/web add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Y agregar script `"test": "vitest run"` en `scripts`.

- [ ] **Step 2: Crear `apps/web/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
```

- [ ] **Step 3: Crear `apps/web/.eslintrc.json`**

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-html-link-for-pages": "off"
  }
}
```

- [ ] **Step 4: Smoke test — `apps/web/tests/lib/auth.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { ALL_ROLES } from '@cenfer/shared';

describe('roles wiring', () => {
  it('shared package exposes roles to web app', () => {
    expect(ALL_ROLES).toContain('super_admin');
  });
});
```

- [ ] **Step 5: Correr**

```bash
pnpm --filter @cenfer/web test
pnpm --filter @cenfer/web lint
pnpm --filter @cenfer/web typecheck
```

Expected: todos pasan.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "chore(web): add vitest, eslint and smoke test"
```

---

## Task 0.9: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Crear `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9.7.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, typecheck and tests"
```

---

## Task 0.10: Crear proyecto Supabase Cloud (staging) y desplegar a Vercel

**Files:** (manual + variables de entorno en Vercel)

- [ ] **Step 1: Crear proyecto en Supabase Cloud**

Ir a https://supabase.com/dashboard → New project → nombre `control-cenfer-staging` → región `us-east-1` o más cercana → plan Free. Anotar URL y anon key.

- [ ] **Step 2: Link al proyecto remoto y push migración**

```bash
supabase login
supabase link --project-ref <ref-del-proyecto>
supabase db push
```

Expected: aplica la migración `00000000000000_init.sql` en la BD remota.

- [ ] **Step 3: Crear repo GitHub y push**

```bash
gh repo create control-cenfer --private --source=. --remote=origin --push
```

- [ ] **Step 4: Crear proyecto Vercel**

```bash
cd apps/web
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add QR_HMAC_SECRET
```

(Configurar las tres variables apuntando al Supabase Cloud staging.)

- [ ] **Step 5: Primer deploy**

```bash
npx vercel deploy
```

Expected: URL de preview funcional. Probar login con usuario creado en Supabase Cloud.

- [ ] **Step 6: Documentar URLs en README**

```bash
# Editar README.md y agregar sección "Entornos"
```

```markdown
## Entornos

- Local: http://localhost:3000
- Staging: https://control-cenfer-staging.vercel.app
- Producción: TBD (al cierre de Fase 8)
```

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: document deployment environments"
git push
```

**Fin Fase 0.** Software vivo: login funcional, BD con roles, CI en GitHub, deploy en Vercel + Supabase Cloud.

---

# FASE 1 — Catálogos y empresas

Objetivo: CRUD de actividades, áreas, niveles de riesgo, document types y empresas contratistas. Bandeja básica de admin.

## Task 1.1: Migración — tablas de catálogos

**Files:**
- Create: `supabase/migrations/00000000000001_catalogs.sql`

- [ ] **Step 1: Crear migración**

```sql
-- Niveles de riesgo
create type risk_level as enum ('bajo', 'medio', 'alto');

-- Tipos de documento
create type document_type_key as enum (
  'cedula', 'arl', 'eps', 'pila', 'foto',
  'induccion', 'alturas', 'examen_medico'
);

create table document_types (
  key document_type_key primary key,
  nombre text not null,
  requiere_vencimiento boolean not null default true,
  meses_vigencia_default integer,
  created_at timestamptz not null default now()
);

-- Actividades
create table activities (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  nivel_riesgo_default risk_level not null,
  documentos_requeridos document_type_key[] not null default '{}',
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_activities_updated_at
  before update on activities
  for each row execute function set_updated_at();

-- Áreas
create table areas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  descripcion text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_areas_updated_at
  before update on areas
  for each row execute function set_updated_at();

-- Porterías
create table porterias (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  ubicacion text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS: lectura para usuarios autenticados, escritura solo admin
alter table document_types enable row level security;
alter table activities enable row level security;
alter table areas enable row level security;
alter table porterias enable row level security;

create policy "catalogs_read_authenticated"
  on document_types for select using (auth.uid() is not null);
create policy "catalogs_write_admin"
  on document_types for all using (current_user_role() = 'super_admin');

create policy "activities_read_authenticated"
  on activities for select using (auth.uid() is not null);
create policy "activities_write_admin"
  on activities for all using (current_user_role() = 'super_admin');

create policy "areas_read_authenticated"
  on areas for select using (auth.uid() is not null);
create policy "areas_write_admin"
  on areas for all using (current_user_role() = 'super_admin');

create policy "porterias_read_authenticated"
  on porterias for select using (auth.uid() is not null);
create policy "porterias_write_admin"
  on porterias for all using (current_user_role() = 'super_admin');

-- Seed inicial de document_types
insert into document_types (key, nombre, requiere_vencimiento, meses_vigencia_default) values
  ('cedula', 'Cédula', false, null),
  ('arl', 'ARL', true, 1),
  ('eps', 'EPS', true, 1),
  ('pila', 'Planilla PILA', true, 1),
  ('foto', 'Foto', false, null),
  ('induccion', 'Inducción SST', true, 12),
  ('alturas', 'Curso de alturas', true, 12),
  ('examen_medico', 'Examen médico ocupacional', true, 12);
```

- [ ] **Step 2: Aplicar y regenerar tipos**

```bash
supabase db reset
pnpm --filter @cenfer/supabase exec supabase gen types typescript --local > packages/supabase/src/types.ts
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations packages/supabase/src/types.ts
git commit -m "feat(db): add catalogs (activities, areas, porterias, document_types) with RLS"
```

---

## Task 1.2: Migración — empresas contratistas

**Files:**
- Create: `supabase/migrations/00000000000002_companies.sql`

- [ ] **Step 1: Crear migración**

```sql
create table companies (
  id uuid primary key default uuid_generate_v4(),
  nit text not null unique,
  razon_social text not null,
  contacto_nombre text not null,
  contacto_email text not null,
  contacto_telefono text,
  documentos_legales jsonb not null default '{}'::jsonb,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_nit_idx on companies(nit);
create index companies_razon_social_trgm_idx on companies using gin (razon_social gin_trgm_ops);
create extension if not exists pg_trgm;

create trigger set_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- Vincula auth.users con companies (un usuario "empresa" tiene 1 company)
create table company_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index company_users_company_idx on company_users(company_id);

-- RLS companies
alter table companies enable row level security;

create policy "companies_select_admin_sst_recepcion"
  on companies for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "companies_select_own"
  on companies for select
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = companies.id
    )
  );

create policy "companies_write_recepcion_admin"
  on companies for all
  using (current_user_role() in ('super_admin', 'recepcion'));

alter table company_users enable row level security;

create policy "company_users_select_admin"
  on company_users for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion') or user_id = auth.uid());

create policy "company_users_write_admin"
  on company_users for all
  using (current_user_role() in ('super_admin', 'recepcion'));
```

- [ ] **Step 2: Aplicar y regenerar tipos**

```bash
supabase db reset
pnpm --filter @cenfer/supabase exec supabase gen types typescript --local > packages/supabase/src/types.ts
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations packages/supabase/src/types.ts
git commit -m "feat(db): add companies and company_users with RLS"
```

---

## Task 1.3: Test pgTAP de RLS para catálogos y empresas

**Files:**
- Create: `supabase/tests/rls_catalogs.sql`

- [ ] **Step 1: Habilitar pgTAP**

```sql
-- En una nueva migración o ejecutar en SQL editor:
create extension if not exists pgtap with schema extensions;
```

(Agregar `create extension if not exists pgtap` al inicio de la migración 00000000000001 si no estaba.)

- [ ] **Step 2: Crear `supabase/tests/rls_catalogs.sql`**

```sql
begin;
select plan(4);

-- Setup: simular usuario empresa
set local role authenticated;
set local "request.jwt.claim.sub" to '00000000-0000-0000-0000-000000000001';

-- 1) Una empresa NO puede ver activities? Sí puede (catalogs_read_authenticated).
select lives_ok(
  $$ select * from activities limit 1 $$,
  'empresa puede leer activities'
);

-- 2) Una empresa NO puede insertar activities.
select throws_ok(
  $$ insert into activities (nombre, nivel_riesgo_default) values ('test', 'bajo') $$,
  '42501',
  'new row violates row-level security policy for table "activities"',
  'empresa no puede insertar activities'
);

-- 3) admin puede insertar.
set local "request.jwt.claim.sub" to '00000000-0000-0000-0000-000000000099';
-- (necesita perfil admin existente; este test asume seed)
select lives_ok(
  $$ insert into activities (nombre, nivel_riesgo_default) values ('test-rls', 'bajo') $$,
  'admin puede insertar activities'
);

-- 4) Cleanup
select lives_ok(
  $$ delete from activities where nombre = 'test-rls' $$,
  'cleanup'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Correr el test**

```bash
supabase db test
```

(Si no funciona el comando, ejecutar con `psql` directamente apuntando a la BD local.)

- [ ] **Step 4: Commit**

```bash
git add supabase/tests
git commit -m "test(db): add pgTAP RLS tests for catalogs"
```

---

## Task 1.4: Repositorios y casos de uso de catálogos (paquete `shared`)

**Files:**
- Create: `packages/shared/src/schemas/activity.ts`
- Create: `packages/shared/src/schemas/area.ts`
- Create: `packages/shared/src/schemas/company.ts`
- Create: `packages/shared/tests/schemas.test.ts`

- [ ] **Step 1: Test que falla — `packages/shared/tests/schemas.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { ActivitySchema, AreaSchema, CompanySchema } from '../src';

describe('schemas', () => {
  it('valida actividad con campos correctos', () => {
    const result = ActivitySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Montaje stand',
      nivel_riesgo_default: 'medio',
      documentos_requeridos: ['cedula', 'arl', 'eps'],
      activa: true,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza actividad con nivel de riesgo inválido', () => {
    const result = ActivitySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Montaje',
      nivel_riesgo_default: 'extremo',
      documentos_requeridos: [],
      activa: true,
    });
    expect(result.success).toBe(false);
  });

  it('valida empresa con NIT y email', () => {
    const result = CompanySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nit: '900123456-7',
      razon_social: 'Construcciones Acme SAS',
      contacto_nombre: 'Juan Pérez',
      contacto_email: 'juan@acme.com',
      contacto_telefono: '+57 300 1234567',
      activa: true,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza empresa con email inválido', () => {
    const result = CompanySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nit: '900123456-7',
      razon_social: 'Acme',
      contacto_nombre: 'Juan',
      contacto_email: 'no-es-email',
      activa: true,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Crear `packages/shared/src/schemas/activity.ts`**

```ts
import { z } from 'zod';

export const DocumentTypeKeySchema = z.enum([
  'cedula', 'arl', 'eps', 'pila', 'foto',
  'induccion', 'alturas', 'examen_medico',
]);

export const RiskLevelSchema = z.enum(['bajo', 'medio', 'alto']);

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(100),
  nivel_riesgo_default: RiskLevelSchema,
  documentos_requeridos: z.array(DocumentTypeKeySchema),
  activa: z.boolean(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type DocumentTypeKey = z.infer<typeof DocumentTypeKeySchema>;
```

- [ ] **Step 3: Crear `packages/shared/src/schemas/area.ts`**

```ts
import { z } from 'zod';

export const AreaSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).nullable().optional(),
  activa: z.boolean(),
});

export type Area = z.infer<typeof AreaSchema>;
```

- [ ] **Step 4: Crear `packages/shared/src/schemas/company.ts`**

```ts
import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string().uuid(),
  nit: z.string().regex(/^\d{6,12}(-\d)?$/, 'NIT inválido (formato: 900123456-7)'),
  razon_social: z.string().min(1).max(200),
  contacto_nombre: z.string().min(1).max(100),
  contacto_email: z.string().email(),
  contacto_telefono: z.string().regex(/^\+?[\d\s-]{7,15}$/).optional(),
  activa: z.boolean(),
});

export type Company = z.infer<typeof CompanySchema>;
```

- [ ] **Step 5: Actualizar `packages/shared/src/index.ts`**

```ts
export * from './domain/roles';
export * from './schemas/profile';
export * from './schemas/activity';
export * from './schemas/area';
export * from './schemas/company';
```

- [ ] **Step 6: Correr tests**

```bash
pnpm --filter @cenfer/shared test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add Zod schemas for Activity, Area and Company"
```

---

## Task 1.5: UI Admin — CRUD de catálogos

**Files:**
- Create: `apps/web/src/app/dashboard/admin/catalogos/page.tsx`
- Create: `apps/web/src/app/dashboard/admin/catalogos/actividades/page.tsx`
- Create: `apps/web/src/app/dashboard/admin/catalogos/actividades/ActivityForm.tsx`
- Create: `apps/web/src/app/dashboard/admin/areas/page.tsx`
- Create: `apps/web/src/app/dashboard/admin/porterias/page.tsx`
- Create: `apps/web/src/lib/auth/require-role.ts`

- [ ] **Step 1: Crear `apps/web/src/lib/auth/require-role.ts`**

```ts
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from './get-user';
import type { Role } from '@cenfer/shared';

export async function requireRole(allowed: Role[]) {
  const { profile, user } = await getAuthenticatedUser();
  if (!allowed.includes(profile.rol)) {
    redirect('/dashboard');
  }
  return { profile, user };
}
```

- [ ] **Step 2: Crear `apps/web/src/app/dashboard/admin/catalogos/page.tsx`**

```tsx
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';

export default async function CatalogosPage() {
  await requireRole(['super_admin']);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Catálogos</h1>
      <ul className="space-y-2">
        <li><Link className="text-blue-600 hover:underline" href="/dashboard/admin/catalogos/actividades">Actividades</Link></li>
        <li><Link className="text-blue-600 hover:underline" href="/dashboard/admin/areas">Áreas</Link></li>
        <li><Link className="text-blue-600 hover:underline" href="/dashboard/admin/porterias">Porterías</Link></li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Crear `ActivityForm.tsx`** (server action + form)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ActivitySchema, type RiskLevel, type DocumentTypeKey } from '@cenfer/shared';

const RISK_OPTIONS: RiskLevel[] = ['bajo', 'medio', 'alto'];
const DOC_OPTIONS: DocumentTypeKey[] = [
  'cedula', 'arl', 'eps', 'pila', 'foto', 'induccion', 'alturas', 'examen_medico',
];

export function ActivityForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [riesgo, setRiesgo] = useState<RiskLevel>('bajo');
  const [docs, setDocs] = useState<DocumentTypeKey[]>(['cedula', 'arl', 'eps', 'pila', 'foto', 'induccion']);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from('activities').insert({
      nombre,
      nivel_riesgo_default: riesgo,
      documentos_requeridos: docs,
      activa: true,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNombre('');
    router.refresh();
  }

  function toggleDoc(d: DocumentTypeKey) {
    setDocs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Nueva actividad</h2>
      <label className="mb-2 block">
        <span className="text-sm">Nombre</span>
        <input
          className="block w-full rounded border px-2 py-1"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </label>
      <label className="mb-2 block">
        <span className="text-sm">Nivel de riesgo</span>
        <select
          className="block w-full rounded border px-2 py-1"
          value={riesgo}
          onChange={(e) => setRiesgo(e.target.value as RiskLevel)}
        >
          {RISK_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>
      <fieldset className="mb-3">
        <legend className="text-sm">Documentos requeridos</legend>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {DOC_OPTIONS.map((d) => (
            <label key={d} className="flex items-center gap-2">
              <input type="checkbox" checked={docs.includes(d)} onChange={() => toggleDoc(d)} />
              {d}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Crear'}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Crear `apps/web/src/app/dashboard/admin/catalogos/actividades/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { ActivityForm } from './ActivityForm';

export default async function ActividadesPage() {
  await requireRole(['super_admin']);
  const supabase = createClient();
  const { data: activities } = await supabase
    .from('activities')
    .select('id, nombre, nivel_riesgo_default, documentos_requeridos, activa')
    .order('nombre');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Actividades</h1>
      <ActivityForm />
      <table className="w-full border bg-white">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Riesgo</th>
            <th className="p-2">Documentos</th>
            <th className="p-2">Activa</th>
          </tr>
        </thead>
        <tbody>
          {activities?.map((a) => (
            <tr key={a.id} className="border-b text-sm">
              <td className="p-2">{a.nombre}</td>
              <td className="p-2">{a.nivel_riesgo_default}</td>
              <td className="p-2">{a.documentos_requeridos?.join(', ')}</td>
              <td className="p-2">{a.activa ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Replicar el mismo patrón para `areas` y `porterias`**

Crear `apps/web/src/app/dashboard/admin/areas/page.tsx` y `apps/web/src/app/dashboard/admin/porterias/page.tsx` siguiendo la misma estructura que `actividades/page.tsx` (form simple + tabla). Los campos son:

- **Areas:** `nombre`, `descripcion`, `activa`.
- **Porterias:** `nombre`, `ubicacion`, `activa`.

(El AI/dev que ejecute esta tarea debe replicar el patrón sin agregar features nuevas.)

- [ ] **Step 6: Probar manualmente**

Iniciar sesión como `super_admin` → ir a `/dashboard/admin/catalogos/actividades` → crear "Montaje de stand", "Mantenimiento eléctrico", "Aseo", "Catering" → verificar que aparecen en la tabla.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src
git commit -m "feat(web): admin CRUD for activities, areas and porterias"
```

---

## Task 1.6: UI Recepción — Lista y creación de empresas

**Files:**
- Create: `apps/web/src/app/dashboard/empresas/page.tsx`
- Create: `apps/web/src/app/dashboard/empresas/nueva/page.tsx`
- Create: `apps/web/src/app/dashboard/empresas/CompanyForm.tsx`

- [ ] **Step 1: Crear `CompanyForm.tsx`** (cliente, valida con Zod)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CompanySchema } from '@cenfer/shared';

export function CompanyForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nit: '', razon_social: '', contacto_nombre: '',
    contacto_email: '', contacto_telefono: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const parsed = CompanySchema.omit({ id: true, activa: true }).safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('companies').insert({ ...parsed.data, activa: true });
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push('/dashboard/empresas');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-3 rounded border bg-white p-4">
      <label className="block">
        <span className="text-sm">NIT (formato 900123456-7)</span>
        <input className="w-full rounded border px-2 py-1" value={form.nit}
          onChange={(e) => update('nit', e.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm">Razón social</span>
        <input className="w-full rounded border px-2 py-1" value={form.razon_social}
          onChange={(e) => update('razon_social', e.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm">Contacto: nombre</span>
        <input className="w-full rounded border px-2 py-1" value={form.contacto_nombre}
          onChange={(e) => update('contacto_nombre', e.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm">Contacto: email</span>
        <input type="email" className="w-full rounded border px-2 py-1" value={form.contacto_email}
          onChange={(e) => update('contacto_email', e.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm">Contacto: teléfono</span>
        <input className="w-full rounded border px-2 py-1" value={form.contacto_telefono}
          onChange={(e) => update('contacto_telefono', e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50">
        {saving ? 'Guardando…' : 'Crear empresa'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Crear `apps/web/src/app/dashboard/empresas/page.tsx`**

```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export default async function EmpresasPage() {
  await requireRole(['super_admin', 'recepcion', 'sst']);
  const supabase = createClient();
  const { data: companies } = await supabase
    .from('companies')
    .select('id, nit, razon_social, contacto_email, activa')
    .order('razon_social');

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Empresas contratistas</h1>
        <Link href="/dashboard/empresas/nueva" className="rounded bg-blue-600 px-3 py-1.5 text-white">
          Nueva empresa
        </Link>
      </div>
      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr><th className="p-2">NIT</th><th className="p-2">Razón social</th><th className="p-2">Contacto</th><th className="p-2">Activa</th></tr>
        </thead>
        <tbody>
          {companies?.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.nit}</td>
              <td className="p-2">{c.razon_social}</td>
              <td className="p-2">{c.contacto_email}</td>
              <td className="p-2">{c.activa ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Crear `apps/web/src/app/dashboard/empresas/nueva/page.tsx`**

```tsx
import { requireRole } from '@/lib/auth/require-role';
import { CompanyForm } from '../CompanyForm';

export default async function NuevaEmpresaPage() {
  await requireRole(['super_admin', 'recepcion']);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Nueva empresa</h1>
      <CompanyForm />
    </div>
  );
}
```

- [ ] **Step 4: Probar manualmente**

- [ ] **Step 5: Commit**

```bash
git add apps/web/src
git commit -m "feat(web): companies CRUD for recepcion and admin"
```

**Fin Fase 1.**

---

# FASE 2 — Solicitudes de acceso + carga por empresa (Flujo A)

Objetivo: recepción crea solicitud, sistema genera link con token público, empresa carga personal y documentos.

## Task 2.1: Migración — solicitudes, personas, documentos

**Files:**
- Create: `supabase/migrations/00000000000003_access_requests.sql`

- [ ] **Step 1: Crear migración (estados, tablas principales)**

```sql
create type access_request_status as enum (
  'borrador', 'enviada', 'en_carga', 'en_revision_sst',
  'aprobada', 'rechazada', 'vigente', 'vencida', 'cancelada'
);

create type person_request_status as enum (
  'pendiente_docs', 'en_revision', 'aprobada', 'rechazada'
);

create type document_status as enum ('pendiente', 'aprobado', 'rechazado');

-- people: una persona física (cédula única)
create table people (
  id uuid primary key default uuid_generate_v4(),
  cedula text not null unique,
  nombre text not null,
  apellido text not null,
  telefono text,
  email text,
  eps text,
  arl text,
  cargo text,
  foto_url text,
  company_id uuid not null references companies(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_cedula_idx on people(cedula);
create index people_company_idx on people(company_id);

create trigger set_people_updated_at
  before update on people for each row execute function set_updated_at();

-- access_requests
create table access_requests (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete restrict,
  activity_id uuid not null references activities(id),
  area_id uuid references areas(id),
  fecha_desde date not null,
  fecha_hasta date not null,
  horario_inicio time not null default '06:00',
  horario_fin time not null default '20:00',
  responsable_cenfer_id uuid references auth.users(id),
  nivel_riesgo risk_level not null,
  cantidad_estimada integer not null check (cantidad_estimada > 0),
  observaciones text,
  estado access_request_status not null default 'borrador',
  public_token uuid not null default uuid_generate_v4(),
  public_token_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_hasta >= fecha_desde)
);

create unique index access_requests_token_idx on access_requests(public_token);
create index access_requests_company_idx on access_requests(company_id);
create index access_requests_estado_idx on access_requests(estado);

create trigger set_access_requests_updated_at
  before update on access_requests for each row execute function set_updated_at();

-- request_vehicles, request_tools, request_misc
create table request_vehicles (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  placa text not null,
  tipo text not null,
  conductor_person_id uuid references people(id)
);

create table request_tools (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  descripcion text not null,
  cantidad integer not null default 1,
  serial text
);

create table request_misc (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  descripcion text not null
);

-- request_people (puente)
create table request_people (
  id uuid primary key default uuid_generate_v4(),
  access_request_id uuid not null references access_requests(id) on delete cascade,
  person_id uuid not null references people(id) on delete restrict,
  estado_individual person_request_status not null default 'pendiente_docs',
  qr_code text unique,
  qr_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (access_request_id, person_id)
);

-- person_documents
create table person_documents (
  id uuid primary key default uuid_generate_v4(),
  person_id uuid not null references people(id) on delete cascade,
  document_type document_type_key not null,
  archivo_url text not null,
  fecha_emision date,
  fecha_vencimiento date,
  estado document_status not null default 'pendiente',
  revisado_por uuid references auth.users(id),
  revisado_at timestamptz,
  motivo_rechazo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index person_documents_person_type_idx on person_documents(person_id, document_type);
create index person_documents_vencimiento_idx on person_documents(fecha_vencimiento);

create trigger set_person_documents_updated_at
  before update on person_documents for each row execute function set_updated_at();
```

- [ ] **Step 2: RLS en las tablas nuevas**

(Agregar al final de la misma migración.)

```sql
-- people
alter table people enable row level security;

create policy "people_select_admin_sst_recepcion"
  on people for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "people_select_own_company"
  on people for select
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = people.company_id
    )
  );

create policy "people_write_admin_recepcion"
  on people for all
  using (current_user_role() in ('super_admin', 'recepcion'));

create policy "people_write_own_company"
  on people for all
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = people.company_id
    )
  );

-- access_requests
alter table access_requests enable row level security;

create policy "access_requests_select_admin_sst_recepcion"
  on access_requests for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "access_requests_select_own_company"
  on access_requests for select
  using (
    exists (
      select 1 from company_users cu
      where cu.user_id = auth.uid() and cu.company_id = access_requests.company_id
    )
  );

create policy "access_requests_insert_recepcion"
  on access_requests for insert
  with check (current_user_role() in ('super_admin', 'recepcion'));

create policy "access_requests_update_recepcion_sst"
  on access_requests for update
  using (current_user_role() in ('super_admin', 'recepcion', 'sst'));

-- request_vehicles/tools/misc: heredan acceso por relación con access_request
alter table request_vehicles enable row level security;
alter table request_tools enable row level security;
alter table request_misc enable row level security;

create policy "request_extras_select"
  on request_vehicles for select using (
    exists (select 1 from access_requests ar where ar.id = access_request_id)
  );
create policy "request_extras_write_admin_recepcion"
  on request_vehicles for all
  using (current_user_role() in ('super_admin', 'recepcion'));

create policy "request_tools_select"
  on request_tools for select using (
    exists (select 1 from access_requests ar where ar.id = access_request_id)
  );
create policy "request_tools_write"
  on request_tools for all using (current_user_role() in ('super_admin', 'recepcion'));

create policy "request_misc_select"
  on request_misc for select using (
    exists (select 1 from access_requests ar where ar.id = access_request_id)
  );
create policy "request_misc_write"
  on request_misc for all using (current_user_role() in ('super_admin', 'recepcion'));

-- request_people
alter table request_people enable row level security;

create policy "request_people_select_admin_sst_recepcion"
  on request_people for select
  using (current_user_role() in ('super_admin', 'sst', 'recepcion'));

create policy "request_people_select_own_company"
  on request_people for select
  using (
    exists (
      select 1 from access_requests ar
      join company_users cu on cu.company_id = ar.company_id
      where ar.id = request_people.access_request_id
        and cu.user_id = auth.uid()
    )
  );

create policy "request_people_write_company_or_admin"
  on request_people for all
  using (
    current_user_role() in ('super_admin', 'recepcion', 'sst')
    or exists (
      select 1 from access_requests ar
      join company_users cu on cu.company_id = ar.company_id
      where ar.id = request_people.access_request_id
        and cu.user_id = auth.uid()
    )
  );

-- person_documents
alter table person_documents enable row level security;

create policy "person_documents_select"
  on person_documents for select
  using (
    current_user_role() in ('super_admin', 'sst', 'recepcion')
    or exists (
      select 1 from people p
      join company_users cu on cu.company_id = p.company_id
      where p.id = person_documents.person_id and cu.user_id = auth.uid()
    )
  );

create policy "person_documents_write"
  on person_documents for all
  using (
    current_user_role() in ('super_admin', 'sst', 'recepcion')
    or exists (
      select 1 from people p
      join company_users cu on cu.company_id = p.company_id
      where p.id = person_documents.person_id and cu.user_id = auth.uid()
    )
  );
```

- [ ] **Step 3: Función `get_request_by_token` (acceso público)**

```sql
create or replace function get_request_by_token(token uuid)
returns table (
  id uuid,
  company_id uuid,
  activity_id uuid,
  area_id uuid,
  fecha_desde date,
  fecha_hasta date,
  nivel_riesgo risk_level,
  cantidad_estimada integer,
  observaciones text,
  estado access_request_status,
  public_token_expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, company_id, activity_id, area_id, fecha_desde, fecha_hasta,
         nivel_riesgo, cantidad_estimada, observaciones, estado, public_token_expires_at
  from access_requests
  where public_token = token
    and public_token_expires_at > now()
    and estado in ('enviada', 'en_carga');
$$;
```

- [ ] **Step 4: Aplicar y regenerar tipos**

```bash
supabase db reset
pnpm --filter @cenfer/supabase exec supabase gen types typescript --local > packages/supabase/src/types.ts
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations packages/supabase/src/types.ts
git commit -m "feat(db): add access_requests, people, documents and RLS"
```

---

## Task 2.2: Schemas y casos de uso para solicitudes

**Files:**
- Create: `packages/shared/src/schemas/access-request.ts`
- Create: `packages/shared/src/schemas/person.ts`
- Create: `packages/shared/src/use-cases/can-submit-request.ts`
- Create: `packages/shared/tests/access-request.test.ts`

- [ ] **Step 1: Test que falla**

```ts
import { describe, it, expect } from 'vitest';
import { AccessRequestSchema, canSubmitRequest } from '../src';

describe('access requests', () => {
  it('rechaza solicitud con fecha_hasta anterior a fecha_desde', () => {
    const result = AccessRequestSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      company_id: '00000000-0000-0000-0000-000000000002',
      activity_id: '00000000-0000-0000-0000-000000000003',
      area_id: null,
      fecha_desde: '2026-06-10',
      fecha_hasta: '2026-06-01',
      horario_inicio: '06:00',
      horario_fin: '20:00',
      nivel_riesgo: 'medio',
      cantidad_estimada: 5,
      estado: 'borrador',
    });
    expect(result.success).toBe(false);
  });

  it('canSubmitRequest exige al menos una persona aprobada', () => {
    expect(canSubmitRequest({ people: [] })).toEqual({
      ok: false, reason: 'sin_personas',
    });
    expect(canSubmitRequest({
      people: [{ estado_individual: 'pendiente_docs' }],
    })).toEqual({ ok: false, reason: 'docs_pendientes' });
    expect(canSubmitRequest({
      people: [{ estado_individual: 'aprobada' }],
    })).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Crear `packages/shared/src/schemas/access-request.ts`**

```ts
import { z } from 'zod';
import { RiskLevelSchema } from './activity';

export const AccessRequestStatusSchema = z.enum([
  'borrador', 'enviada', 'en_carga', 'en_revision_sst',
  'aprobada', 'rechazada', 'vigente', 'vencida', 'cancelada',
]);

export const AccessRequestSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  activity_id: z.string().uuid(),
  area_id: z.string().uuid().nullable(),
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  horario_fin: z.string().regex(/^\d{2}:\d{2}$/),
  nivel_riesgo: RiskLevelSchema,
  cantidad_estimada: z.number().int().positive(),
  observaciones: z.string().max(2000).optional(),
  estado: AccessRequestStatusSchema,
}).refine((d) => d.fecha_hasta >= d.fecha_desde, {
  message: 'fecha_hasta debe ser >= fecha_desde',
  path: ['fecha_hasta'],
});

export type AccessRequest = z.infer<typeof AccessRequestSchema>;
export type AccessRequestStatus = z.infer<typeof AccessRequestStatusSchema>;
```

- [ ] **Step 3: Crear `packages/shared/src/schemas/person.ts`**

```ts
import { z } from 'zod';

export const PersonSchema = z.object({
  id: z.string().uuid(),
  cedula: z.string().regex(/^\d{6,12}$/, 'Cédula debe ser 6-12 dígitos'),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  eps: z.string().optional(),
  arl: z.string().optional(),
  cargo: z.string().optional(),
  foto_url: z.string().url().nullable().optional(),
  company_id: z.string().uuid(),
});
export type Person = z.infer<typeof PersonSchema>;
```

- [ ] **Step 4: Crear `packages/shared/src/use-cases/can-submit-request.ts`**

```ts
type PersonStatus = 'pendiente_docs' | 'en_revision' | 'aprobada' | 'rechazada';

export function canSubmitRequest(input: {
  people: { estado_individual: PersonStatus }[];
}): { ok: true } | { ok: false; reason: 'sin_personas' | 'docs_pendientes' } {
  if (input.people.length === 0) return { ok: false, reason: 'sin_personas' };
  const allOk = input.people.every(
    (p) => p.estado_individual === 'aprobada' || p.estado_individual === 'en_revision',
  );
  if (!allOk) return { ok: false, reason: 'docs_pendientes' };
  return { ok: true };
}
```

- [ ] **Step 5: Actualizar `packages/shared/src/index.ts`**

Agregar:
```ts
export * from './schemas/access-request';
export * from './schemas/person';
export * from './use-cases/can-submit-request';
```

- [ ] **Step 6: Correr tests**

```bash
pnpm --filter @cenfer/shared test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): schemas and use cases for access requests and people"
```

---

## Task 2.3: UI recepción — crear solicitud y enviar link

**Files:**
- Create: `apps/web/src/app/dashboard/solicitudes/page.tsx`
- Create: `apps/web/src/app/dashboard/solicitudes/nueva/page.tsx`
- Create: `apps/web/src/app/dashboard/solicitudes/nueva/RequestForm.tsx`
- Create: `apps/web/src/app/dashboard/solicitudes/[id]/page.tsx`
- Create: `supabase/functions/send-invitation/index.ts` (Edge Function de email)

Por brevedad y dado que el patrón es idéntico al `CompanyForm`/`ActivityForm` ya escrito en Fase 1 (formulario controlado → Zod parse → insert vía Supabase → redirect), implementa:

- [ ] **Step 1: `RequestForm.tsx`** — formulario con campos: empresa (select que carga companies), activity (select), area (select), fecha_desde, fecha_hasta, horario_inicio, horario_fin, nivel_riesgo, cantidad_estimada, observaciones. Al guardar, calcula `public_token_expires_at = fecha_hasta + 7 días` y crea con `estado: 'enviada'`. Luego llama a `/api/send-invitation` con el ID de la solicitud.

- [ ] **Step 2: `solicitudes/page.tsx`** — tabla de solicitudes filtrada por rol (recepción ve las suyas; empresa ve las suyas; sst ve todas).

- [ ] **Step 3: `solicitudes/[id]/page.tsx`** — detalle: muestra solicitud, link de invitación copiable, lista de personas asignadas, vehículos/herramientas/misc.

- [ ] **Step 4: Edge Function `send-invitation`**

```ts
// supabase/functions/send-invitation/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PUBLIC_BASE_URL = Deno.env.get('PUBLIC_BASE_URL') ?? 'http://localhost:3000';

serve(async (req) => {
  const { request_id } = await req.json();
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: req_data, error } = await supabase
    .from('access_requests')
    .select('id, public_token, public_token_expires_at, company_id, companies(razon_social, contacto_email, contacto_nombre)')
    .eq('id', request_id)
    .single();

  if (error || !req_data) return new Response('not found', { status: 404 });

  const link = `${PUBLIC_BASE_URL}/empresa/${req_data.public_token}`;
  // @ts-expect-error - relación anidada
  const email = req_data.companies.contacto_email;
  // @ts-expect-error
  const nombre = req_data.companies.contacto_nombre;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Control Cenfer <noreply@controlcenfer.com>',
      to: email,
      subject: 'Invitación de acceso al recinto Cenfer',
      html: `<p>Hola ${nombre},</p>
        <p>Has recibido una invitación para gestionar el acceso de tu personal al recinto ferial Cenfer.</p>
        <p>Carga tu lista de personal y documentos aquí (link válido hasta ${req_data.public_token_expires_at}):</p>
        <p><a href="${link}">${link}</a></p>`,
    }),
  });

  if (!r.ok) {
    return new Response(JSON.stringify({ error: await r.text() }), { status: 500 });
  }
  return new Response(JSON.stringify({ sent: true }), { status: 200 });
});
```

- [ ] **Step 5: Probar el flujo manualmente**

Como recepción: crear empresa → crear solicitud → recibir email (en dev, ver consola de Resend o usar dominio sandbox).

- [ ] **Step 6: Commit**

```bash
git add apps/web supabase/functions
git commit -m "feat: recepcion creates access request and sends invitation email"
```

---

## Task 2.4: Portal público de empresa (link con token)

**Files:**
- Create: `apps/web/src/app/empresa/[token]/page.tsx`
- Create: `apps/web/src/app/empresa/[token]/PeopleManager.tsx`
- Create: `apps/web/src/app/empresa/[token]/PersonForm.tsx`
- Create: `apps/web/src/app/empresa/[token]/DocumentUpload.tsx`

- [ ] **Step 1: `apps/web/src/app/empresa/[token]/page.tsx`** — server component que llama a la función `get_request_by_token`, valida que la solicitud existe y está activa, y renderiza `<PeopleManager />` pasándole la data.

- [ ] **Step 2: `PeopleManager.tsx`** (cliente) — lista de personas ya agregadas a la solicitud, botón "agregar persona". Por cada persona muestra cédula/nombre, estado, y los documentos requeridos según `documentos_requeridos` de la actividad. Permite subir cada documento.

- [ ] **Step 3: `PersonForm.tsx`** — formulario simple para agregar persona (cédula, nombre, apellido, email, teléfono, cargo). Al guardar:
  1. Busca persona por cédula. Si existe en otra empresa → muestra alerta.
  2. Si no existe → crea `people` con `company_id` de la solicitud.
  3. Crea `request_people` con estado `pendiente_docs`.

- [ ] **Step 4: `DocumentUpload.tsx`** — input file, comprime imágenes en cliente (usando `browser-image-compression` ≤ 300 KB para fotos), valida tamaño ≤ 2 MB, sube a Supabase Storage bucket `documentos` en path `{person_id}/{document_type}-{timestamp}.{ext}`. Crea/actualiza `person_documents` con `archivo_url` y `estado: 'pendiente'`. Si `requiere_vencimiento`, exige `fecha_vencimiento`.

- [ ] **Step 5: Bucket `documentos` en Supabase Storage**

Ejecutar en Studio SQL:

```sql
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false);

create policy "documentos_authenticated_read"
  on storage.objects for select
  using (bucket_id = 'documentos' and auth.uid() is not null);

create policy "documentos_company_upload"
  on storage.objects for insert
  with check (bucket_id = 'documentos');
-- Refina en función Edge si quieres acceso público vía token; v1 acepta autenticados.
```

(Acceso público vía token usará una Edge Function `get_document_url` que valida token y devuelve signed URL.)

- [ ] **Step 6: Botón "Enviar a SST"**

Cuando la empresa tenga todas las personas con docs cargados, botón que llama:

```ts
// transición de estado, vía RPC o update directo con check
await supabase.from('access_requests').update({ estado: 'en_revision_sst' }).eq('id', requestId);
```

(El check de validez se hace con `canSubmitRequest` del paquete shared antes de permitir el click.)

- [ ] **Step 7: Probar flujo extremo a extremo**

Recepción crea solicitud → copia link → abre incógnito → carga 2 personas con todos sus documentos → "Enviar a SST" → estado pasa a `en_revision_sst`.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/empresa supabase
git commit -m "feat(web): public company portal for personnel and document upload"
```

**Fin Fase 2.**

---

# FASE 3 — Revisión SST + credencial QR firmado (Flujo B)

## Task 3.1: Bandeja SST con lista priorizada

**Files:**
- Create: `apps/web/src/app/dashboard/sst/bandeja/page.tsx`
- Create: `apps/web/src/app/dashboard/sst/bandeja/[requestId]/page.tsx`
- Create: `apps/web/src/app/dashboard/sst/bandeja/[requestId]/PersonReview.tsx`
- Create: `apps/web/src/app/dashboard/sst/bandeja/[requestId]/DocumentReview.tsx`

- [ ] **Step 1: `bandeja/page.tsx`** — server component que lista `access_requests` con `estado = 'en_revision_sst'` ordenadas por `fecha_desde` ascendente. Por cada una muestra: empresa, actividad, fecha_desde, cantidad de personas, # documentos pendientes.

- [ ] **Step 2: `bandeja/[requestId]/page.tsx`** — detalle: lista de personas de la solicitud, cada una con semáforo (rojo si tiene documentos `pendiente`/`rechazado`, amarillo si todos en `en_revision`, verde si todos `aprobado`). Click en persona expande `<PersonReview />`.

- [ ] **Step 3: `PersonReview.tsx`** (cliente) — muestra todos los `person_documents` de la persona. Por cada uno: tipo, fecha_emision, fecha_vencimiento (rojo si vencido), botón "Ver archivo" (genera signed URL llamando a Edge Function), botones "Aprobar" / "Rechazar con motivo".

- [ ] **Step 4: Edge Function `get-document-url`**

```ts
// supabase/functions/get-document-url/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('unauthorized', { status: 401 });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Cliente con el JWT del usuario para verificar permisos
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const { path } = await req.json();
  // Verificar que el usuario puede ver este path (RLS sobre person_documents)
  const { data: doc } = await userClient
    .from('person_documents')
    .select('id')
    .eq('archivo_url', path)
    .maybeSingle();
  if (!doc) return new Response('forbidden', { status: 403 });

  // Service client para firmar URL
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: signed, error } = await admin.storage
    .from('documentos')
    .createSignedUrl(path, 300);
  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ url: signed.signedUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 5: Acción "Aprobar documento" / "Rechazar"**

Cliente actualiza `person_documents` con `estado`, `revisado_por: user.id`, `revisado_at: now()`, `motivo_rechazo`.

Cuando todos los documentos requeridos de una persona están aprobados, trigger Postgres actualiza `request_people.estado_individual = 'aprobada'`:

```sql
-- Agregar a una nueva migración:
create or replace function refresh_person_request_status()
returns trigger
language plpgsql
as $$
declare
  rp_record record;
  required_docs document_type_key[];
  approved_count integer;
begin
  for rp_record in
    select rp.id, rp.access_request_id, rp.person_id, ar.activity_id
    from request_people rp
    join access_requests ar on ar.id = rp.access_request_id
    where rp.person_id = coalesce(new.person_id, old.person_id)
  loop
    select documentos_requeridos into required_docs
    from activities where id = rp_record.activity_id;

    select count(*) into approved_count
    from person_documents pd
    where pd.person_id = rp_record.person_id
      and pd.document_type = any(required_docs)
      and pd.estado = 'aprobado';

    if approved_count = array_length(required_docs, 1) then
      update request_people set estado_individual = 'aprobada' where id = rp_record.id;
    end if;
  end loop;
  return new;
end;
$$;

create trigger refresh_status_after_doc
  after insert or update on person_documents
  for each row execute function refresh_person_request_status();
```

- [ ] **Step 6: Botón "Aprobar solicitud completa"**

Cuando todas las `request_people` están `aprobada`, SST aprueba → `access_requests.estado = 'aprobada'`. Trigger:

```sql
create or replace function on_request_approved()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'aprobada' and (old.estado is null or old.estado <> 'aprobada') then
    -- Generar QR para cada request_person
    update request_people
    set qr_code = encode(hmac(id::text, current_setting('app.qr_secret', true), 'sha256'), 'hex'),
        qr_expires_at = (
          select fecha_hasta + interval '1 day' from access_requests where id = new.id
        )
    where access_request_id = new.id and estado_individual = 'aprobada';
  end if;
  return new;
end;
$$;

create trigger on_request_approved_tg
  after update on access_requests
  for each row execute function on_request_approved();
```

Nota: `app.qr_secret` se configura via `alter database postgres set app.qr_secret = '...'` con el mismo valor que `QR_HMAC_SECRET` en la app.

- [ ] **Step 7: Edge Function `send-credentials`** — al aprobarse la solicitud, envía email a cada persona con su QR como imagen adjunta (generar PNG en la función con `qrcode` library de Deno) y link a su credencial digital.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: SST review flow with document approval, status triggers and QR generation"
```

---

## Task 3.2: Vista de credencial digital para la persona

**Files:**
- Create: `apps/web/src/app/credencial/[qrCode]/page.tsx`

- [ ] **Step 1: Página pública** que recibe el `qr_code`, busca el `request_people` correspondiente, valida que `qr_expires_at > now()` y `estado_individual = 'aprobada'`, y muestra una tarjeta digital con: foto grande, nombre, cédula, empresa, actividad, vigencia. Estética tipo "credencial" (verde si vigente, gris si vencida).

- [ ] **Step 2: QR vuelve a renderizarse en la página** (para que la portería pueda escanearlo del teléfono del invitado).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/credencial
git commit -m "feat(web): public digital credential page"
```

**Fin Fase 3.**

---

# FASE 4 — App móvil portero (Flujo C)

## Task 4.1: Scaffold Expo

**Files:**
- Create: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/babel.config.js`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/app/index.tsx`, `apps/mobile/src/app/scan.tsx`, `apps/mobile/src/app/lista.tsx`

- [ ] **Step 1: Inicializar Expo**

```bash
cd /Users/joserojas/CODE/Proyecto/ControlCenfer/apps
npx create-expo-app@latest mobile --template blank-typescript --no-install
cd mobile
```

- [ ] **Step 2: Renombrar paquete a `@cenfer/mobile` en `package.json`**

```json
{
  "name": "@cenfer/mobile",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cenfer/shared": "workspace:*",
    "@cenfer/supabase": "workspace:*",
    "@supabase/supabase-js": "^2.45.0",
    "expo": "~51.0.0",
    "expo-camera": "~15.0.0",
    "expo-router": "~3.5.0",
    "expo-secure-store": "~13.0.0",
    "react": "18.3.1",
    "react-native": "0.74.0"
  }
}
```

- [ ] **Step 3: `app.json` con Expo Router habilitado**

- [ ] **Step 4: Login simplificado en `src/app/index.tsx`** (email + password). Al ingresar verifica que el rol es `portero`. Guarda PIN en `expo-secure-store` para desbloqueos futuros.

- [ ] **Step 5: `src/app/scan.tsx`** — pantalla con cámara (`expo-camera`) que escanea QR. Al escanear, llama a Edge Function `validate-qr` que devuelve verde/rojo + datos.

- [ ] **Step 6: `src/app/lista.tsx`** — lista del día (query a `request_people` con `qr_expires_at >= today and fecha_desde <= today and fecha_hasta >= today`). Usa Supabase Realtime para actualizar.

- [ ] **Step 7: Edge Function `validate-qr`**

```ts
// supabase/functions/validate-qr/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const QR_SECRET = Deno.env.get('QR_HMAC_SECRET')!;

async function hmacHex(input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(QR_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  const { qr } = await req.json();
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: rp } = await admin
    .from('request_people')
    .select(`
      id, estado_individual, qr_code, qr_expires_at,
      people(cedula, nombre, apellido, foto_url, company_id, companies(razon_social)),
      access_requests(fecha_desde, fecha_hasta, horario_inicio, horario_fin, estado, activities(nombre))
    `)
    .eq('qr_code', qr)
    .maybeSingle();

  if (!rp) return new Response(JSON.stringify({ ok: false, motivo: 'qr_no_encontrado' }), { status: 200 });

  // Validar firma
  const expected = await hmacHex(rp.id);
  if (expected !== rp.qr_code) {
    return new Response(JSON.stringify({ ok: false, motivo: 'qr_falsificado' }), { status: 200 });
  }

  const now = new Date();
  if (rp.qr_expires_at && new Date(rp.qr_expires_at) < now) {
    return new Response(JSON.stringify({ ok: false, motivo: 'vencido' }), { status: 200 });
  }
  // (validar rango fechas, horario, estado activo)

  return new Response(JSON.stringify({ ok: true, persona: rp }), { status: 200 });
});
```

- [ ] **Step 8: Registro de entrada/salida** — botón en pantalla de resultado verde llama a `access_events insert`.

- [ ] **Step 9: Modo offline ligero** — al iniciar día, descarga lista del día completa a AsyncStorage. Si red falla, valida contra cache y encola eventos para sincronizar.

- [ ] **Step 10: Commit**

```bash
git add apps/mobile supabase/functions
git commit -m "feat(mobile): porter app with QR scan, cedula search and offline-light"
```

**Fin Fase 4.**

---

# FASE 5 — Inducción digital

## Task 5.1: Tablas inductions + induction_completions

**Files:**
- Create: `supabase/migrations/00000000000004_inductions.sql`

Aplicar `inductions` y `induction_completions` según spec §5.5. RLS: lectura pública del video, escritura de `completions` solo si el usuario es la persona (vía email magic link público).

## Task 5.2: Página de inducción para la persona

**Files:**
- Create: `apps/web/src/app/induccion/[personId]/page.tsx`
- Create: `apps/web/src/app/induccion/[personId]/InductionPlayer.tsx`

Página pública (link enviado por email) que muestra video, después del video despliega cuestionario, al aprobar registra `induction_completions` con `firma_simple` (input texto + checkbox de aceptación).

## Task 5.3: Bloqueo de SST si inducción vencida

Al revisar persona, SST ve estado de inducción. Si no hay completion o `expires_at < today`, marca como pendiente.

```bash
git commit -m "feat: digital induction with video, quiz and electronic signature"
```

**Fin Fase 5.**

---

# FASE 6 — Reportes y dashboards

## Task 6.1: Vistas SQL

**Files:**
- Create: `supabase/migrations/00000000000005_reporting_views.sql`

```sql
create or replace view v_personas_dentro as
select distinct on (ae.request_person_id)
  ae.request_person_id,
  rp.person_id,
  p.cedula, p.nombre, p.apellido,
  c.razon_social,
  ae.porteria_id,
  ae.created_at as ultima_entrada
from access_events ae
join request_people rp on rp.id = ae.request_person_id
join people p on p.id = rp.person_id
join access_requests ar on ar.id = rp.access_request_id
join companies c on c.id = ar.company_id
where ae.tipo = 'entrada'
  and not exists (
    select 1 from access_events ae2
    where ae2.request_person_id = ae.request_person_id
      and ae2.tipo = 'salida'
      and ae2.created_at > ae.created_at
  )
order by ae.request_person_id, ae.created_at desc;

create or replace view v_documentos_por_vencer as
select pd.id, p.nombre, p.apellido, p.cedula, c.razon_social,
       pd.document_type, pd.fecha_vencimiento,
       (pd.fecha_vencimiento - current_date) as dias_restantes
from person_documents pd
join people p on p.id = pd.person_id
join companies c on c.id = p.company_id
where pd.estado = 'aprobado'
  and pd.fecha_vencimiento is not null
  and pd.fecha_vencimiento <= current_date + interval '30 days'
order by pd.fecha_vencimiento;

create or replace view v_no_salieron_hoy as
select rp.id, p.nombre, p.apellido, p.cedula, c.razon_social,
       max(ae.created_at) as ultima_entrada
from access_events ae
join request_people rp on rp.id = ae.request_person_id
join people p on p.id = rp.person_id
join access_requests ar on ar.id = rp.access_request_id
join companies c on c.id = ar.company_id
where date(ae.created_at) = current_date
  and ae.tipo = 'entrada'
  and not exists (
    select 1 from access_events ae2
    where ae2.request_person_id = ae.request_person_id
      and ae2.tipo = 'salida'
      and ae2.created_at > ae.created_at
  )
group by rp.id, p.nombre, p.apellido, p.cedula, c.razon_social;
```

## Task 6.2: Dashboards por rol

**Files:**
- Create: `apps/web/src/app/dashboard/reportes/page.tsx`
- Create: `apps/web/src/app/dashboard/reportes/dentro/page.tsx`
- Create: `apps/web/src/app/dashboard/reportes/historial/page.tsx`
- Create: `apps/web/src/app/dashboard/reportes/vencimientos/page.tsx`
- Create: `apps/web/src/app/dashboard/reportes/auditoria/page.tsx`
- Create: `apps/web/src/app/dashboard/reportes/actividad/page.tsx`

Cada página consulta su vista correspondiente, renderiza tabla y ofrece:
- Botón "Exportar Excel" → usa `exceljs` en API Route Handler.
- Botón "Exportar PDF" → usa `@react-pdf/renderer` en API Route Handler.

Para Dashboard "actividad" usar Recharts (instalar `recharts`).

```bash
pnpm --filter @cenfer/web add exceljs @react-pdf/renderer recharts
```

## Task 6.3: Tabla audit_log + triggers

**Files:**
- Create: `supabase/migrations/00000000000006_audit.sql`

```sql
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id),
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  payload_diff jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;
create policy "audit_read_admin_sst" on audit_log for select
  using (current_user_role() in ('super_admin', 'sst'));
-- Sin insert/update/delete desde clientes; solo triggers.

create or replace function audit_changes()
returns trigger language plpgsql security definer as $$
begin
  insert into audit_log (actor_id, accion, entidad, entidad_id, payload_diff)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case
      when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
      when tg_op = 'INSERT' then to_jsonb(new)
      when tg_op = 'DELETE' then to_jsonb(old)
    end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_access_requests after insert or update or delete on access_requests
  for each row execute function audit_changes();
create trigger audit_person_documents after insert or update on person_documents
  for each row execute function audit_changes();
create trigger audit_request_people after insert or update on request_people
  for each row execute function audit_changes();
```

```bash
git commit -m "feat: reporting views, dashboards with export and audit log"
```

**Fin Fase 6.**

---

# FASE 7 — Jobs nocturnos

## Task 7.1: Edge Functions cron

**Files:**
- Create: `supabase/functions/cron-vencimientos/index.ts`
- Create: `supabase/functions/cron-no-salieron/index.ts`
- Create: `supabase/functions/cron-keepalive/index.ts`
- Create: `supabase/functions/cron-backup-export/index.ts`
- Create: `supabase/functions/email-queue-processor/index.ts`

- [ ] **Step 1: `cron-vencimientos`** — query a `v_documentos_por_vencer` con `dias_restantes` ∈ {7, 15, 30}. Para cada uno, inserta en `email_queue` (tabla que crearemos) con destinatario y plantilla.

- [ ] **Step 2: Tabla `email_queue`** (migración 00000000000007_email_queue.sql)

```sql
create table email_queue (
  id uuid primary key default uuid_generate_v4(),
  to_email text not null,
  subject text not null,
  body_html text not null,
  prioridad integer not null default 5,
  enviado boolean not null default false,
  intentos integer not null default 0,
  ultimo_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index email_queue_pending_idx on email_queue(enviado, prioridad, created_at) where not enviado;
```

- [ ] **Step 3: `email-queue-processor`** — cada 10 minutos toma máx. 90/día (control con conteo en `email_queue.sent_at::date = today`), envía con Resend, marca como enviado.

- [ ] **Step 4: `cron-no-salieron`** — consulta `v_no_salieron_hoy`, envía email a SST y responsable.

- [ ] **Step 5: `cron-keepalive`** — `select 1`, mantiene Supabase Free despierto.

- [ ] **Step 6: `cron-backup-export`** — exporta tablas críticas a JSON en bucket `documentos/backups/{date}.json`.

- [ ] **Step 7: Programar crons en Supabase**

Usar `pg_cron` (disponible en Free):

```sql
create extension if not exists pg_cron;

select cron.schedule('vencimientos', '0 7 * * *', $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/cron-vencimientos',
    headers := '{"Authorization": "Bearer <service_role>"}'::jsonb
  );
$$);
-- Repetir para los otros 4 jobs con sus horarios.
```

```bash
git commit -m "feat: nightly cron jobs for expirations, no-salieron, keepalive, backup and email queue"
```

**Fin Fase 7.**

---

# FASE 8 — Pulido, pruebas E2E y producción

## Task 8.1: Playwright — 10 flujos críticos

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/auth.spec.ts`
- Create: `apps/web/e2e/recepcion-crea-solicitud.spec.ts`
- Create: `apps/web/e2e/empresa-carga-personal.spec.ts`
- Create: `apps/web/e2e/sst-aprueba-solicitud.spec.ts`
- Create: `apps/web/e2e/credencial-publica.spec.ts`
- Create: `apps/web/e2e/admin-catalogos.spec.ts`
- Create: `apps/web/e2e/reporte-dentro.spec.ts`
- Create: `apps/web/e2e/reporte-vencimientos.spec.ts`
- Create: `apps/web/e2e/empresa-token-vencido.spec.ts`
- Create: `apps/web/e2e/induccion.spec.ts`

Para cada spec: setup en `beforeAll` que crea fixtures vía Supabase service client; el flujo del usuario; `afterAll` limpia.

- [ ] **Step 1: Instalar Playwright**

```bash
pnpm --filter @cenfer/web add -D @playwright/test
pnpm --filter @cenfer/web exec playwright install
```

- [ ] **Step 2: `playwright.config.ts`** apuntando a `http://localhost:3000`.

- [ ] **Step 3: Escribir las 10 specs** (cada una de 30–80 líneas).

## Task 8.2: Maestro flujos mobile

**Files:**
- Create: `apps/mobile/maestro/login.yaml`
- Create: `apps/mobile/maestro/scan-qr.yaml`
- Create: `apps/mobile/maestro/buscar-cedula.yaml`
- Create: `apps/mobile/maestro/registrar-entrada.yaml`
- Create: `apps/mobile/maestro/modo-offline.yaml`

## Task 8.3: Documento de privacidad y consentimiento (Habeas Data)

**Files:**
- Create: `apps/web/src/app/privacidad/page.tsx`

Página estática con política de privacidad. Checkbox de aceptación obligatorio en el formulario de carga de la empresa antes de subir documentos personales.

## Task 8.4: Crear proyecto Supabase de producción y promover

- [ ] **Step 1:** Crear proyecto Supabase `control-cenfer-prod`.
- [ ] **Step 2:** `supabase db push` apuntando a prod.
- [ ] **Step 3:** Crear variables en Vercel para entorno production.
- [ ] **Step 4:** Deploy a prod.
- [ ] **Step 5:** Crear usuarios reales: Admin, SST (2 personas), Recepción (1 persona), Porteros (2 personas).
- [ ] **Step 6:** Capacitación de equipo (1 sesión por rol).

## Task 8.5: Piloto controlado

- [ ] **Step 1:** Habilitar el sistema solo para 1 evento real, dejando registro en papel como backup.
- [ ] **Step 2:** Recoger feedback diario por 1 semana.
- [ ] **Step 3:** Resolver bugs/UX top 5.
- [ ] **Step 4:** Eliminar registro en papel después del primer evento exitoso.

```bash
git commit -m "test: e2e Playwright + Maestro suites for critical flows"
git commit -m "feat: privacy policy and Habeas Data consent"
git commit -m "chore: production deployment and pilot launch"
```

**Fin Fase 8 — Sistema en producción.**

---

# Apéndices

## A. Variables de entorno

| Variable | Dónde | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | eyJh... |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel server + Edge Functions | eyJh... |
| `QR_HMAC_SECRET` | Vercel server + Postgres `app.qr_secret` + Edge Function `validate-qr` | (openssl rand -base64 32) |
| `RESEND_API_KEY` | Edge Functions | re_... |
| `PUBLIC_BASE_URL` | Edge Functions | https://controlcenfer.com |
| `SENTRY_DSN` | Vercel + Expo | https://...@sentry.io/... |

## B. Comandos útiles

```bash
# Dev local
pnpm dev                                # todo el monorepo
supabase start                          # Postgres + Auth + Storage local
pnpm --filter @cenfer/web dev           # solo web
pnpm --filter @cenfer/mobile start      # solo mobile

# Migraciones
supabase migration new <nombre>
supabase db reset                       # reaplica todas las migraciones
supabase db push                        # push a Cloud

# Regenerar tipos
pnpm --filter @cenfer/supabase exec supabase gen types typescript --local > packages/supabase/src/types.ts

# Tests
pnpm test                               # todos
pnpm --filter @cenfer/web e2e           # Playwright
maestro test apps/mobile/maestro/       # Maestro

# Deploy Edge Functions
supabase functions deploy send-invitation
supabase functions deploy validate-qr
# (etc.)
```

## C. Convenciones de código

- Imports ordenados: externos → `@cenfer/*` → relativos.
- Componentes Server por defecto en Next.js; `'use client'` solo cuando hace falta interactividad.
- Hooks personalizados en `src/lib/hooks/`.
- Llamadas Supabase del lado servidor cuando sea posible (RSC) para evitar exponer queries.
- Nombres en español para entidades de dominio (`solicitud`, `empresa`, `portero`).
- Mensajes de commit en inglés siguiendo Conventional Commits.

## D. Checklist final pre-producción

- [ ] Todas las migraciones aplicadas en prod.
- [ ] `QR_HMAC_SECRET` configurado en Postgres y en Edge Function.
- [ ] Dominio configurado con SSL.
- [ ] Política de privacidad publicada.
- [ ] Backups semanales corriendo.
- [ ] Cron keepalive activo.
- [ ] Sentry recibiendo errores.
- [ ] Usuarios reales creados con sus perfiles.
- [ ] Cola de emails sin atascos.
- [ ] Capacitación realizada.

---

**Total estimado:** 10–12 semanas (1 dev fullstack senior). Compromiso de commits frecuentes (mínimo 1 commit por step donde aplique).
