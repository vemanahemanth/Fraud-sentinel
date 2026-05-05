import { Router } from "express";
import { db, casesTable, caseNotesTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/cases", async (req, res): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { status, priority, assigneeId } = req.query as Record<string, string>;

  const conditions = [];
  if (status) conditions.push(eq(casesTable.status, status));
  if (priority) conditions.push(eq(casesTable.priority, priority));
  if (assigneeId) conditions.push(eq(casesTable.assigneeId, assigneeId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(casesTable).where(where).orderBy(desc(casesTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(casesTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const casesWithNotes = await Promise.all(rows.map(async (c) => {
    const notes = await db.select().from(caseNotesTable).where(eq(caseNotesTable.caseId, c.id)).orderBy(desc(caseNotesTable.createdAt));
    return { ...c, notes };
  }));

  res.json({ data: casesWithNotes, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/cases", async (req, res): Promise<void> => {
  const { title, description, fraudType, priority, transactionIds, alertIds, assigneeId, estimatedLoss } = req.body;
  if (!title || !description || !fraudType || !priority || estimatedLoss == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}`;
  const [c] = await db.insert(casesTable).values({
    id: uuidv4(),
    caseNumber,
    title, description, fraudType, priority,
    transactionIds: transactionIds ?? [],
    alertIds: alertIds ?? [],
    assigneeId: assigneeId ?? null,
    estimatedLoss,
    status: "open",
  }).returning();

  res.status(201).json({ ...c, notes: [] });
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [c] = await db.select().from(casesTable).where(eq(casesTable.id, id));
  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  const notes = await db.select().from(caseNotesTable).where(eq(caseNotesTable.caseId, id)).orderBy(desc(caseNotesTable.createdAt));
  res.json({ ...c, notes });
});

router.patch("/cases/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, description, status, priority, assigneeId, confirmedLoss } = req.body;
  const updates: Record<string, unknown> = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (status) updates.status = status;
  if (priority) updates.priority = priority;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId;
  if (confirmedLoss !== undefined) updates.confirmedLoss = confirmedLoss;
  if (status === "closed") updates.closedAt = new Date();

  const [c] = await db.update(casesTable).set(updates).where(eq(casesTable.id, id)).returning();
  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  const notes = await db.select().from(caseNotesTable).where(eq(caseNotesTable.caseId, id)).orderBy(desc(caseNotesTable.createdAt));
  res.json({ ...c, notes });
});

router.post("/cases/:id/notes", async (req, res): Promise<void> => {
  const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { authorId, authorName, content } = req.body;
  if (!authorId || !authorName || content == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [note] = await db.insert(caseNotesTable).values({ id: uuidv4(), caseId, authorId, authorName, content }).returning();
  res.status(201).json(note);
});

export default router;
