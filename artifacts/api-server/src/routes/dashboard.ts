import { Router, type IRouter } from "express";
import { db, shipmentsTable, customersTable, quoteRequestsTable, auditLogsTable } from "@workspace/db";
import { eq, count, desc, gte } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, requireUserRecord, requireStaff, async (_req, res): Promise<void> => {
  const [
    totalResult, inTransitResult, deliveredResult, onHoldResult,
    delayedResult, cancelledResult, customersResult, quotesResult, recentResult,
    byStatusRaw,
  ] = await Promise.all([
    db.select({ count: count() }).from(shipmentsTable).where(eq(shipmentsTable.isArchived, false)),
    db.select({ count: count() }).from(shipmentsTable).where(eq(shipmentsTable.status, "in_transit")),
    db.select({ count: count() }).from(shipmentsTable).where(eq(shipmentsTable.status, "delivered")),
    db.select({ count: count() }).from(shipmentsTable).where(eq(shipmentsTable.isHeld, true)),
    db.select({ count: count() }).from(shipmentsTable).where(eq(shipmentsTable.status, "delayed")),
    db.select({ count: count() }).from(shipmentsTable).where(eq(shipmentsTable.status, "cancelled")),
    db.select({ count: count() }).from(customersTable),
    db.select({ count: count() }).from(quoteRequestsTable).where(eq(quoteRequestsTable.status, "pending")),
    db.select({ count: count() }).from(shipmentsTable).where(gte(shipmentsTable.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
    db.execute<{ status: string; cnt: string }>(
      `SELECT status, COUNT(*) as cnt FROM shipments WHERE is_archived = false GROUP BY status ORDER BY cnt DESC LIMIT 15`
    ),
  ]);

  const shipmentsByStatus = byStatusRaw.rows.map((r) => ({
    status: r.status,
    count: Number(r.cnt),
  }));

  res.json({
    totalShipments: Number(totalResult[0]?.count ?? 0),
    inTransit: Number(inTransitResult[0]?.count ?? 0),
    delivered: Number(deliveredResult[0]?.count ?? 0),
    onHold: Number(onHoldResult[0]?.count ?? 0),
    delayed: Number(delayedResult[0]?.count ?? 0),
    cancelled: Number(cancelledResult[0]?.count ?? 0),
    totalCustomers: Number(customersResult[0]?.count ?? 0),
    totalQuoteRequests: Number(quotesResult[0]?.count ?? 0),
    recentShipmentsCount: Number(recentResult[0]?.count ?? 0),
    shipmentsByStatus,
  });
});

router.get("/dashboard/recent-activity", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(limit);

  const activity = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: log.description ?? `${log.action} on ${log.entityType}`,
    actorEmail: log.actorEmail,
    createdAt: log.createdAt,
  }));

  res.json(activity);
});

export default router;
