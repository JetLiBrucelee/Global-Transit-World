import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shipmentsTable } from "./shipments";

export const trackingEventsTable = pgTable("tracking_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .references(() => shipmentsTable.id, { onDelete: "cascade" }),

  status: text("status").notNull(),
  customStatus: text("custom_status"),
  description: text("description").notNull(),
  location: text("location"),
  city: text("city"),
  country: text("country"),
  facility: text("facility"),

  eventTime: timestamp("event_time", { withTimezone: true }).notNull().defaultNow(),
  isPublic: boolean("is_public").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTrackingEventSchema = createInsertSchema(trackingEventsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type TrackingEvent = typeof trackingEventsTable.$inferSelect;
