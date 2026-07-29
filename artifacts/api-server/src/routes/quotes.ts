import { Router, type IRouter } from "express";
import { db, quoteRequestsTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";
import { writeAuditLog } from "../lib/audit";
import { generateQuoteReference } from "../lib/tracking";

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

router.post("/quotes", async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.contactName || !body.contactEmail || !body.originCity || !body.destinationCity || !body.destinationCountry || !body.serviceType) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const referenceNumber = generateQuoteReference();
  const [quote] = await db.insert(quoteRequestsTable).values({
    referenceNumber, contactName: body.contactName, contactEmail: body.contactEmail,
    contactPhone: body.contactPhone || null, companyName: body.companyName || null,
    originCity: body.originCity, originCountry: body.originCountry || "CN",
    destinationCity: body.destinationCity, destinationCountry: body.destinationCountry,
    serviceType: body.serviceType, weightKg: body.weightKg || null, dimensions: body.dimensions || null,
    cargoDescription: body.cargoDescription || null, declaredValue: body.declaredValue || null,
    currency: body.currency || "USD", specialRequirements: body.specialRequirements || null,
  }).returning();
  res.status(201).json(quote);
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
  const [updated] = await db.update(quoteRequestsTable).set({
    ...(body.status !== undefined && { status: body.status }),
    ...(body.quotedPrice !== undefined && { quotedPrice: body.quotedPrice }),
    ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
  }).where(eq(quoteRequestsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Quote not found" }); return; }
  await writeAuditLog(req, { action: "update", entityType: "quote", entityId: id, description: `Updated quote status to ${updated.status}` });
  res.json(updated);
});

export default router;
