import { pgTable, text, integer, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const assessmentsTable = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  riskLevel: text("risk_level").notNull(),
  riskScore: integer("risk_score").notNull(),
  ageRange: text("age_range").notNull(),
  answers: jsonb("answers").notNull(),
  domainScores: jsonb("domain_scores").notNull(),
  factors: jsonb("factors").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Assessment = typeof assessmentsTable.$inferSelect;
export type InsertAssessment = typeof assessmentsTable.$inferInsert;
