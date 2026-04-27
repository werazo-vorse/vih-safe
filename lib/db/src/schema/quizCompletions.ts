import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const quizCompletionsTable = pgTable("quiz_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: text("module_id").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
