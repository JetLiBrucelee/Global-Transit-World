import { Router, type IRouter } from "express";
import { db, warehousesTable, carriersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();

// Warehouses
router.get("/warehouses", async (_req, res): Promise<void> => {
  const rows = await db.select().from(warehousesTable).orderBy(desc(warehousesTable.createdAt));
  res.json(rows);
});

router.post("/warehouses", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.name || !body.code || !body.address || !body.city || !body.country) {
    res.status(400).json({ error: "name, code, address, city, country are required" });
    return;
  }
  const [wh] = await db.insert(warehousesTable).values({
    name: body.name, code: body.code, address: body.address, city: body.city, country: body.country,
    contactEmail: body.contactEmail || null, contactPhone: body.contactPhone || null,
  }).returning();
  await writeAuditLog(req, { action: "create", entityType: "warehouse", entityId: wh.id, description: `Created warehouse ${wh.name}` });
  res.status(201).json(wh);
});

router.patch("/warehouses/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body;
  const [updated] = await db.update(warehousesTable).set({
    ...(body.name !== undefined && { name: body.name }),
    ...(body.code !== undefined && { code: body.code }),
    ...(body.address !== undefined && { address: body.address }),
    ...(body.city !== undefined && { city: body.city }),
    ...(body.country !== undefined && { country: body.country }),
    ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
    ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  }).where(eq(warehousesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Warehouse not found" }); return; }
  await writeAuditLog(req, { action: "update", entityType: "warehouse", entityId: id });
  res.json(updated);
});

router.delete("/warehouses/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(warehousesTable).where(eq(warehousesTable.id, id));
  await writeAuditLog(req, { action: "delete", entityType: "warehouse", entityId: id });
  res.sendStatus(204);
});

// Carriers
router.get("/carriers", async (_req, res): Promise<void> => {
  const rows = await db.select().from(carriersTable).orderBy(desc(carriersTable.createdAt));
  res.json(rows);
});

router.post("/carriers", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.name || !body.code) { res.status(400).json({ error: "name and code are required" }); return; }
  const [carrier] = await db.insert(carriersTable).values({
    name: body.name, code: body.code, contactEmail: body.contactEmail || null,
    contactPhone: body.contactPhone || null, trackingUrl: body.trackingUrl || null,
  }).returning();
  await writeAuditLog(req, { action: "create", entityType: "carrier", entityId: carrier.id, description: `Created carrier ${carrier.name}` });
  res.status(201).json(carrier);
});

router.patch("/carriers/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body;
  const [updated] = await db.update(carriersTable).set({
    ...(body.name !== undefined && { name: body.name }),
    ...(body.code !== undefined && { code: body.code }),
    ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
    ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
    ...(body.trackingUrl !== undefined && { trackingUrl: body.trackingUrl }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  }).where(eq(carriersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Carrier not found" }); return; }
  await writeAuditLog(req, { action: "update", entityType: "carrier", entityId: id });
  res.json(updated);
});

router.delete("/carriers/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(carriersTable).where(eq(carriersTable.id, id));
  await writeAuditLog(req, { action: "delete", entityType: "carrier", entityId: id });
  res.sendStatus(204);
});

export default router;
