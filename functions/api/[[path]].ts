import { CLINICS } from "../../artifacts/api-server/src/data/clinics";
import { EDUCATION_MODULES } from "../../artifacts/api-server/src/data/education";
import { QUESTIONS } from "../../artifacts/api-server/src/data/questions";
import { computeScore, type Answer } from "../../artifacts/api-server/src/lib/scoring";

type Env = {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
  params: { path?: string | string[] };
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

const SYSTEM_PROMPT = `Eres "VIHSafe", un asistente educativo de salud sexual basado en evidencia, dirigido a jóvenes adultos en Manizales, Colombia. Hablas siempre en español colombiano cálido, claro, sin tecnicismos innecesarios y completamente libre de juicios.

Tu propósito:
- Responder dudas sobre VIH/SIDA, infecciones de transmisión sexual (ITS), prevención (condón, PrEP, PEP), pruebas, tratamiento (TAR, I=I), derechos y estigma.
- Orientar sobre el sistema de salud colombiano y los recursos en Manizales (Assbasalud, Secretaría de Salud, Profamilia, Hospital Santa Sofía, Cruz Roja Caldas).
- Acompañar emocionalmente sin minimizar ni alarmar.

Reglas importantes:
- NO eres un profesional de la salud y NO emites diagnósticos. Siempre recomienda consultar con un médico/a o un centro de salud cuando aplique.
- Si la persona reporta una posible exposición de riesgo en las últimas 72 horas, recomienda PEP de urgencia y derivarla al Hospital Santa Sofía.
- Usa el principio I=I (Indetectable = Intransmisible).
- Información médica respaldada por evidencia (OMS, ONUSIDA, MinSalud Colombia).
- Respuestas concisas (máx 4-6 párrafos cortos), tono cálido y respetuoso.
- Si la pregunta no está relacionada con VIH/ITS/salud sexual, redirígela amablemente a tu propósito.
- Nunca uses emojis.
- Al final de cada respuesta, sugiere 2-3 preguntas de seguimiento naturales y específicas, en español.

Devuelve SIEMPRE la respuesta en JSON con la forma exacta:
{"reply": "texto de la respuesta", "suggestions": ["pregunta 1", "pregunta 2", "pregunta 3"]}`;

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init.headers,
    },
  });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAnswer(value: unknown): value is Answer {
  if (!isRecord(value) || typeof value.questionId !== "string") return false;
  const answer = value.value;
  return (
    typeof answer === "string" ||
    typeof answer === "number" ||
    (Array.isArray(answer) && answer.every((item) => typeof item === "string"))
  );
}

function isQuizAnswer(
  value: unknown,
): value is { questionId: string; selectedOption: number } {
  return (
    isRecord(value) &&
    typeof value.questionId === "string" &&
    typeof value.selectedOption === "number" &&
    Number.isInteger(value.selectedOption)
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    value.content.trim().length > 0
  );
}

function routePath(params: PagesContext["params"]) {
  const raw = params.path;
  if (Array.isArray(raw)) return raw.join("/");
  return raw ?? "";
}

