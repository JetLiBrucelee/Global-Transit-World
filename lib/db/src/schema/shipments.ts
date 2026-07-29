import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { warehousesTable } from "./warehouses";
import { carriersTable } from "./carriers";
import { customersTable } from "./customers";

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "shipment_created",
  "collected",
  "at_warehouse",
  "departed_warehouse",
  "at_airport",
  "departed_airport",
  "in_transit",
  "arrived_at_transit_hub",
  "processing",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "returned",
  "shipment_exception",
  "delayed",
  "cancelled",
  "lost",
  "damaged",
  "awaiting_pickup",
  "customs_review",
  "customs_hold",
  "released",
  "package_hold",
  "security_inspection",
  "operational_delay",
  "address_verification",
  "receiver_unavailable",
  "payment_pending",
  "weather_delay",
  "border_delay",
  "port_congestion",
  "flight_delay",
  "road_delay",
  "warehouse_delay",
  "custom",
]);

export const shippingMethodEnum = pgEnum("shipping_method", [
  "air_freight",
  "ocean_freight",
  "road_freight",
  "rail_freight",
  "express_air",
  "standard_air",
  "economy",
]);

export const shipmentsTable = pgTable("shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackingNumber: text("tracking_number").notNull().unique(),
  status: shipmentStatusEnum("status").notNull().default("shipment_created"),
  customStatus: text("custom_status"),

  // Parties
  senderName: text("sender_name").notNull(),
  senderPhone: text("sender_phone"),
  senderEmail: text("sender_email"),
  senderAddress: text("sender_address"),
  receiverName: text("receiver_name").notNull(),
  receiverPhone: text("receiver_phone"),
  receiverEmail: text("receiver_email"),
  receiverAddress: text("receiver_address"),
  customerId: uuid("customer_id").references(() => customersTable.id, { onDelete: "set null" }),

  // Route
  originCity: text("origin_city").notNull(),
  originCountry: text("origin_country").notNull().default("CN"),
  destinationCity: text("destination_city").notNull(),
  destinationCountry: text("destination_country").notNull(),

  // Current location
  currentLocation: text("current_location"),
  currentFacility: text("current_facility"),
  currentCity: text("current_city"),
  currentCountry: text("current_country"),

  // Shipping details
  shippingMethod: shippingMethodEnum("shipping_method").notNull().default("air_freight"),
  serviceType: text("service_type"),
  estimatedDelivery: timestamp("estimated_delivery", { withTimezone: true }),
  actualDelivery: timestamp("actual_delivery", { withTimezone: true }),

  // Package info
  weightKg: numeric("weight_kg", { precision: 10, scale: 3 }),
  numberOfPackages: integer("number_of_packages").notNull().default(1),
  dimensions: text("dimensions"),
  description: text("description"),
  declaredValue: numeric("declared_value", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("USD"),

  // Assignment
  warehouseId: uuid("warehouse_id").references(() => warehousesTable.id, { onDelete: "set null" }),
  carrierId: uuid("carrier_id").references(() => carriersTable.id, { onDelete: "set null" }),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),

  // Documents (URLs/paths, stubbed)
  documents: text("documents").array().notNull().default([]),
  images: text("images").array().notNull().default([]),
  proofOfDelivery: text("proof_of_delivery"),

  // Flags
  isArchived: boolean("is_archived").notNull().default(false),
  isHeld: boolean("is_held").notNull().default(false),
  requiresCustoms: boolean("requires_customs").notNull().default(false),

  // Internal notes
  internalNotes: text("internal_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShipmentSchema = createInsertSchema(shipmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipmentsTable.$inferSelect;
