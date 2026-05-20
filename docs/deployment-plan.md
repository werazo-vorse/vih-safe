# Deployment Plan: Cloudflare + Supabase

## Goal

Deploy VIHSafe at the lowest practical cost while keeping all existing product functionality, including database-backed use cases.

## Target Architecture

- Frontend: Cloudflare Pages serving the Vite build from `artifacts/vihsafe/dist/public`.
- API: Cloudflare Pages Functions under `artifacts/vihsafe/functions`.
- Database: Supabase Postgres.
- AI: Google Gemini API using `GEMINI_API_KEY`.

This avoids an always-on server while preserving the current `/api/*` contract used by the frontend.

## Functionality To Preserve

- Risk assessment questionnaire.
- Risk assessment scoring.
- Anonymous assessment persistence.
- Recent assessment list.
- Aggregate platform stats.
- Education module list and detail pages.
- Quiz grading.
- Quiz completion persistence.
- Clinic/resource directory.
- Gemini chatbot.
- Chat message persistence.

## Current Implementation Strategy

Keep the existing Express API in `artifacts/api-server` as a fallback while adding a Cloudflare-native API implementation.

The Cloudflare function mirrors the current API contract:

- `GET /api/healthz`
- `GET /api/assessment/questions`
- `POST /api/assessment/submit`
- `GET /api/assessment/recent`
- `GET /api/stats/summary`
- `POST /api/chatbot/message`
- `GET /api/education/modules`
- `GET /api/education/modules/:moduleId`
- `POST /api/education/quiz/submit`
- `GET /api/resources/clinics`

## Required Environment Variables

Server-side only:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`, optional, defaults to `gemini-2.5-flash`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not expose `SUPABASE_SERVICE_ROLE_KEY` as a `VITE_*` variable.

## Database Setup

Run `supabase/schema.sql` in the Supabase SQL editor.

Tables:

- `assessments`
- `chat_messages`
- `quiz_completions`

The schema also creates `risk_distribution()`, a Postgres RPC used to keep aggregate stats cheap.

Row-level security is enabled. The Cloudflare function uses the service role key server-side for inserts, reads, and stats queries.

## Deployment Steps

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Create a Cloudflare Pages project connected to this repository.
4. Configure Cloudflare Pages:
   - Build command: `pnpm --filter @workspace/vihsafe run build`
   - Build output directory: `artifacts/vihsafe/dist/public`
   - Functions directory: `artifacts/vihsafe/functions`
5. Add the required environment variables in Cloudflare.
6. Deploy.
7. Smoke test the application:
   - Home stats load.
   - Assessment submits and appears in Supabase.
   - Recent assessments load.
   - Chatbot replies and chat rows are stored.
   - Education modules load.
   - Quiz submits and completion row is stored.
   - Clinics load.

## Cleanup After Stable Deployment

- Remove Replit-specific assumptions from deployment docs.
- Decide whether to keep or archive `artifacts/mockup-sandbox`.
- Reduce unused UI dependencies/components after build verification.
- Add rate limiting or Cloudflare Turnstile for public chatbot access.
- Add retention policy for chat messages and assessment answers.

## Current Blocker

Local verification is blocked by dependency installation failure.

- The project now overrides the machine-level private registry with `registry=https://registry.npmjs.org/` in `.npmrc`.
- Install still fails from this machine because npmjs tarball downloads time out.
- Because install does not complete, `node_modules/.bin/tsc` and build tooling are unavailable locally.
