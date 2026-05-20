# Cloudflare + Supabase Deployment

This deployment path keeps the existing database-backed product use cases while avoiding an always-on Node server.

## Runtime

- Cloudflare Pages serves the Vite build in `artifacts/vihsafe/dist/public`.
- Cloudflare Pages Functions handle `/api/*` from `functions/api/[[path]].ts`.
- Supabase stores assessments, chat messages, quiz completions, and aggregate stats source data.
- Gemini is called through the public Gemini API with `GEMINI_API_KEY`.

## Supabase

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Copy the project URL into `SUPABASE_URL`.
5. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.

Keep `SUPABASE_SERVICE_ROLE_KEY` only in Cloudflare server-side environment variables. Never expose it as a `VITE_*` variable.

The schema creates the `assessments`, `chat_messages`, and `quiz_completions` tables, plus the `risk_distribution()` RPC used by the stats endpoint.

## Cloudflare Pages

Use these build settings:

- Project root: repository root
- Build command: `pnpm --filter @workspace/vihsafe run build`
- Build output directory: `artifacts/vihsafe/dist/public`
- Functions directory: `functions`

Set these environment variables in Cloudflare Pages:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` defaults to `gemini-2.5-flash`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BASE_PATH` optional, defaults to `/`

## Local Commands

Install dependencies first:

```sh
pnpm install
```

Build the frontend:

```sh
pnpm --filter @workspace/vihsafe run build
```

Run a local Cloudflare Pages preview after installing Wrangler:

```sh
pnpm dlx wrangler pages dev artifacts/vihsafe/dist/public --functions functions
```

## Why Express Is Not Used Here

Express is still present for the existing Replit-style runtime, but Cloudflare's cheapest runtime is request-based serverless execution. The Pages Function preserves the current `/api/*` contract without paying for an always-on server.
