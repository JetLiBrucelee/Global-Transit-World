import { pgTable, text, timestamp, boolean, pgEnum, uuid } from "drizzle-orm/pg-core";

export const chatStatusEnum = pgEnum("chat_status", ["open", "closed"]);
export const chatSenderEnum = pgEnum("chat_sender", ["visitor", "admin"]);

export const chatConversationsTable = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitorName: text("visitor_name").notNull(),
  visitorEmail: text("visitor_email").notNull(),
  status: chatStatusEnum("status").default("open").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => chatConversationsTable.id, { onDelete: "cascade" }),
  sender: chatSenderEnum("sender").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
