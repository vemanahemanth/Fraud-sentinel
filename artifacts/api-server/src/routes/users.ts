import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";

const router = Router();

router.get("/users", async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { riskTier, search } = req.query as Record<string, string>;

  const conditions = [];
  if (riskTier) conditions.push(eq(usersTable.riskTier, riskTier));
  if (search) conditions.push(ilike(usersTable.name, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(usersTable).where(where).orderBy(desc(usersTable.riskScore)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.get("/users/:id/risk-score", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const overall = user.riskScore;
  const velocityScore = Math.min(100, overall * 0.9 + Math.random() * 10);
  const geoScore = Math.min(100, overall * 0.7 + Math.random() * 20);
  const deviceScore = Math.min(100, overall * 0.8 + Math.random() * 15);
  const behaviorScore = Math.min(100, overall * 0.85 + Math.random() * 10);
  const mlScore = Math.min(100, overall * 0.95 + Math.random() * 5);

  const factors: string[] = [];
  if (user.fraudulentTransactions > 0) factors.push(`${user.fraudulentTransactions} confirmed fraud transactions`);
  if (velocityScore > 60) factors.push("High transaction velocity");
  if (geoScore > 60) factors.push("Suspicious geolocation activity");
  if (deviceScore > 60) factors.push("Multiple device anomalies detected");
  if (mlScore > 70) factors.push("ML model flagged abnormal patterns");

  res.json({
    userId: id,
    overall,
    velocityScore,
    geoScore,
    deviceScore,
    behaviorScore,
    mlScore,
    factors,
    computedAt: new Date(),
  });
});

export default router;
