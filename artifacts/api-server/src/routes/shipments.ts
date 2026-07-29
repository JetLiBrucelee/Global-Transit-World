import { Router, type IRouter } from "express";
import { db, shipmentsTable, trackingEventsTable, holdsTable, warehousesTable, carriersTable } from "@workspace/db";
import { eq, and, or, ilike, desc, count, sql } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";
import { generateTrackingNumber } from "../lib/tracking";
import { sendShipmentCreatedToSender, sendShipmentCreatedToReceiver } from "../lib/email";

const router: IRouter = Router();

// ── Generate tracking number ──────────────────────────────────────────────────
router.post("/shipments/generate-tracking-number", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const trackingNumber = await generateTrackingNumber();
  res.json({ trackingNumber });
});

// ── Import shipments ──────────────────────────────────────────────────────────
router.post("/shipments/import", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const { shipments } = req.body as { shipments: unknown[] };
  if (!Array.isArray(shipments)) {
    res.status(400).json({ error: "shipments must be an array" });
    return;
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < shipments.length; i++) {
    try {
      const item = shipments[i] as Record<string, unknown>;
      const trackingNumber = await generateTrackingNumber();
      await db.insert(shipmentsTable).values({
        trackingNumber,
        senderName: String(item.senderName ?? "Unknown"),
        receiverName: String(item.receiverName ?? "Unknown"),
        originCity: String(item.originCity ?? ""),
        originCountry: String(item.originCountry ?? "CN"),
        destinationCity: String(item.destinationCity ?? ""),
        destinationCountry: String(item.destinationCountry ?? ""),
        shippingMethod: (item.shippingMethod as "air_freight") ?? "air_freight",
      });
      imported++;
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  res.json({ imported, failed: errors.length, errors });
});

// ── List shipments ────────────────────────────────────────────────────────────
router.get("/shipments", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { status, search, isArchived, isHeld, customerId } = req.query;

  const conditions = [];
  if (status) conditions.push(eq(shipmentsTable.status, status as "shipment_created"));
  if (isArchived !== undefined) conditions.push(eq(shipmentsTable.isArchived, isArchived === "true"));
  if (isHeld !== undefined) conditions.push(eq(shipmentsTable.isHeld, isHeld === "true"));
  if (customerId) conditions.push(eq(shipmentsTable.customerId, String(customerId)));
  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        ilike(shipmentsTable.trackingNumber, term),
        ilike(shipmentsTable.senderName, term),
        ilike(shipmentsTable.receiverName, term),
        ilike(shipmentsTable.destinationCity, term),
        ilike(shipmentsTable.destinationCountry, term),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db.select().from(shipmentsTable).where(where).orderBy(desc(shipmentsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(shipmentsTable).where(where),
  ]);

  res.json({ data, total: Number(totalResult[0]?.count ?? 0), page, limit });
});

// ── Create shipment ───────────────────────────────────────────────────────────
router.post("/shipments", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.senderName || !body.receiverName || !body.originCity || !body.destinationCity || !body.destinationCountry || !body.shippingMethod) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const trackingNumber = await generateTrackingNumber();

  const [shipment] = await db.insert(shipmentsTable).values({
    trackingNumber,
    senderName: body.senderName,
    senderPhone: body.senderPhone || null,
    senderEmail: body.senderEmail || null,
    senderAddress: body.senderAddress || null,
    receiverName: body.receiverName,
    receiverPhone: body.receiverPhone || null,
    receiverEmail: body.receiverEmail || null,
    receiverAddress: body.receiverAddress || null,
    customerId: body.customerId || null,
    originCity: body.originCity,
    originCountry: body.originCountry || "CN",
    destinationCity: body.destinationCity,
    destinationCountry: body.destinationCountry,
    shippingMethod: body.shippingMethod,
    serviceType: body.serviceType || null,
    estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
    weightKg: body.weightKg || null,
    numberOfPackages: body.numberOfPackages || 1,
    dimensions: body.dimensions || null,
    description: body.description || null,
    declaredValue: body.declaredValue || null,
    currency: body.currency || "USD",
    warehouseId: body.warehouseId || null,
    carrierId: body.carrierId || null,
    driverName: body.driverName || null,
    driverPhone: body.driverPhone || null,
    requiresCustoms: body.requiresCustoms ?? false,
    internalNotes: body.internalNotes || null,
    status: body.status || "shipment_created",
  }).returning();

  await writeAuditLog(req, {
    action: "create",
    entityType: "shipment",
    entityId: shipment.id,
    newValue: { trackingNumber: shipment.trackingNumber },
    description: `Created shipment ${shipment.trackingNumber}`,
  });

  // Auto-create initial tracking event
  await db.insert(trackingEventsTable).values({
    shipmentId: shipment.id,
    status: "shipment_created",
    description: "Shipment created and registered in the system.",
    eventTime: new Date(),
    isPublic: true,
    sortOrder: 0,
  });

  res.status(201).json(shipment);

  // Send confirmation emails (fire-and-forget — don't block the response)
  const origin = `${shipment.originCity}, ${shipment.originCountry ?? "CN"}`;
  const destination = `${shipment.destinationCity}, ${shipment.destinationCountry}`;
  const estDelivery = shipment.estimatedDelivery?.toISOString() ?? null;
  if (shipment.receiverEmail) {
    sendShipmentCreatedToReceiver({
      email: shipment.receiverEmail,
      receiverName: shipment.receiverName,
      senderName: shipment.senderName,
      trackingNumber: shipment.trackingNumber,
      origin,
      destination,
      shippingMethod: shipment.shippingMethod,
      estimatedDelivery: estDelivery,
    }).catch((e: Error) => console.error("[email] receiver confirm failed:", e.message));
  }
  if (shipment.senderEmail) {
    sendShipmentCreatedToSender({
      email: shipment.senderEmail,
      senderName: shipment.senderName,
      receiverName: shipment.receiverName,
      trackingNumber: shipment.trackingNumber,
      origin,
      destination,
      shippingMethod: shipment.shippingMethod,
      estimatedDelivery: estDelivery,
    }).catch((e: Error) => console.error("[email] sender confirm failed:", e.message));
  }
});

