import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const merchantsTable = pgTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  country: text("country").notNull(),
  status: text("status").notNull().default("active"),
  fraudRate: real("fraud_rate").notNull().default(0),
  totalTransactions: integer("total_transactions").notNull().default(0),
  blockedReason: text("blocked_reason"),
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMerchantSchema = createInsertSchema(merchantsTable).omit({ createdAt: true });
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchantsTable.$inferSelect;
