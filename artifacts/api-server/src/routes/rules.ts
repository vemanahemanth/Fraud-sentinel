import { Router } from "express";
import { db, rulesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/rules", async (_req, res): Promise<void> => {
  const rules = await db.select().from(rulesTable).orderBy(asc(rulesTable.priority));
  res.json(rules);
});

router.post("/rules", async (req, res): Promise<void> => {
  const { name, description, type, priority, action, conditions } = req.body;
  if (!name || !description || !type || priority == null || !action || !conditions) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [rule] = await db.insert(rulesTable).values({
    id: uuidv4(),
    name, description, type, priority, action, conditions,
    enabled: true,
    triggeredCount: 0,
  }).returning();
  res.status(201).json(rule);
});

router.patch("/rules/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, description, enabled, priority, action, conditions } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (description) updates.description = description;
  if (enabled !== undefined) updates.enabled = enabled;
  if (priority !== undefined) updates.priority = priority;
  if (action) updates.action = action;
  if (conditions) updates.conditions = conditions;

  const [rule] = await db.update(rulesTable).set(updates).where(eq(rulesTable.id, id)).returning();
  if (!rule) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json(rule);
});

router.delete("/rules/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [deleted] = await db.delete(rulesTable).where(eq(rulesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Rule not found" }); return; }
  res.sendStatus(204);
});

router.post("/rules/:id/toggle", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(rulesTable).where(eq(rulesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Rule not found" }); return; }
  const [rule] = await db.update(rulesTable).set({ enabled: !existing.enabled }).where(eq(rulesTable.id, id)).returning();
  res.json(rule);
});

export default router;
