import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const casesTable = pgTable("cases", {
  id: text("id").primaryKey(),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  fraudType: text("fraud_type").notNull(),
  estimatedLoss: real("estimated_loss").notNull().default(0),
  confirmedLoss: real("confirmed_loss"),
  assigneeId: text("assignee_id"),
  assigneeName: text("assignee_name"),
  transactionIds: text("transaction_ids").array().notNull().default([]),
  alertIds: text("alert_ids").array().notNull().default([]),
  sarId: text("sar_id"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const caseNotesTable = pgTable("case_notes", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ createdAt: true, updatedAt: true });
export const insertCaseNoteSchema = createInsertSchema(caseNotesTable).omit({ createdAt: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
export type InsertCaseNote = z.infer<typeof insertCaseNoteSchema>;
export type CaseNote = typeof caseNotesTable.$inferSelect;
