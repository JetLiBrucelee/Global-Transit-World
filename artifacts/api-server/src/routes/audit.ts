import { Router, type IRouter } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { eq, and, gte, lte, count, desc } from "drizzle-orm";
import { requireAuth, requireUserRecord, requireStaff } from "../lib/auth";

const router: IRouter = Router();

router.get("/audit-logs", requireAuth, requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Number(req.query.limit) || 50);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (req.query.entityType) conditions.push(eq(auditLogsTable.entityType, String(req.query.entityType)));
  if (req.query.entityId) conditions.push(eq(auditLogsTable.entityId, String(req.query.entityId)));
  if (req.query.actorId) conditions.push(eq(auditLogsTable.actorId, String(req.query.actorId)));
  if (req.query.action) conditions.push(eq(auditLogsTable.action, String(req.query.action)));
  if (req.query.from) conditions.push(gte(auditLogsTable.createdAt, new Date(String(req.query.from))));
  if (req.query.to) conditions.push(lte(auditLogsTable.createdAt, new Date(String(req.query.to))));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db.select().from(auditLogsTable).where(where).orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(auditLogsTable).where(where),
  ]);

  res.json({ data, total: Number(totalResult[0]?.count ?? 0), page, limit });
});

export default router;
