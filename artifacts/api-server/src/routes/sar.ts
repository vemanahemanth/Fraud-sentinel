import { Router } from "express";
import { db, sarTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/sar", async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { status } = req.query as Record<string, string>;

  const conditions = [];
  if (status) conditions.push(eq(sarTable.status, status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(sarTable).where(where).orderBy(desc(sarTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(sarTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/sar", async (req, res): Promise<void> => {
  const { caseId, subjectName, subjectType, reportingOfficer, filingInstitution, suspiciousActivityType, description, amountInvolved, startDate, endDate } = req.body;
  if (!caseId || !subjectName || !subjectType || !reportingOfficer || !filingInstitution || !suspiciousActivityType || !description || amountInvolved == null || !startDate || !endDate) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const sarNumber = `SAR-${Date.now().toString(36).toUpperCase()}`;
  const [sar] = await db.insert(sarTable).values({
    id: uuidv4(),
    sarNumber, caseId, subjectName, subjectType, reportingOfficer, filingInstitution,
    suspiciousActivityType, description, amountInvolved,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: "draft",
  }).returning();

  res.status(201).json(sar);
});

router.get("/sar/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [sar] = await db.select().from(sarTable).where(eq(sarTable.id, id));
  if (!sar) { res.status(404).json({ error: "SAR not found" }); return; }
  res.json(sar);
});

router.patch("/sar/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { description, amountInvolved, suspiciousActivityType, reportingOfficer } = req.body;
  const updates: Record<string, unknown> = {};
  if (description) updates.description = description;
  if (amountInvolved !== undefined) updates.amountInvolved = amountInvolved;
  if (suspiciousActivityType) updates.suspiciousActivityType = suspiciousActivityType;
  if (reportingOfficer) updates.reportingOfficer = reportingOfficer;

  const [sar] = await db.update(sarTable).set(updates).where(eq(sarTable.id, id)).returning();
  if (!sar) { res.status(404).json({ error: "SAR not found" }); return; }
  res.json(sar);
});

router.post("/sar/:id/submit", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [sar] = await db.update(sarTable).set({ status: "submitted", submittedAt: new Date() }).where(eq(sarTable.id, id)).returning();
  if (!sar) { res.status(404).json({ error: "SAR not found" }); return; }
  res.json(sar);
});

export default router;
