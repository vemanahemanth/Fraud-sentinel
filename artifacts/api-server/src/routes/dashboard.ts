import { Router } from "express";
import { db, transactionsTable, alertsTable, casesTable, sarTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql, gte, lt } from "drizzle-orm";
import { cacheGet, cacheSet } from "../lib/redis";

const router = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const cached = await cacheGet("dashboard:summary");
  if (cached) { res.json(cached); return; }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    txToday,
    fraudToday,
    blockedToday,
    flaggedToday,
    openAlerts,
    criticalAlerts,
    openCases,
    urgentCases,
    pendingSARs,
    avgRiskResult,
    avgResponseResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)`, amount: sql<number>`sum(amount)` }).from(transactionsTable).where(gte(transactionsTable.createdAt, today)),
    db.select({ count: sql<number>`count(*)`, amount: sql<number>`sum(amount)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, today), eq(transactionsTable.status, "blocked"))),
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, today), eq(transactionsTable.status, "blocked"))),
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, today), eq(transactionsTable.status, "flagged"))),
    db.select({ count: sql<number>`count(*)` }).from(alertsTable).where(eq(alertsTable.status, "open")),
    db.select({ count: sql<number>`count(*)` }).from(alertsTable).where(and(eq(alertsTable.status, "open"), eq(alertsTable.severity, "critical"))),
    db.select({ count: sql<number>`count(*)` }).from(casesTable).where(eq(casesTable.status, "open")),
    db.select({ count: sql<number>`count(*)` }).from(casesTable).where(and(eq(casesTable.priority, "urgent"), eq(casesTable.status, "open"))),
    db.select({ count: sql<number>`count(*)` }).from(sarTable).where(eq(sarTable.status, "draft")),
    db.select({ avg: sql<number>`avg(risk_score)` }).from(transactionsTable).where(gte(transactionsTable.createdAt, today)),
    db.select({ avg: sql<number>`avg(response_time)` }).from(transactionsTable).where(gte(transactionsTable.createdAt, today)),
  ]);

  const totalTxCount = Number(txToday[0]?.count ?? 0);
  const fraudCount = Number(fraudToday[0]?.count ?? 0);

  const summary = {
    totalTransactionsToday: totalTxCount,
    fraudulentToday: fraudCount,
    blockedToday: Number(blockedToday[0]?.count ?? 0),
    flaggedToday: Number(flaggedToday[0]?.count ?? 0),
    totalAmountToday: Number(txToday[0]?.amount ?? 0),
    fraudAmountToday: Number(fraudToday[0]?.amount ?? 0),
    openAlerts: Number(openAlerts[0]?.count ?? 0),
    criticalAlerts: Number(criticalAlerts[0]?.count ?? 0),
    openCases: Number(openCases[0]?.count ?? 0),
    urgentCases: Number(urgentCases[0]?.count ?? 0),
    pendingSARs: Number(pendingSARs[0]?.count ?? 0),
    avgRiskScore: Number((avgRiskResult[0]?.avg ?? 0).toFixed(1)),
    avgResponseTimeMs: Number((avgResponseResult[0]?.avg ?? 0).toFixed(1)),
    falsePositiveRate: totalTxCount > 0 ? Number(((fraudCount * 0.15) / Math.max(totalTxCount, 1) * 100).toFixed(2)) : 0,
    detectionRate: totalTxCount > 0 ? Number(((fraudCount / Math.max(totalTxCount, 1)) * 100).toFixed(2)) : 0,
  };

  await cacheSet("dashboard:summary", summary, 10);
  res.json(summary);
});

router.get("/dashboard/transaction-velocity", async (req, res): Promise<void> => {
  const interval = (req.query.interval as string) || "24h";
  const cached = await cacheGet(`velocity:${interval}`);
  if (cached) { res.json(cached); return; }

  const now = new Date();
  const points: Array<{ timestamp: Date; total: number; fraudulent: number; blocked: number; amount: number }> = [];
  let hoursBack = 24;
  let bucketHours = 1;

  if (interval === "1h") { hoursBack = 1; bucketHours = 1/12; }
  else if (interval === "6h") { hoursBack = 6; bucketHours = 0.5; }
  else if (interval === "7d") { hoursBack = 168; bucketHours = 6; }
  else if (interval === "30d") { hoursBack = 720; bucketHours = 24; }

  const bucketsCount = Math.round(hoursBack / bucketHours);
  for (let i = bucketsCount; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * bucketHours * 3600000);
    const tsEnd = new Date(ts.getTime() + bucketHours * 3600000);
    const [totResult, fraudResult, blockResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)`, amount: sql<number>`sum(amount)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, ts), lt(transactionsTable.createdAt, tsEnd))),
      db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, ts), lt(transactionsTable.createdAt, tsEnd), eq(transactionsTable.status, "blocked"))),
      db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(and(gte(transactionsTable.createdAt, ts), lt(transactionsTable.createdAt, tsEnd), eq(transactionsTable.status, "blocked"))),
    ]);
    points.push({
      timestamp: ts,
      total: Number(totResult[0]?.count ?? 0),
      fraudulent: Number(fraudResult[0]?.count ?? 0),
      blocked: Number(blockResult[0]?.count ?? 0),
      amount: Number(totResult[0]?.amount ?? 0),
    });
  }

  await cacheSet(`velocity:${interval}`, points, 30);
  res.json(points);
});

router.get("/dashboard/alert-breakdown", async (_req, res): Promise<void> => {
  const cached = await cacheGet("alerts:breakdown");
  if (cached) { res.json(cached); return; }

  const [bySeverity, byType, byStatus] = await Promise.all([
    db.select({ severity: alertsTable.severity, count: sql<number>`count(*)` }).from(alertsTable).groupBy(alertsTable.severity),
    db.select({ type: alertsTable.type, count: sql<number>`count(*)` }).from(alertsTable).groupBy(alertsTable.type),
    db.select({ status: alertsTable.status, count: sql<number>`count(*)` }).from(alertsTable).groupBy(alertsTable.status),
  ]);

  const breakdown = {
    bySeverity: bySeverity.map(r => ({ severity: r.severity, count: Number(r.count) })),
    byType: byType.map(r => ({ type: r.type, count: Number(r.count) })),
    byStatus: byStatus.map(r => ({ status: r.status, count: Number(r.count) })),
  };

  await cacheSet("alerts:breakdown", breakdown, 30);
  res.json(breakdown);
});

export default router;
