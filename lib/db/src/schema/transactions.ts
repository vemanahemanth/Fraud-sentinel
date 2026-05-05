import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull(),
  userId: text("user_id").notNull(),
  merchantId: text("merchant_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("approved"),
  riskScore: real("risk_score").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("low"),
  fraudType: text("fraud_type"),
  country: text("country").notNull().default("US"),
  city: text("city").notNull().default("Unknown"),
  lat: real("lat"),
  lng: real("lng"),
  ipAddress: text("ip_address"),
  deviceFingerprint: text("device_fingerprint"),
  responseTime: real("response_time").notNull().default(0),
  triggeredRules: text("triggered_rules").array().notNull().default([]),
  anomalyScore: real("anomaly_score"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewDecision: text("review_decision"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
