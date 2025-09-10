# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: Vite + React + TypeScript, Tailwind CSS, shadcn-ui, TanStack Query, React Router, Supabase (auth + DB), optional API route for Google Gemini.
- Dev alias: @ -> src/ via Vite resolve.

Common commands
- Install deps: npm i
- Start dev server: npm run dev  (Vite on port 8080 per vite.config.ts)
- Build (prod): npm run build
- Build (dev mode bundles): npm run build:dev
- Preview local build: npm run preview
- Lint: npm run lint

Testing
- No test framework is configured. If you add Vitest/Jest, prefer single-test runs via their native filters (e.g., vitest run src/foo.test.ts). Until then, manual testing is via the Vite dev server.

Environment and secrets
- Supabase client uses a publishable key embedded at src/integrations/supabase/client.ts. Do not commit private keys. If you rotate credentials, update that file and any .env usage.
- API route api/ai-pricing.js expects GOOGLE_AI_API_KEY in env. Set at runtime before invoking that endpoint.
- Local .env exists in repo root; avoid printing secrets in terminal output. Use environment variables in commands as needed.

How to run a single feature/page
- Use the React Router paths: 
  - / -> Index landing (redirects to /dashboard when authenticated)
  - /auth -> authentication page
  - /dashboard -> main app shell with sidebar and feature panels
- For focused manual testing, navigate directly to the route in the browser while the dev server is running.

Repository structure (high level)
- src/main.tsx: React root mounting.
- src/App.tsx: App providers (TanStack Query, AuthProvider, Tooltip, Toasters) and route registration.
- src/contexts/AuthContext.tsx: Supabase-auth integration; exposes signUp/signIn/signOut, manages session/user profile bootstrap.
- src/integrations/supabase/client.ts: Supabase client factory and config.
- src/pages/: Route-level screens (Index, Auth, Dashboard, NotFound).
- src/components/: Feature modules used within pages (dashboard, reservations, properties, pricing, layout, ui).
- vite.config.ts: Dev server host/port, React SWC plugin, path alias @ -> src, conditional lovable-tagger in dev.
- tailwind.config.ts, components.json, postcss.config.js: Styling system and shadcn-ui config.
- api/ai-pricing.js: Example serverless-style handler for Gemini pricing suggestions (expects GOOGLE_AI_API_KEY).

Architecture overview
- Routing: React Router in App.tsx defines the main navigation. Index redirects to /dashboard if authenticated; NotFound is a catch-all.
- State and data:
  - Auth: Supabase auth state via onAuthStateChange sets session/user. On sign-in, ensures a user profile exists in profiles table (via upsert).
  - Server data: TanStack Query client is provided at app root; components can use it for data fetching/caching.
- UI system: Tailwind CSS + shadcn-ui primitives (components/ui/*) with lucide-react icons. Utility helpers in src/lib/utils.ts and hooks under src/hooks/.
- Dashboard shell: src/pages/Dashboard.tsx manages currentPage state to render feature panels (overview, properties, reservations, calendar, pricing, analytics/users/settings placeholders). Sidebar drives panel selection.
- Supabase integration: src/integrations/supabase/client.ts creates the client; AuthContext uses it for session management and profile bootstrap.
- Optional server runtime: api/ai-pricing.js demonstrates a server endpoint calling Google Gemini; adapt to your hosting platform’s serverless runtime.

Dev tips specific to this repo
- Port: Vite dev server runs on 8080. If occupied, change vite.config.ts or pass --port.
- Path alias: Use imports like import X from "@/components/..." rather than relative paths.
- Shadcn components: components.json defines aliases and Tailwind linkage; keep these consistent when adding UI.

From README.md (essentials)
- Requires Node.js and npm. Quickstart:
  - npm i
  - npm run dev
- Built with Vite, TypeScript, React, shadcn-ui, Tailwind CSS.

Useful one-off commands
- Run dev server on another port: PORT=5173 vite --port 5173 (or edit vite.config.ts)
- Lint only changed files (git): git diff --name-only --diff-filter=ACM main | xargs -r npx eslint

Notes for future agents
- If adding tests, prefer Vitest for Vite-based apps; integrate into npm scripts (test, test:watch) and document single-test invocation.
- If you modify Supabase URL/key, update src/integrations/supabase/client.ts and ensure env usage in CI/deploy.

