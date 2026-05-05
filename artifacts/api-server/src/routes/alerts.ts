import { Router } from "express";
import { db, alertsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;
  const { severity, status } = req.query as Record<string, string>;

  const conditions = [];
  if (severity) conditions.push(eq(alertsTable.severity, severity));
  if (status) conditions.push(eq(alertsTable.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(alertsTable).where(where).orderBy(desc(alertsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(alertsTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.get("/alerts/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, id));
  if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }
  res.json(alert);
});

router.post("/alerts/:id/acknowledge", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [alert] = await db.update(alertsTable).set({ status: "acknowledged", acknowledgedAt: new Date() }).where(eq(alertsTable.id, id)).returning();
  if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }
  res.json(alert);
});

router.post("/alerts/:id/resolve", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [alert] = await db.update(alertsTable).set({ status: "resolved", resolvedAt: new Date() }).where(eq(alertsTable.id, id)).returning();
  if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }
  res.json(alert);
});

export default router;
