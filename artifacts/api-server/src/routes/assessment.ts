import { Router, type IRouter } from "express";
import { db, assessmentsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { SubmitAssessmentBody } from "@workspace/api-zod";
import { QUESTIONS } from "../data/questions.js";
import { computeScore } from "../lib/scoring.js";

const router: IRouter = Router();

router.get("/assessment/questions", (_req, res) => {
  res.json({ questions: QUESTIONS });
});

router.post("/assessment/submit", async (req, res) => {
  const parsed = SubmitAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid submission", details: parsed.error.issues });
    return;
  }
  const { answers } = parsed.data;
  const result = computeScore(answers as { questionId: string; value: string | number | string[] }[]);

  const [row] = await db
    .insert(assessmentsTable)
    .values({
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      ageRange: result.ageRange,
      answers: answers,
      domainScores: result.domainScores,
      factors: result.factors,
    })
    .returning();

  return res.json({
    id: row.id,
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    summary: result.summary,
    recommendations: result.recommendations,
    factors: result.factors,
    domainScores: result.domainScores,
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/assessment/recent", async (_req, res) => {
  const rows = await db
    .select({
      id: assessmentsTable.id,
      riskLevel: assessmentsTable.riskLevel,
      ageRange: assessmentsTable.ageRange,
      createdAt: assessmentsTable.createdAt,
    })
    .from(assessmentsTable)
    .orderBy(desc(assessmentsTable.createdAt))
    .limit(10);

  res.json({
    items: rows.map((r) => ({
      id: r.id,
      riskLevel: r.riskLevel,
      ageRange: r.ageRange,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

export default router;
