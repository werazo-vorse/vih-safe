import { Router, type IRouter } from "express";
import { db, quizCompletionsTable } from "@workspace/db";
import { SubmitQuizBody } from "@workspace/api-zod";
import { EDUCATION_MODULES } from "../data/education.js";

const router: IRouter = Router();

router.get("/education/modules", (_req, res) => {
  const modules = EDUCATION_MODULES.map(({ id, title, description, durationMinutes, category, icon }) => ({
    id,
    title,
    description,
    durationMinutes,
    category,
    icon,
  }));
  res.json({ modules });
});

router.get("/education/modules/:moduleId", (req, res) => {
  const moduleId = req.params["moduleId"];
  const mod = EDUCATION_MODULES.find((m) => m.id === moduleId);
  if (!mod) {
    res.status(404).json({ error: "Module not found" });
    return;
  }
  res.json(mod);
});

router.post("/education/quiz/submit", async (req, res) => {
  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid submission", details: parsed.error.issues });
    return;
  }
  const { moduleId, answers } = parsed.data;
  const mod = EDUCATION_MODULES.find((m) => m.id === moduleId);
  if (!mod) {
    res.status(404).json({ error: "Module not found" });
    return;
  }

  let score = 0;
  const feedback = mod.quiz.map((q) => {
    const submitted = answers.find((a) => a.questionId === q.id);
    const correct = submitted?.selectedOption === q.correctOption;
    if (correct) score += 1;
    return { questionId: q.id, correct, explanation: q.explanation ?? "" };
  });
  const total = mod.quiz.length;
  const passed = total > 0 && score / total >= 0.7;

  await db.insert(quizCompletionsTable).values({
    moduleId,
    score,
    total,
    passed,
  });

  res.json({ score, total, passed, feedback });
});

export default router;
