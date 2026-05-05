import { Router } from "express";
import { db, merchantsTable } from "@workspace/db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/merchants", async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { status, search } = req.query as Record<string, string>;

  const conditions = [];
  if (status) conditions.push(eq(merchantsTable.status, status));
  if (search) conditions.push(ilike(merchantsTable.name, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(merchantsTable).where(where).orderBy(desc(merchantsTable.fraudRate)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(merchantsTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/merchants", async (req, res): Promise<void> => {
  const { name, category, country } = req.body;
  if (!name || !category || !country) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [merchant] = await db.insert(merchantsTable).values({ id: uuidv4(), name, category, country, status: "active", fraudRate: 0, totalTransactions: 0 }).returning();
  res.status(201).json(merchant);
});

router.post("/merchants/:id/block", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { reason } = req.body;
  if (!reason) { res.status(400).json({ error: "Reason is required" }); return; }
  const [merchant] = await db.update(merchantsTable).set({ status: "blocked", blockedReason: reason, blockedAt: new Date() }).where(eq(merchantsTable.id, id)).returning();
  if (!merchant) { res.status(404).json({ error: "Merchant not found" }); return; }
  res.json(merchant);
});

router.post("/merchants/:id/unblock", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [merchant] = await db.update(merchantsTable).set({ status: "active", blockedReason: null, blockedAt: null }).where(eq(merchantsTable.id, id)).returning();
  if (!merchant) { res.status(404).json({ error: "Merchant not found" }); return; }
  res.json(merchant);
});

export default router;
