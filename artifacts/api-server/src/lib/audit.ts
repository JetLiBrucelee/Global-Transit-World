import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";
import type { InsertAuditLog } from "@workspace/db";
import { logger } from "./logger";

export async function writeAuditLog(
  req: Request,
  opts: {
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    reason?: string;
    description?: string;
  },
): Promise<void> {
  try {
    const user = req.currentUser;
    const entry: InsertAuditLog = {
      actorId: user?.id ?? null,
      actorClerkId: req.clerkUserId ?? null,
      actorEmail: user?.email ?? null,
      actorRole: user?.role ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      oldValue: opts.oldValue ?? null,
      newValue: opts.newValue ?? null,
      reason: opts.reason ?? null,
      description: opts.description ?? null,
      ipAddress:
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
        req.socket.remoteAddress ??
        null,
      userAgent: req.headers["user-agent"] ?? null,
    };
    await db.insert(auditLogsTable).values(entry);
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}
