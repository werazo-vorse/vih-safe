# VIHSafe Manizales

Spanish-language web platform for HIV early detection, education, and access to testing resources, designed for university students in Manizales, Colombia.

Built on the MySTIRisk-adapted instrument from "INFORME DE AVANCE No. 4" (Semillero SINGBIO), with three modules:

1. **Evaluación de Riesgo** — 19-question wizard (12 fixed + 7 conditional) covering demographic, behavioral, epidemiological, and clinical domains. Returns a risk level (low / moderate / high / very_high), a per-domain breakdown shown as a radar chart, identified factors, and tailored next steps.
2. **Chatbot Educativo** — AI assistant in Colombian Spanish with safe, evidence-based answers about HIV/STIs, condoms, PrEP/PEP, treatment (I=I), and Manizales resources. Powered by Google Gemini (`gemini-2.5-flash`) through Replit AI Integrations.
3. **Educación Interactiva** — Five reading modules with Mito-vs-Verdad flip cards and a quiz at the end of each. Topics: transmission, prevention, testing, treatment, stigma.

Plus **Recursos** — directory of clinics in Manizales with addresses, phones (clickable), services, hours, and free/paid badges.

## Architecture

Monorepo (`pnpm-workspace`):

- `artifacts/vihsafe` — React + Vite + wouter + TanStack Query + shadcn + framer-motion + recharts
- `artifacts/api-server` — Express 5 + Drizzle (PostgreSQL)
- `lib/api-spec` — OpenAPI source of truth (codegen for client + zod)
- `lib/api-client-react` — generated TanStack Query hooks
- `lib/api-zod` — generated request/response Zod schemas
- `lib/db` — Drizzle schemas (assessments, chat_messages, quiz_completions)

API contract is in `lib/api-spec/openapi.yaml`. Run `pnpm --filter @workspace/api-spec run codegen` after changes.

## Data sources

- `artifacts/api-server/src/data/questions.ts` — the 21 adapted questions in Colombian Spanish (12 fixed + 9 conditional, including I=I logic for partner HIV status and recent STI contact)
- `artifacts/api-server/src/data/clinics.ts` — Manizales testing centers (Assbasalud, Secretaría de Salud, Profamilia, Hospital Santa Sofía, Cruz Roja Caldas)
- `artifacts/api-server/src/data/education.ts` — five educational modules with Mito-vs-Verdad facts and quizzes
- `artifacts/api-server/src/lib/scoring.ts` — risk scoring algorithm; PrEP is treated as protective; partner with undetectable VL is non-transmissible (I=I)

## Gemini AI integration

The chatbot uses Google Gemini through Replit's AI Integrations proxy (no user API key needed). Env vars `AI_INTEGRATIONS_GEMINI_BASE_URL` and `AI_INTEGRATIONS_GEMINI_API_KEY` are auto-provisioned. Model: `gemini-2.5-flash` with `responseMimeType: "application/json"` and a Spanish system prompt named "VIHSafe". The Gemini SDK is initialized in `artifacts/api-server/src/lib/gemini.ts` with `httpOptions.apiVersion = ""` so the Replit proxy receives `POST /models/...:generateContent` directly (the proxy does not accept `v1beta` or `v1` prefixes).

## Spanish & UX rules

- All UI in Colombian Spanish.
- No emojis anywhere.
- Calm teal palette in `artifacts/vihsafe/src/index.css`. Never alarmist.
- Every result page is empathetic regardless of risk level.

## Privacy

Assessments are stored anonymously (no name, no email, only an age range bucket and the answers themselves). The chatbot stores message bodies for analytics. No personally identifiable information is collected from users.
