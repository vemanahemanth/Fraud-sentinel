import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  riskScore: real("risk_score").notNull().default(0),
  riskTier: text("risk_tier").notNull().default("low"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  fraudulentTransactions: integer("fraudulent_transactions").notNull().default(0),
  totalSpend: real("total_spend").notNull().default(0),
  cardCount: integer("card_count").notNull().default(1),
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
  flaggedAt: timestamp("flagged_at", { withTimezone: true }),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
