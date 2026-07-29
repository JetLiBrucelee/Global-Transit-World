import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shipmentsTable } from "./shipments";

export const holdsTable = pgTable("holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipmentsTable.id, { onDelete: "cascade" }),

  reason: text("reason").notNull(),
  publicMessage: text("public_message").notNull(),
  internalNote: text("internal_note"),
  expectedResolutionDate: timestamp("expected_resolution_date", { withTimezone: true }),

  location: text("location"),
  facility: text("facility"),
  city: text("city"),
  country: text("country"),

  notifyCustomer: boolean("notify_customer").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHoldSchema = createInsertSchema(holdsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHold = z.infer<typeof insertHoldSchema>;
export type Hold = typeof holdsTable.$inferSelect;
