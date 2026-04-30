import { Router, type IRouter } from "express";
import { db, assessmentsTable, chatMessagesTable, quizCompletionsTable } from "@workspace/db";
import { count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res) => {
  const [totalRow] = await db
    .select({ value: count() })
    .from(assessmentsTable);

  const distribution = await db
    .select({
      level: assessmentsTable.riskLevel,
      value: count(),
    })
    .from(assessmentsTable)
    .groupBy(assessmentsTable.riskLevel);

  const [chatRow] = await db
    .select({ value: count() })
    .from(chatMessagesTable);

  const [quizRow] = await db
    .select({ value: count() })
    .from(quizCompletionsTable);

  res.json({
    totalAssessments: totalRow?.value ?? 0,
    riskDistribution: distribution.map((d) => ({ level: d.level, count: d.value })),
    modulesCompleted: quizRow?.value ?? 0,
    chatMessages: chatRow?.value ?? 0,
  });
});

export default router;