// ── Get shipment detail ───────────────────────────────────────────────────────
router.get("/shipments/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [shipment] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, id)).limit(1);
  if (!shipment) { res.status(404).json({ error: "Shipment not found" }); return; }

  const [trackingEvents, holds, warehouseRows, carrierRows] = await Promise.all([
    db.select().from(trackingEventsTable).where(eq(trackingEventsTable.shipmentId, id)).orderBy(desc(trackingEventsTable.eventTime)),
    db.select().from(holdsTable).where(eq(holdsTable.shipmentId, id)).orderBy(desc(holdsTable.createdAt)),
    shipment.warehouseId ? db.select().from(warehousesTable).where(eq(warehousesTable.id, shipment.warehouseId)).limit(1) : [],
    shipment.carrierId ? db.select().from(carriersTable).where(eq(carriersTable.id, shipment.carrierId)).limit(1) : [],
  ]);

  const activeHold = holds.find((h) => h.isActive) ?? null;

  res.json({
    ...shipment,
    trackingEvents,
    activeHold,
    warehouse: warehouseRows[0] ?? null,
    carrier: carrierRows[0] ?? null,
  });
});

// ── Update shipment ───────────────────────────────────────────────────────────
router.patch("/shipments/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Shipment not found" }); return; }

  const body = req.body;
  const updateData: Partial<typeof shipmentsTable.$inferInsert> = {};

  const fields = ["senderName","senderPhone","senderEmail","senderAddress","receiverName","receiverPhone","receiverEmail","receiverAddress","customerId","originCity","originCountry","destinationCity","destinationCountry","currentLocation","currentFacility","currentCity","currentCountry","shippingMethod","serviceType","weightKg","numberOfPackages","dimensions","description","declaredValue","currency","warehouseId","carrierId","driverName","driverPhone","documents","images","proofOfDelivery","requiresCustoms","internalNotes","status","customStatus","isArchived","isHeld"] as const;

  for (const f of fields) {
    if (f in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updateData as any)[f] = body[f] ?? null;
    }
  }
  if ("estimatedDelivery" in body) updateData.estimatedDelivery = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null;
  if ("actualDelivery" in body) updateData.actualDelivery = body.actualDelivery ? new Date(body.actualDelivery) : null;

  const [updated] = await db.update(shipmentsTable).set(updateData).where(eq(shipmentsTable.id, id)).returning();

  await writeAuditLog(req, {
    action: "update",
    entityType: "shipment",
    entityId: id,
    oldValue: existing,
    newValue: updateData,
    description: `Updated shipment ${existing.trackingNumber}`,
  });

  res.json(updated);
});

// ── Delete shipment ───────────────────────────────────────────────────────────
router.delete("/shipments/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Shipment not found" }); return; }

  await db.delete(shipmentsTable).where(eq(shipmentsTable.id, id));
  await writeAuditLog(req, { action: "delete", entityType: "shipment", entityId: id, oldValue: { trackingNumber: existing.trackingNumber }, description: `Deleted shipment ${existing.trackingNumber}` });
  res.sendStatus(204);
});

// ── Archive shipment ──────────────────────────────────────────────────────────
router.post("/shipments/:id/archive", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { isArchived } = req.body as { isArchived: boolean };
  const [shipment] = await db.update(shipmentsTable).set({ isArchived }).where(eq(shipmentsTable.id, id)).returning();
  if (!shipment) { res.status(404).json({ error: "Not found" }); return; }
  await writeAuditLog(req, { action: isArchived ? "archive" : "unarchive", entityType: "shipment", entityId: id, description: `${isArchived ? "Archived" : "Unarchived"} shipment ${shipment.trackingNumber}` });
  res.json(shipment);
});

// ── Duplicate shipment ────────────────────────────────────────────────────────
router.post("/shipments/:id/duplicate", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [existing] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Shipment not found" }); return; }

  const newTracking = await generateTrackingNumber();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt: _ca, updatedAt: _ua, trackingNumber: _tn, ...rest } = existing;
  const [dup] = await db.insert(shipmentsTable).values({ ...rest, trackingNumber: newTracking, status: "shipment_created", isArchived: false, isHeld: false }).returning();

  await writeAuditLog(req, { action: "duplicate", entityType: "shipment", entityId: dup.id, description: `Duplicated shipment ${existing.trackingNumber} → ${dup.trackingNumber}` });
  res.status(201).json(dup);
});

export default router;
