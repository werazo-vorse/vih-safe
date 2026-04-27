import { Router, type IRouter } from "express";
import { db, chatMessagesTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { openai } from "../lib/openai.js";

const router: IRouter = Router();

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

router.post("/chatbot/message", async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const { messages } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsedReply: { reply?: string; suggestions?: string[] };
    try {
      parsedReply = JSON.parse(raw);
    } catch {
      parsedReply = { reply: raw, suggestions: [] };
    }

    const reply = parsedReply.reply?.trim() || "Lo siento, no pude generar una respuesta. ¿Puedes reformular tu pregunta?";
    const suggestions = Array.isArray(parsedReply.suggestions) ? parsedReply.suggestions.slice(0, 3) : [];

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      await db.insert(chatMessagesTable).values([
        { role: "user", content: lastUser.content },
        { role: "assistant", content: reply },
      ]);
    }

    res.json({ reply, suggestions });
  } catch (err) {
    req.log.error({ err }, "Chatbot error");
    res.status(500).json({
      error: "Hubo un problema con el asistente. Por favor intenta de nuevo en un momento.",
    });
  }
});

export default router;
