import { Router } from "express";
import { db, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { scoreTransaction } from "../lib/fraud-engine";
import { cacheGet, cacheSet } from "../lib/redis";

const router = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;
  const { status, riskLevel, startDate, endDate, cardId } = req.query as Record<string, string>;

  const cacheKey = `transactions:${JSON.stringify(req.query)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) { res.json(cached); return; }

  const conditions = [];
  if (status) conditions.push(eq(transactionsTable.status, status));
  if (riskLevel) conditions.push(eq(transactionsTable.riskLevel, riskLevel));
  if (cardId) conditions.push(eq(transactionsTable.cardId, cardId));
  if (startDate) conditions.push(gte(transactionsTable.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(transactionsTable.createdAt, new Date(endDate)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(transactionsTable).where(where).orderBy(desc(transactionsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const result = { data: rows.map(mapTx), total, page, limit, totalPages: Math.ceil(total / limit) };
  await cacheSet(cacheKey, result, 5);
  res.json(result);
});

router.post("/transactions", async (req, res): Promise<void> => {
  const { cardId, userId, merchantId, merchantName, amount, currency, location, deviceFingerprint } = req.body;
  if (!cardId || !userId || !merchantId || !merchantName || !amount || !currency) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const scoring = await scoreTransaction({ cardId, userId, merchantId, merchantName, amount, currency, location, deviceFingerprint });

  const [tx] = await db.insert(transactionsTable).values({
    id: scoring.transactionId,
    cardId, userId, merchantId, merchantName, amount, currency,
    status: scoring.decision === "approved" ? "approved" : scoring.decision === "blocked" ? "blocked" : "flagged",
    riskScore: scoring.riskScore,
    riskLevel: scoring.riskLevel,
    country: location?.country ?? "US",
    city: location?.city ?? "Unknown",
    lat: location?.lat,
    lng: location?.lng,
    deviceFingerprint: deviceFingerprint ?? null,
    responseTime: scoring.responseTimeMs,
    triggeredRules: scoring.triggeredRules,
  }).returning();

  res.json({
    transactionId: scoring.transactionId,
    decision: scoring.decision,
    riskScore: scoring.riskScore,
    riskLevel: scoring.riskLevel,
    responseTimeMs: scoring.responseTimeMs,
    triggeredRules: scoring.triggeredRules,
    explanation: scoring.explanation,
  });
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  if (!tx) { res.status(404).json({ error: "Transaction not found" }); return; }
  res.json(mapTx(tx));
});

router.post("/transactions/:id/review", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { decision, notes, reviewerId } = req.body;
  if (!decision || !reviewerId) { res.status(400).json({ error: "Missing decision or reviewerId" }); return; }

  const [tx] = await db.update(transactionsTable).set({
    reviewDecision: decision,
    reviewNotes: notes ?? null,
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    status: "flagged",
  }).where(eq(transactionsTable.id, id)).returning();

  if (!tx) { res.status(404).json({ error: "Transaction not found" }); return; }
  res.json(mapTx(tx));
});

function mapTx(tx: typeof transactionsTable.$inferSelect) {
  return {
    id: tx.id,
    cardId: tx.cardId,
    userId: tx.userId,
    merchantId: tx.merchantId,
    merchantName: tx.merchantName,
    amount: tx.amount,
    currency: tx.currency,
    status: tx.status,
    riskScore: tx.riskScore,
    riskLevel: tx.riskLevel,
    fraudType: tx.fraudType ?? null,
    location: { country: tx.country, city: tx.city, lat: tx.lat ?? 0, lng: tx.lng ?? 0, ipAddress: tx.ipAddress ?? null },
    deviceFingerprint: tx.deviceFingerprint ?? null,
    responseTime: tx.responseTime,
    triggeredRules: tx.triggeredRules ?? [],
    anomalyScore: tx.anomalyScore ?? null,
    createdAt: tx.createdAt,
    reviewedBy: tx.reviewedBy ?? null,
    reviewedAt: tx.reviewedAt ?? null,
    reviewDecision: tx.reviewDecision ?? null,
    reviewNotes: tx.reviewNotes ?? null,
  };
}

export default router;
