import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff, requireRole } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();

router.get("/users/me", requireAuth, requireUserRecord, async (req, res): Promise<void> => {
  res.json(req.currentUser);
});

router.get("/users", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (req.query.role) conditions.push(eq(usersTable.role, req.query.role as "super_admin"));

  const where = conditions.length > 0 ? conditions[0] : undefined;
  const [data, totalResult] = await Promise.all([
    db.select().from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(usersTable).where(where),
  ]);
  res.json({ data, total: Number(totalResult[0]?.count ?? 0), page, limit });
});

router.post("/users", requireAuth, requireUserRecord, requireRole("super_admin"), async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.clerkId || !body.email || !body.firstName || !body.lastName || !body.role) {
    res.status(400).json({ error: "clerkId, email, firstName, lastName, role are required" });
    return;
  }
  const [user] = await db.insert(usersTable).values({
    clerkId: body.clerkId,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone || null,
    role: body.role,
  }).returning();

  await writeAuditLog(req, { action: "create", entityType: "user", entityId: user.id, description: `Created user ${user.email} with role ${user.role}` });
  res.status(201).json(user);
});

router.get("/users/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.patch("/users/:id", requireAuth, requireUserRecord, requireRole("super_admin"), async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "User not found" }); return; }

  const body = req.body;
  const [updated] = await db.update(usersTable).set({
    ...(body.email !== undefined && { email: body.email }),
    ...(body.firstName !== undefined && { firstName: body.firstName }),
    ...(body.lastName !== undefined && { lastName: body.lastName }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.role !== undefined && { role: body.role }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  }).where(eq(usersTable.id, id)).returning();

  await writeAuditLog(req, { action: "update", entityType: "user", entityId: id, oldValue: { role: existing.role, isActive: existing.isActive }, newValue: body, description: `Updated user ${existing.email}` });
  res.json(updated);
});

router.delete("/users/:id", requireAuth, requireUserRecord, requireRole("super_admin"), async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "User not found" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  await writeAuditLog(req, { action: "delete", entityType: "user", entityId: id, description: `Deleted user ${existing.email}` });
  res.sendStatus(204);
});

export default router;
