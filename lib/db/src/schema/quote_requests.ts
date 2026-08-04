import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shipmentsTable } from "./shipments";

export const quoteStatusEnum = pgEnum("quote_status", [
  "pending",
  "reviewed",
  "quoted",
  "accepted",
  "declined",
  "expired",
]);

export const quoteRequestsTable = pgTable("quote_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: text("reference_number").notNull().unique(),

  // Contact
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  companyName: text("company_name"),

  // Shipment details
  originCity: text("origin_city").notNull(),
  originCountry: text("origin_country").notNull().default("CN"),
  destinationCity: text("destination_city").notNull(),
  destinationCountry: text("destination_country").notNull(),
  serviceType: text("service_type").notNull(),
  weightKg: numeric("weight_kg", { precision: 10, scale: 3 }),
  dimensions: text("dimensions"),
  cargoDescription: text("cargo_description"),
  declaredValue: numeric("declared_value", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  specialRequirements: text("special_requirements"),

  status: quoteStatusEnum("status").notNull().default("pending"),
  quotedPrice: numeric("quoted_price", { precision: 12, scale: 2 }),
  adminNotes: text("admin_notes"),

  // Set when admin accepts the quote — links to the created shipment
  shipmentId: uuid("shipment_id").references(() => shipmentsTable.id, { onDelete: "set null" }),
  trackingNumber: text("tracking_number"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type QuoteRequest = typeof quoteRequestsTable.$inferSelect;
