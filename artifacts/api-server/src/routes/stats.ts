import { Router, type IRouter } from "express";
import { db, assessmentsTable, chatMessagesTable, quizCompletionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res) => {
  const [{ count: totalAssessmentsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assessmentsTable);

  const distribution = await db
    .select({
      level: assessmentsTable.riskLevel,
      count: sql<number>`count(*)::int`,
    })
    .from(assessmentsTable)
    .groupBy(assessmentsTable.riskLevel);

  const [{ count: chatMessages }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessagesTable);

  const [{ count: modulesCompleted }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizCompletionsTable);

  res.json({
    totalAssessments: totalAssessmentsCount,
    riskDistribution: distribution.map((d) => ({ level: d.level, count: d.count })),
    modulesCompleted,
    chatMessages,
  });
});

export default router;
