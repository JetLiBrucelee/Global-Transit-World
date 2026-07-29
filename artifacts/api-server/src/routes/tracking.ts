import { Router, type IRouter } from "express";
import { db, shipmentsTable, trackingEventsTable, holdsTable, customersTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";
import { maskName } from "../lib/tracking";
import { sendTrackingUpdate } from "../lib/email";

const router: IRouter = Router();

// ── Public tracking ───────────────────────────────────────────────────────────
router.get("/track/:trackingNumber", async (req, res): Promise<void> => {
  const tn = Array.isArray(req.params.trackingNumber) ? req.params.trackingNumber[0] : req.params.trackingNumber;

  const [shipment] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.trackingNumber, tn.toUpperCase())).limit(1);
  if (!shipment) { res.status(404).json({ error: "Shipment not found" }); return; }

  const [trackingEvents, holds] = await Promise.all([
    db.select().from(trackingEventsTable)
      .where(and(eq(trackingEventsTable.shipmentId, shipment.id), eq(trackingEventsTable.isPublic, true)))
      .orderBy(desc(trackingEventsTable.eventTime)),
    db.select().from(holdsTable).where(and(eq(holdsTable.shipmentId, shipment.id), eq(holdsTable.isActive, true))).limit(1),
  ]);

  const activeHold = holds[0] ?? null;

  res.json({
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    customStatus: shipment.customStatus,
    originCity: shipment.originCity,
    originCountry: shipment.originCountry,
    destinationCity: shipment.destinationCity,
    destinationCountry: shipment.destinationCountry,
    currentLocation: shipment.currentLocation,
    currentFacility: shipment.currentFacility,
    currentCity: shipment.currentCity,
    currentCountry: shipment.currentCountry,
    shippingMethod: shipment.shippingMethod,
    estimatedDelivery: shipment.estimatedDelivery,
    actualDelivery: shipment.actualDelivery,
    weightKg: shipment.weightKg,
    numberOfPackages: shipment.numberOfPackages,
    senderNameMasked: maskName(shipment.senderName),
    receiverNameMasked: maskName(shipment.receiverName),
    isHeld: shipment.isHeld,
    activeHold: activeHold
      ? {
          reason: activeHold.reason,
          publicMessage: activeHold.publicMessage,
          expectedResolutionDate: activeHold.expectedResolutionDate,
          location: activeHold.location,
          city: activeHold.city,
          country: activeHold.country,
          isActive: activeHold.isActive,
        }
      : null,
    trackingEvents,
    createdAt: shipment.createdAt,
  });
});

// ── List tracking events ──────────────────────────────────────────────────────
router.get("/shipments/:id/tracking-events", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const events = await db.select().from(trackingEventsTable).where(eq(trackingEventsTable.shipmentId, id)).orderBy(desc(trackingEventsTable.eventTime));
  res.json(events);
});

// ── Add tracking event ────────────────────────────────────────────────────────
router.post("/shipments/:id/tracking-events", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body;

  if (!body.status || !body.description) {
    res.status(400).json({ error: "status and description are required" });
    return;
  }

  const [event] = await db.insert(trackingEventsTable).values({
    shipmentId: id,
    status: body.status,
    customStatus: body.customStatus || null,
    description: body.description,
    location: body.location || null,
    city: body.city || null,
    country: body.country || null,
    facility: body.facility || null,
    eventTime: body.eventTime ? new Date(body.eventTime) : new Date(),
    isPublic: body.isPublic ?? true,
    sortOrder: body.sortOrder ?? 0,
  }).returning();

  // Update shipment status to match latest event
  await db.update(shipmentsTable).set({
    status: body.status as "shipment_created",
    customStatus: body.customStatus || null,
    currentLocation: body.location || null,
    currentFacility: body.facility || null,
    currentCity: body.city || null,
    currentCountry: body.country || null,
  }).where(eq(shipmentsTable.id, id));

  await writeAuditLog(req, {
    action: "add_tracking_event",
    entityType: "tracking_event",
    entityId: event.id,
    newValue: { status: event.status, description: event.description },
    description: `Added tracking event: ${event.status}`,
  });

  res.status(201).json(event);

  // Email notifications for public events (fire-and-forget)
  if (event.isPublic) {
    (async () => {
      try {
        const [shipment] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, id)).limit(1);
        if (!shipment) return;

        const emailPayload = {
          trackingNumber: shipment.trackingNumber,
          status: event.status,
          description: event.description,
          location: event.location ?? event.city ?? null,
          eventTime: event.eventTime.toISOString(),
        };

        const recipients: Array<{ email: string; name: string }> = [];

        // Receiver email (always notify if present)
        if (shipment.receiverEmail) {
          recipients.push({ email: shipment.receiverEmail, name: shipment.receiverName });
        }

        // Customer linked to shipment — check notifyEmail preference
        if (shipment.customerId) {
          const [customer] = await db.select().from(customersTable)
            .where(eq(customersTable.id, shipment.customerId)).limit(1);
          if (customer?.email && customer.notifyEmail) {
            // Avoid duplicate if receiver email already matches
            if (customer.email !== shipment.receiverEmail) {
              recipients.push({ email: customer.email, name: customer.name ?? shipment.receiverName });
            }
            // Create in-app notification
            await db.insert(notificationsTable).values({
              customerId: customer.id,
              shipmentId: shipment.id,
              title: `Shipment update: ${event.status.replace(/_/g, " ")}`,
              message: `${event.description}${event.location ? ` — ${event.location}` : ""}`,
              type: "tracking_update",
              channel: "in_app",
            }).catch(() => {});
          }
        }

        await Promise.all(
          recipients.map(r => sendTrackingUpdate({ ...emailPayload, email: r.email, name: r.name }))
        );
      } catch (e: any) {
        console.error("[email] tracking update failed:", e.message);
      }
    })();
  }
});

// ── Update tracking event ─────────────────────────────────────────────────────
router.patch("/shipments/:id/tracking-events/:eventId", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const body = req.body;

  const [existing] = await db.select().from(trackingEventsTable).where(eq(trackingEventsTable.id, eventId)).limit(1);
  if (!existing) { res.status(404).json({ error: "Event not found" }); return; }

  const [updated] = await db.update(trackingEventsTable).set({
    ...(body.status !== undefined && { status: body.status }),
    ...(body.customStatus !== undefined && { customStatus: body.customStatus }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.location !== undefined && { location: body.location }),
    ...(body.city !== undefined && { city: body.city }),
    ...(body.country !== undefined && { country: body.country }),
    ...(body.facility !== undefined && { facility: body.facility }),
    ...(body.eventTime !== undefined && { eventTime: new Date(body.eventTime) }),
    ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
  }).where(eq(trackingEventsTable.id, eventId)).returning();

  await writeAuditLog(req, { action: "update_tracking_event", entityType: "tracking_event", entityId: eventId, oldValue: existing, newValue: body });
  res.json(updated);
});

// ── Delete tracking event ─────────────────────────────────────────────────────
router.delete("/shipments/:id/tracking-events/:eventId", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const [existing] = await db.select().from(trackingEventsTable).where(eq(trackingEventsTable.id, eventId)).limit(1);
  if (!existing) { res.status(404).json({ error: "Event not found" }); return; }
  await db.delete(trackingEventsTable).where(eq(trackingEventsTable.id, eventId));
  await writeAuditLog(req, { action: "delete_tracking_event", entityType: "tracking_event", entityId: eventId });
  res.sendStatus(204);
});

export default router;
