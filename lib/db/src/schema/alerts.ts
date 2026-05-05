import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id"),
  userId: text("user_id"),
  type: text("type").notNull(),
  severity: text("severity").notNull().default("warning"),
  status: text("status").notNull().default("open"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ruleId: text("rule_id"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
