import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sarTable = pgTable("sar", {
  id: text("id").primaryKey(),
  sarNumber: text("sar_number").notNull().unique(),
  caseId: text("case_id").notNull(),
  status: text("status").notNull().default("draft"),
  subjectName: text("subject_name").notNull(),
  subjectType: text("subject_type").notNull().default("individual"),
  reportingOfficer: text("reporting_officer").notNull(),
  filingInstitution: text("filing_institution").notNull(),
  suspiciousActivityType: text("suspicious_activity_type").notNull(),
  description: text("description").notNull(),
  amountInvolved: real("amount_involved").notNull().default(0),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSARSchema = createInsertSchema(sarTable).omit({ createdAt: true, updatedAt: true });
export type InsertSAR = z.infer<typeof insertSARSchema>;
export type SAR = typeof sarTable.$inferSelect;
