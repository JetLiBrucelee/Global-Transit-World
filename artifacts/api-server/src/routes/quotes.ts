import { Router, type IRouter } from "express";
import { db, quoteRequestsTable, shipmentsTable, trackingEventsTable, notificationsTable, customersTable } from "@workspace/db";
import { eq, count, desc, ilike } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";
import { generateQuoteReference, generateTrackingNumber } from "../lib/tracking";

const router: IRouter = Router();

router.get("/quotes", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (req.query.status) conditions.push(eq(quoteRequestsTable.status, req.query.status as "pending"));

  const where = conditions.length > 0 ? conditions[0] : undefined;
  const [data, totalResult] = await Promise.all([
    db.select().from(quoteRequestsTable).where(where).orderBy(desc(quoteRequestsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(quoteRequestsTable).where(where),
  ]);
  res.json({ data, total: Number(totalResult[0]?.count ?? 0), page, limit });
});

// ── Public: customer quote history by email ───────────────────────────────────
router.get("/quotes/by-email", async (req, res): Promise<void> => {
  const email = req.query.email as string;
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  const quotes = await db
    .select({
      id: quoteRequestsTable.id,
      referenceNumber: quoteRequestsTable.referenceNumber,
      status: quoteRequestsTable.status,
      serviceType: quoteRequestsTable.serviceType,
      originCity: quoteRequestsTable.originCity,
      originCountry: quoteRequestsTable.originCountry,
      destinationCity: quoteRequestsTable.destinationCity,
      destinationCountry: quoteRequestsTable.destinationCountry,
      quotedPrice: quoteRequestsTable.quotedPrice,
      currency: quoteRequestsTable.currency,
      trackingNumber: quoteRequestsTable.trackingNumber,
      shipmentId: quoteRequestsTable.shipmentId,
      adminNotes: quoteRequestsTable.adminNotes,
      createdAt: quoteRequestsTable.createdAt,
    })
    .from(quoteRequestsTable)
    .where(ilike(quoteRequestsTable.contactEmail, email))
    .orderBy(desc(quoteRequestsTable.createdAt))
    .limit(50);
  res.json(quotes);
});

router.post("/quotes", async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.contactName || !body.contactEmail || !body.originCity || !body.destinationCity || !body.destinationCountry || !body.serviceType) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Strip formatting characters so numeric DB columns don't crash.
  // e.g. "1,920,000 kg" → "1920000",  "2,500.50" → "2500.50"
  const toNumericString = (val: unknown): string | null => {
    if (!val) return null;
    const cleaned = String(val).replace(/[^0-9.]/g, "");
    return cleaned || null;
  };

  try {
    const referenceNumber = generateQuoteReference();
    const [quote] = await db.insert(quoteRequestsTable).values({
      referenceNumber,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || null,
      companyName: body.companyName || null,
      originCity: body.originCity,
      originCountry: body.originCountry || "CN",
      destinationCity: body.destinationCity,
      destinationCountry: body.destinationCountry,
      serviceType: body.serviceType,
      weightKg: toNumericString(body.weightKg),
      dimensions: body.dimensions || null,
      cargoDescription: body.cargoDescription || null,
      declaredValue: toNumericString(body.declaredValue),
      currency: body.currency || "USD",
      specialRequirements: body.specialRequirements || null,
    }).returning();
    res.status(201).json(quote);
  } catch (err) {
    console.error("Failed to create quote:", err);
    res.status(500).json({ error: "Failed to save quote request. Please try again." });
  }
});

router.get("/quotes/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [quote] = await db.select().from(quoteRequestsTable).where(eq(quoteRequestsTable.id, id)).limit(1);
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  res.json(quote);
});

router.patch("/quotes/:id", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = req.body;

  // Fetch the current quote first so we can check if this is a new acceptance
  const [existing] = await db.select().from(quoteRequestsTable).where(eq(quoteRequestsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Quote not found" }); return; }

  const updateFields: Partial<typeof quoteRequestsTable.$inferInsert> = {};
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.quotedPrice !== undefined) updateFields.quotedPrice = body.quotedPrice;
  if (body.adminNotes !== undefined) updateFields.adminNotes = body.adminNotes;

  // Auto-create a shipment when admin first accepts the quote
  if (body.status === "accepted" && !existing.shipmentId) {
    try {
      const trackingNumber = await generateTrackingNumber();

      // Map quote service type to shipment shipping method
      const methodMap: Record<string, string> = {
        ocean_freight: "ocean_freight",
        air_freight: "air_freight",
        road_freight: "road_freight",
        rail_freight: "rail_freight",
        express: "express_air",
        express_air: "express_air",
        standard: "standard_air",
        economy: "economy",
      };
      const shippingMethod = (methodMap[existing.serviceType] ?? "air_freight") as "air_freight";

      const [shipment] = await db.insert(shipmentsTable).values({
        trackingNumber,
        senderName: existing.companyName || existing.contactName,
        senderEmail: existing.contactEmail,
        senderPhone: existing.contactPhone || null,
        receiverName: existing.contactName,
        receiverEmail: existing.contactEmail,
        receiverPhone: existing.contactPhone || null,
        originCity: existing.originCity,
        originCountry: existing.originCountry,
        destinationCity: existing.destinationCity,
        destinationCountry: existing.destinationCountry,
        shippingMethod,
        serviceType: existing.serviceType,
        weightKg: existing.weightKg,
        dimensions: existing.dimensions,
        description: existing.cargoDescription,
        declaredValue: existing.declaredValue,
        currency: existing.currency,
        requiresCustoms: false,
        internalNotes: `Created from quote ${existing.referenceNumber}`,
        status: "shipment_created",
      }).returning();

      // Initial tracking event
      await db.insert(trackingEventsTable).values({
        shipmentId: shipment.id,
        status: "shipment_created",
        description: `Shipment registered. Quote ${existing.referenceNumber} accepted.`,
        eventTime: new Date(),
        isPublic: true,
        sortOrder: 0,
      });

      // Store back on the quote
      updateFields.shipmentId = shipment.id;
      updateFields.trackingNumber = trackingNumber;

      // Create in-app notification for the customer (best-effort)
      try {
        const [customer] = await db
          .select({ id: customersTable.id })
          .from(customersTable)
          .where(ilike(customersTable.email, existing.contactEmail))
          .limit(1);
        if (customer) {
          await db.insert(notificationsTable).values({
            customerId: customer.id,
            shipmentId: shipment.id,
            title: "Quote Accepted — Tracking Ready",
            message: `Your quote ${existing.referenceNumber} has been accepted. Your tracking number is ${trackingNumber}. You can now track your shipment in real time.`,
            type: "quote_accepted",
            channel: "in_app",
            isRead: false,
          });
        }
      } catch (notifErr) {
        console.warn("Could not create quote-accepted notification:", notifErr);
      }
    } catch (shipErr) {
      console.error("Failed to auto-create shipment for quote:", shipErr);
      // Don't block the status update — just log and continue without the shipment
    }
  }

  const [updated] = await db.update(quoteRequestsTable).set(updateFields).where(eq(quoteRequestsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Quote not found" }); return; }
  await writeAuditLog(req, { action: "update", entityType: "quote", entityId: id, description: `Updated quote status to ${updated.status}` });
  res.json(updated);
});

export default router;
