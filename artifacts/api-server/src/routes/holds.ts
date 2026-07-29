import { Router, type IRouter } from "express";
import { db, shipmentsTable, holdsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();

router.get("/shipments/:id/holds", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const holds = await db.select().from(holdsTable).where(eq(holdsTable.shipmentId, id)).orderBy(desc(holdsTable.createdAt));
  res.json(holds);
});

router.post("/shipments/:id/holds", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body;

  if (!body.reason || !body.publicMessage) {
    res.status(400).json({ error: "reason and publicMessage are required" });
    return;
  }

  // Release any existing active holds
  await db.update(holdsTable).set({ isActive: false, resolvedAt: new Date() }).where(and(eq(holdsTable.shipmentId, id), eq(holdsTable.isActive, true)));

  const [hold] = await db.insert(holdsTable).values({
    shipmentId: id,
    reason: body.reason,
    publicMessage: body.publicMessage,
    internalNote: body.internalNote || null,
    expectedResolutionDate: body.expectedResolutionDate ? new Date(body.expectedResolutionDate) : null,
    location: body.location || null,
    facility: body.facility || null,
    city: body.city || null,
    country: body.country || null,
    notifyCustomer: body.notifyCustomer ?? true,
    isActive: true,
  }).returning();

  // Mark shipment as held
  await db.update(shipmentsTable).set({ isHeld: true, status: "package_hold" }).where(eq(shipmentsTable.id, id));

  await writeAuditLog(req, {
    action: "place_hold",
    entityType: "hold",
    entityId: hold.id,
    newValue: { reason: hold.reason },
    description: `Placed hold on shipment: ${hold.reason}`,
  });

  res.status(201).json(hold);
});

router.patch("/shipments/:id/holds/:holdId", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const holdId = Array.isArray(req.params.holdId) ? req.params.holdId[0] : req.params.holdId;
  const body = req.body;

  const [existing] = await db.select().from(holdsTable).where(eq(holdsTable.id, holdId)).limit(1);
  if (!existing) { res.status(404).json({ error: "Hold not found" }); return; }

  const [updated] = await db.update(holdsTable).set({
    ...(body.reason !== undefined && { reason: body.reason }),
    ...(body.publicMessage !== undefined && { publicMessage: body.publicMessage }),
    ...(body.internalNote !== undefined && { internalNote: body.internalNote }),
    ...(body.expectedResolutionDate !== undefined && { expectedResolutionDate: body.expectedResolutionDate ? new Date(body.expectedResolutionDate) : null }),
    ...(body.location !== undefined && { location: body.location }),
    ...(body.facility !== undefined && { facility: body.facility }),
    ...(body.city !== undefined && { city: body.city }),
    ...(body.country !== undefined && { country: body.country }),
    ...(body.notifyCustomer !== undefined && { notifyCustomer: body.notifyCustomer }),
  }).where(eq(holdsTable.id, holdId)).returning();

  await writeAuditLog(req, { action: "update_hold", entityType: "hold", entityId: holdId, oldValue: existing, newValue: body });
  res.json(updated);
});

router.post("/shipments/:id/holds/:holdId/release", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const shipmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const holdId = Array.isArray(req.params.holdId) ? req.params.holdId[0] : req.params.holdId;

  const [hold] = await db.update(holdsTable).set({ isActive: false, resolvedAt: new Date() }).where(eq(holdsTable.id, holdId)).returning();
  if (!hold) { res.status(404).json({ error: "Hold not found" }); return; }

  // Check if any other active holds remain
  const remaining = await db.select({ id: holdsTable.id }).from(holdsTable).where(and(eq(holdsTable.shipmentId, shipmentId), eq(holdsTable.isActive, true))).limit(1);
  if (remaining.length === 0) {
    await db.update(shipmentsTable).set({ isHeld: false }).where(eq(shipmentsTable.id, shipmentId));
  }

  await writeAuditLog(req, { action: "release_hold", entityType: "hold", entityId: holdId, description: "Hold released" });
  res.json(hold);
});

export default router;
