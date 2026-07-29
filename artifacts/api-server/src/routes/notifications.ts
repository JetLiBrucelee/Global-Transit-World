import { Router, type IRouter } from "express";
import { db, notificationsTable, customersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Find customer record
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!customer) { res.json([]); return; }

  const conditions = [eq(notificationsTable.customerId, customer.id)];
  if (req.query.unreadOnly === "true") conditions.push(eq(notificationsTable.isRead, false));

  const notifications = await db.select().from(notificationsTable)
    .where(and(...conditions))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);

  res.json(notifications);
});

router.post("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Resolve customer to ensure ownership
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!customer) { res.status(404).json({ error: "Notification not found" }); return; }

  const [updated] = await db.update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.customerId, customer.id)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(updated);
});

router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.clerkId, auth.userId)).limit(1);
  if (!customer) { res.json({ success: true }); return; }

  await db.update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notificationsTable.customerId, customer.id), eq(notificationsTable.isRead, false)));

  res.json({ success: true });
});

export default router;
