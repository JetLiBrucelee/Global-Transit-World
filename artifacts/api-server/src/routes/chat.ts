import { Router, type IRouter } from "express";
import { db, chatConversationsTable, chatMessagesTable } from "@workspace/db";
import { eq, desc, count, and } from "drizzle-orm";
import { requireUserRecord, requireStaff } from "../lib/auth";

const router: IRouter = Router();

// ── Public: start a new conversation ─────────────────────────────────────────
router.post("/chat/conversations", async (req, res): Promise<void> => {
  const { visitorName, visitorEmail, message } = req.body ?? {};
  if (!visitorName?.trim() || !visitorEmail?.trim() || !message?.trim()) {
    res.status(400).json({ error: "Name, email, and message are required." });
    return;
  }

  const [conv] = await db
    .insert(chatConversationsTable)
    .values({ visitorName: visitorName.trim(), visitorEmail: visitorEmail.trim() })
    .returning();

  await db.insert(chatMessagesTable).values({
    conversationId: conv.id,
    sender: "visitor",
    body: message.trim(),
  });

  res.status(201).json(conv);
});

// ── Public: send a message to an existing conversation ───────────────────────
router.post("/chat/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = req.params.id as string;
  const { body: msgBody } = req.body ?? {};
  if (!msgBody?.trim()) { res.status(400).json({ error: "Message body required." }); return; }

  const [conv] = await db.select().from(chatConversationsTable).where(eq(chatConversationsTable.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found." }); return; }
  if (conv.status === "closed") { res.status(400).json({ error: "Conversation is closed." }); return; }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ conversationId: id, sender: "visitor", body: msgBody.trim() })
    .returning();

  // Mark conversation as unread for admin
  await db.update(chatConversationsTable)
    .set({ isRead: false, updatedAt: new Date() })
    .where(eq(chatConversationsTable.id, id));

  res.status(201).json(msg);
});

// ── Public: poll messages for a conversation ─────────────────────────────────
router.get("/chat/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = req.params.id as string;
  const [conv] = await db.select().from(chatConversationsTable).where(eq(chatConversationsTable.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found." }); return; }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

// ── Admin: list all conversations ────────────────────────────────────────────
router.get("/chat/conversations", requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(chatConversationsTable)
    .orderBy(desc(chatConversationsTable.updatedAt))
    .limit(100);
  res.json(conversations);
});

// ── Admin: unread count ───────────────────────────────────────────────────────
router.get("/chat/unread-count", requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const [result] = await db
    .select({ count: count() })
    .from(chatConversationsTable)
    .where(and(eq(chatConversationsTable.isRead, false), eq(chatConversationsTable.status, "open")));
  res.json({ count: result?.count ?? 0 });
});

// ── Admin: send reply ─────────────────────────────────────────────────────────
router.post("/chat/conversations/:id/reply", requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = req.params.id as string;
  const { body: msgBody } = req.body ?? {};
  if (!msgBody?.trim()) { res.status(400).json({ error: "Message body required." }); return; }

  const [conv] = await db.select().from(chatConversationsTable).where(eq(chatConversationsTable.id, id)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation not found." }); return; }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ conversationId: id, sender: "admin", body: msgBody.trim() })
    .returning();

  await db.update(chatConversationsTable)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(chatConversationsTable.id, id));

  res.status(201).json(msg);
});

// ── Admin: mark conversation as read / update status ─────────────────────────
router.patch("/chat/conversations/:id", requireUserRecord, requireStaff, async (req, res): Promise<void> => {
  const id = req.params.id as string;
  const { status, isRead } = req.body ?? {};

  const updates: Partial<typeof chatConversationsTable.$inferInsert> = { updatedAt: new Date() };
  if (status === "open" || status === "closed") updates.status = status;
  if (typeof isRead === "boolean") updates.isRead = isRead;

  const [updated] = await db
    .update(chatConversationsTable)
    .set(updates)
    .where(eq(chatConversationsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Conversation not found." }); return; }
  res.json(updated);
});

export default router;