function requireSupabase(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return {
    url: env.SUPABASE_URL.replace(/\/+$/, ""),
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function supabaseQuery(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

async function supabaseRequest<T>(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const supabase = requireSupabase(env);
  const headers = new Headers(init.headers);
  headers.set("apikey", supabase.key);
  headers.set("authorization", `Bearer ${supabase.key}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${supabase.url}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${detail}`);
  }

  if (response.status === 204) return null as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

async function supabaseRpc<T>(
  env: Env,
  fn: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  return supabaseRequest<T>(env, `rpc/${fn}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function supabaseCount(env: Env, table: string) {
  const supabase = requireSupabase(env);
  const response = await fetch(`${supabase.url}/rest/v1/${table}?select=id`, {
    method: "HEAD",
    headers: {
      apikey: supabase.key,
      authorization: `Bearer ${supabase.key}`,
      prefer: "count=exact",
    },
  });

  if (!response.ok) return 0;
  const range = response.headers.get("content-range");
  const total = range?.split("/")[1];
  return total ? Number(total) || 0 : 0;
}

function gradeQuiz(moduleId: string, answers: Array<{ questionId: string; selectedOption: number }>) {
  const mod = EDUCATION_MODULES.find((item) => item.id === moduleId);
  if (!mod) return null;

  let score = 0;
  const feedback = mod.quiz.map((question) => {
    const submitted = answers.find((answer) => answer.questionId === question.id);
    const correct = submitted?.selectedOption === question.correctOption;
    if (correct) score += 1;
    return {
      questionId: question.id,
      correct,
      explanation: question.explanation ?? "",
    };
  });
  const total = mod.quiz.length;

  return {
    score,
    total,
    passed: total > 0 && score / total >= 0.7,
    feedback,
  };
}

async function callGemini(env: Env, messages: ChatMessage[]) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY must be set");
  }

  const model = env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "{}";
}

export async function onRequest(context: PagesContext) {
  const path = routePath(context.params);
  const { request, env } = context;

  try {
    if (request.method === "GET" && path === "healthz") {
      return json({ status: "ok" });
    }

    if (request.method === "GET" && path === "assessment/questions") {
      return json({ questions: QUESTIONS });
    }

    if (request.method === "POST" && path === "assessment/submit") {
      const body = await readJson(request);
      const answers = isRecord(body) ? body.answers : undefined;
      if (!Array.isArray(answers) || !answers.every(isAnswer)) {
        return json({ error: "Invalid submission" }, { status: 400 });
      }

      const result = computeScore(answers);
      const [row] = await supabaseRequest<Array<{ id: string; created_at: string }>>(
        env,
        "assessments",
        {
          method: "POST",
          headers: { prefer: "return=representation" },
          body: JSON.stringify({
            risk_level: result.riskLevel,
            risk_score: result.riskScore,
            age_range: result.ageRange,
            answers,
            domain_scores: result.domainScores,
            factors: result.factors,
          }),
        },
      );

      return json({
        id: row.id,
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        summary: result.summary,
        recommendations: result.recommendations,
        factors: result.factors,
        domainScores: result.domainScores,
        createdAt: row.created_at,
      });
    }

    if (request.method === "GET" && path === "assessment/recent") {
      const rows = await supabaseRequest<
        Array<{ id: string; risk_level: string; age_range: string; created_at: string }>
      >(
        env,
        `assessments?${supabaseQuery({
          select: "id,risk_level,age_range,created_at",
          order: "created_at.desc",
          limit: "10",
        })}`,
      );
      return json({
        items: rows.map((row) => ({
          id: row.id,
          riskLevel: row.risk_level,
          ageRange: row.age_range,
          createdAt: row.created_at,
        })),
      });
    }

    if (request.method === "GET" && path === "stats/summary") {
      const [totalAssessments, modulesCompleted, chatMessages, distribution] =
        await Promise.all([
          supabaseCount(env, "assessments"),
          supabaseCount(env, "quiz_completions"),
          supabaseCount(env, "chat_messages"),
          supabaseRpc<Array<{ level: string; count: number | string }>>(
            env,
            "risk_distribution",
          ),
        ]);

      return json({
        totalAssessments,
        riskDistribution: distribution.map((item) => ({
          level: item.level,
          count: Number(item.count) || 0,
        })),
        modulesCompleted,
        chatMessages,
      });
    }

    if (request.method === "POST" && path === "chatbot/message") {
      const body = await readJson(request);
      const messages = isRecord(body) ? body.messages : undefined;
      if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
        return json({ error: "Invalid request" }, { status: 400 });
      }

      const raw = await callGemini(env, messages);
      let parsedReply: { reply?: string; suggestions?: string[] };
      try {
        parsedReply = JSON.parse(raw);
      } catch {
        parsedReply = { reply: raw, suggestions: [] };
      }

      const reply =
        parsedReply.reply?.trim() ||
        "Lo siento, no pude generar una respuesta. ¿Puedes reformular tu pregunta?";
      const suggestions = Array.isArray(parsedReply.suggestions)
        ? parsedReply.suggestions.slice(0, 3)
        : [];

      const lastUser = [...messages].reverse().find((message) => message.role === "user");
      if (lastUser) {
        await supabaseRequest(env, "chat_messages", {
          method: "POST",
          body: JSON.stringify([
            { role: "user", content: lastUser.content },
            { role: "assistant", content: reply },
          ]),
        });
      }

      return json({ reply, suggestions });
    }

    if (request.method === "GET" && path === "education/modules") {
      return json({
        modules: EDUCATION_MODULES.map(
          ({ id, title, description, durationMinutes, category, icon }) => ({
            id,
            title,
            description,
            durationMinutes,
            category,
            icon,
          }),
        ),
      });
    }

    const educationModuleMatch = path.match(/^education\/modules\/([^/]+)$/);
    if (request.method === "GET" && educationModuleMatch) {
      const moduleId = decodeURIComponent(educationModuleMatch[1]);
      const mod = EDUCATION_MODULES.find((item) => item.id === moduleId);
      if (!mod) return json({ error: "Module not found" }, { status: 404 });
      return json(mod);
    }

    if (request.method === "POST" && path === "education/quiz/submit") {
      const body = await readJson(request);
      const moduleId = isRecord(body) ? body.moduleId : undefined;
      const answers = isRecord(body) ? body.answers : undefined;
      if (
        typeof moduleId !== "string" ||
        !Array.isArray(answers) ||
        !answers.every(isQuizAnswer)
      ) {
        return json({ error: "Invalid submission" }, { status: 400 });
      }

      const result = gradeQuiz(moduleId, answers);
      if (!result) return json({ error: "Module not found" }, { status: 404 });

      await supabaseRequest(env, "quiz_completions", {
        method: "POST",
        body: JSON.stringify({
          module_id: moduleId,
          score: result.score,
          total: result.total,
          passed: result.passed,
        }),
      });

      return json(result);
    }

    if (request.method === "GET" && path === "resources/clinics") {
      return json({ clinics: CLINICS });
    }

    return json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error(err);
    return json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
