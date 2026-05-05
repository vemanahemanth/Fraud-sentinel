import { pgTable, text, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rulesTable = pgTable("rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(5),
  action: text("action").notNull().default("flag"),
  conditions: jsonb("conditions").notNull().default({}),
  triggeredCount: integer("triggered_count").notNull().default(0),
  falsePositiveRate: real("false_positive_rate"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRuleSchema = createInsertSchema(rulesTable).omit({ createdAt: true, updatedAt: true });
export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Rule = typeof rulesTable.$inferSelect;
