import { Router, type IRouter } from "express";
import { db, customersTable, shipmentsTable, savedShipmentsTable } from "@workspace/db";
import { eq, or, ilike, and, count, desc } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

// ── Current customer profile ──────────────────────────────────────────────────
router.get("/customers/me", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!customer) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(customer);
});

router.patch("/customers/me", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [existing] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!existing) { res.status(404).json({ error: "Profile not found" }); return; }

  const body = req.body;
  const [updated] = await db.update(customersTable).set({
    ...(body.firstName !== undefined && { firstName: body.firstName }),
    ...(body.lastName !== undefined && { lastName: body.lastName }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.country !== undefined && { country: body.country }),
    ...(body.notifyEmail !== undefined && { notifyEmail: body.notifyEmail }),
    ...(body.notifySms !== undefined && { notifySms: body.notifySms }),
  }).where(eq(customersTable.id, existing.id)).returning();

  res.json(updated);
});

// ── Saved shipments ───────────────────────────────────────────────────────────
router.get("/customers/me/saved-shipments", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!customer) { res.json([]); return; }

  const saved = await db.select().from(savedShipmentsTable).where(eq(savedShipmentsTable.customerId, customer.id)).orderBy(desc(savedShipmentsTable.createdAt));

  const result = await Promise.all(saved.map(async (s) => {
    const [shipment] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, s.shipmentId)).limit(1);
    return { ...s, shipment: shipment ?? null };
  }));

  res.json(result);
});

router.post("/customers/me/saved-shipments", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  let [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!customer) {
    // Auto-provision customer record
    const email = (auth as Record<string, unknown> & { primaryEmailAddress?: { emailAddress: string } }).primaryEmailAddress?.emailAddress ?? `${auth.userId}@unknown.com`;
    const rows = await db.insert(customersTable).values({ clerkId: auth.userId, email, firstName: "Customer", lastName: "" }).returning();
    customer = rows[0];
  }

  const { shipmentId, nickname } = req.body;
  if (!shipmentId) { res.status(400).json({ error: "shipmentId is required" }); return; }

  const [row] = await db.insert(savedShipmentsTable).values({ customerId: customer.id, shipmentId, nickname: nickname ?? null }).returning();
  const [shipment] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, shipmentId)).limit(1);
  res.status(201).json({ ...row, shipment: shipment ?? null });
});

router.delete("/customers/me/saved-shipments/:savedId", requireAuth, async (req, res): Promise<void> => {
  const savedId = Array.isArray(req.params.savedId) ? req.params.savedId[0] : req.params.savedId;
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Resolve customer to enforce ownership — only delete if it belongs to this customer
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!customer) { res.status(404).json({ error: "Not found" }); return; }

  const deleted = await db.delete(savedShipmentsTable)
    .where(and(eq(savedShipmentsTable.id, savedId), eq(savedShipmentsTable.customerId, customer.id)))
    .returning();
  if (deleted.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// ── Admin customer management ─────────────────────────────────────────────────
router.get("/customers", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const { search } = req.query;

  const conditions = [];
  if (search) {
    const term = `%${search}%`;
    conditions.push(or(ilike(customersTable.email, term), ilike(customersTable.firstName, term), ilike(customersTable.lastName, term)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [data, totalResult] = await Promise.all([
    db.select().from(customersTable).where(where).orderBy(desc(customersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(customersTable).where(where),
  ]);
  res.json({ data, total: Number(totalResult[0]?.count ?? 0), page, limit });
});

router.post("/customers", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.email || !body.firstName || !body.lastName) {
    res.status(400).json({ error: "email, firstName, lastName are required" });
    return;
  }
  const [customer] = await db.insert(customersTable).values({
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone || null,
    country: body.country || null,
    clerkId: body.clerkId || null,
    notifyEmail: body.notifyEmail ?? true,
    notifySms: body.notifySms ?? false,
  }).returning();

  await writeAuditLog(req, { action: "create", entityType: "customer", entityId: customer.id, description: `Created customer ${customer.email}` });
  res.status(201).json(customer);
});

router.get("/customers/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  res.json(customer);
});

router.patch("/customers/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Customer not found" }); return; }

  const body = req.body;
  const [updated] = await db.update(customersTable).set({
    ...(body.email !== undefined && { email: body.email }),
    ...(body.firstName !== undefined && { firstName: body.firstName }),
    ...(body.lastName !== undefined && { lastName: body.lastName }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.country !== undefined && { country: body.country }),
    ...(body.notifyEmail !== undefined && { notifyEmail: body.notifyEmail }),
    ...(body.notifySms !== undefined && { notifySms: body.notifySms }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  }).where(eq(customersTable.id, id)).returning();

  await writeAuditLog(req, { action: "update", entityType: "customer", entityId: id, oldValue: existing, newValue: body });
  res.json(updated);
});

router.delete("/customers/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Customer not found" }); return; }
  await db.delete(customersTable).where(eq(customersTable.id, id));
  await writeAuditLog(req, { action: "delete", entityType: "customer", entityId: id, description: `Deleted customer ${existing.email}` });
  res.sendStatus(204);
});

export default router;
