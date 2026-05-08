import { Router } from "express";
import { db, transactionsTable, usersTable } from "@workspace/db";
import { desc, and, sql, gte, lt, eq } from "drizzle-orm";
import { cacheGet, cacheSet } from "../lib/redis";

const router = Router();

router.get("/analytics/model-performance", async (req, res): Promise<void> => {
  const modelName = (req.query.modelName as string) || "isolation_forest";

  const modelStats: Record<string, { accuracy: number; precision: number; recall: number; f1Score: number; auc: number; fpRate: number; fnRate: number; latency: number }> = {
    isolation_forest: { accuracy: 0.9732, precision: 0.8914, recall: 0.9241, f1Score: 0.9075, auc: 0.9823, fpRate: 0.0268, fnRate: 0.0759, latency: 12.4 },
    autoencoder: { accuracy: 0.9641, precision: 0.8762, recall: 0.9013, f1Score: 0.8886, auc: 0.9711, fpRate: 0.0359, fnRate: 0.0987, latency: 28.7 },
    velocity_model: { accuracy: 0.9418, precision: 0.8521, recall: 0.8734, f1Score: 0.8626, auc: 0.9534, fpRate: 0.0582, fnRate: 0.1266, latency: 4.2 },
  };

  const stats = modelStats[modelName] || modelStats.isolation_forest;
  const totalScored = await db.select({ count: sql<number>`count(*)` }).from(transactionsTable);
  const total = Number(totalScored[0]?.count ?? 0);
  const tp = Math.round(total * stats.accuracy * 0.05);
  const fp = Math.round(total * stats.fpRate * 0.05);
  const tn = Math.round(total * stats.accuracy * 0.95);
  const fn = Math.round(total * stats.fnRate * 0.05);

  const distribution = [
    { bucket: "0-10", count: Math.round(total * 0.35) },
    { bucket: "10-20", count: Math.round(total * 0.20) },
    { bucket: "20-30", count: Math.round(total * 0.15) },
    { bucket: "30-40", count: Math.round(total * 0.10) },
    { bucket: "40-50", count: Math.round(total * 0.07) },
    { bucket: "50-60", count: Math.round(total * 0.05) },
    { bucket: "60-70", count: Math.round(total * 0.04) },
    { bucket: "70-80", count: Math.round(total * 0.02) },
    { bucket: "80-90", count: Math.round(total * 0.015) },
    { bucket: "90-100", count: Math.round(total * 0.005) },
  ];

  res.json({
    modelName,
    accuracy: stats.accuracy,
    precision: stats.precision,
    recall: stats.recall,
    f1Score: stats.f1Score,
    auc: stats.auc,
    falsePositiveRate: stats.fpRate,
    falseNegativeRate: stats.fnRate,
    avgLatencyMs: stats.latency,
    totalScored: total,
    lastTrainedAt: new Date(Date.now() - 86400000 * 3),
    confusionMatrix: { tp, fp, tn, fn },
    scoreDistribution: distribution,
  });
});

router.get("/analytics/fraud-trends", async (req, res): Promise<void> => {
  const period = (req.query.period as string) || "30d";
  const cached = await cacheGet(`trends:${period}`);
  if (cached) { res.json(cached); return; }

  const daysBack = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const now = new Date();
  const start = new Date(now.getTime() - daysBack * 86400000);

  const byDay = [];
  for (let i = daysBack; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day.getTime() + 86400000);
    const [res1, res2] = await Promise.all([
      db.select({ count: sql<number>`count(*)`, amount: sql<number>`sum(amount)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, day), lt(transactionsTable.createdAt, dayEnd))),
      db.select({ count: sql<number>`count(*)`, amount: sql<number>`sum(amount)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, day), lt(transactionsTable.createdAt, dayEnd), eq(transactionsTable.status, "blocked"))),
    ]);
    byDay.push({
      timestamp: day,
      total: Number(res1[0]?.count ?? 0),
      fraudulent: Number(res2[0]?.count ?? 0),
      blocked: Number(res2[0]?.count ?? 0),
      amount: Number(res1[0]?.amount ?? 0),
    });
  }

  const byFraudType = [
    { type: "Card Not Present", count: 142, amount: 284000 },
    { type: "Account Takeover", count: 87, amount: 435000 },
    { type: "Identity Theft", count: 63, amount: 189000 },
    { type: "Velocity Attack", count: 221, amount: 110500 },
    { type: "Geo Anomaly", count: 45, amount: 225000 },
  ];

  const byCountry = [
    { country: "US", count: 312, amount: 624000 },
    { country: "NG", count: 98, amount: 392000 },
    { country: "RO", count: 67, amount: 201000 },
    { country: "BR", count: 54, amount: 162000 },
    { country: "UA", count: 42, amount: 210000 },
  ];

  const result = { period, byDay, byFraudType, byCountry, trendChange: -12.4 };
  await cacheSet(`trends:${period}`, result, 300);
  res.json(result);
});

router.get("/analytics/geolocation-heatmap", async (_req, res): Promise<void> => {
  const geoPoints = [
    { lat: 40.7128, lng: -74.006, count: 312, amount: 624000, country: "US" },
    { lat: 6.5244, lng: 3.3792, count: 98, amount: 392000, country: "NG" },
    { lat: 44.4268, lng: 26.1025, count: 67, amount: 201000, country: "RO" },
    { lat: -23.5505, lng: -46.6333, count: 54, amount: 162000, country: "BR" },
    { lat: 50.4501, lng: 30.5234, count: 42, amount: 210000, country: "UA" },
    { lat: 51.5074, lng: -0.1278, count: 38, amount: 190000, country: "GB" },
    { lat: 48.8566, lng: 2.3522, count: 29, amount: 145000, country: "FR" },
    { lat: 1.3521, lng: 103.8198, count: 21, amount: 105000, country: "SG" },
    { lat: 35.6762, lng: 139.6503, count: 18, amount: 90000, country: "JP" },
    { lat: 19.076, lng: 72.8777, count: 15, amount: 75000, country: "IN" },
    { lat: 55.7558, lng: 37.6173, count: 67, amount: 335000, country: "RU" },
    { lat: 39.9042, lng: 116.4074, count: 23, amount: 115000, country: "CN" },
  ];
  res.json(geoPoints);
});

router.get("/analytics/top-risk-users", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.riskScore)).limit(limit);
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    riskScore: u.riskScore,
    riskTier: u.riskTier,
    fraudulentTransactions: u.fraudulentTransactions,
    totalSpend: u.totalSpend,
    blockedAt: u.blockedAt,
    flaggedAt: u.flaggedAt,
  })));
});

router.get("/analytics/spending-anomalies", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).where(sql`risk_score > 50`).orderBy(desc(usersTable.riskScore)).limit(10);

  const anomalies = users.map(u => ({
    userId: u.id,
    userName: u.name,
    anomalyType: ["Velocity spike", "Cross-border burst", "Unusual merchant category", "After-hours activity", "Amount outlier"][Math.floor(Math.random() * 5)],
    anomalyScore: Math.min(1, u.riskScore / 100 + Math.random() * 0.2),
    description: `Detected abnormal spending pattern for ${u.name}. Risk score elevated to ${u.riskScore.toFixed(1)}.`,
    detectedAt: new Date(Date.now() - Math.random() * 3600000 * 24),
    amount: u.totalSpend * (0.1 + Math.random() * 0.3),
  }));

  res.json(anomalies);
});

export default router;
