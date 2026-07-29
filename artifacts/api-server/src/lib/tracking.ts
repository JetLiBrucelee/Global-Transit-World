import { db, shipmentsTable } from "@workspace/db";
import { like } from "drizzle-orm";

/** Generate a tracking number in format STG-CN-YYYY-XXXXXX */
export async function generateTrackingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `STG-CN-${year}-`;

  for (let attempt = 0; attempt < 20; attempt++) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const candidate = `${prefix}${suffix}`;

    const existing = await db
      .select({ id: shipmentsTable.id })
      .from(shipmentsTable)
      .where(like(shipmentsTable.trackingNumber, candidate))
      .limit(1);

    if (existing.length === 0) return candidate;
  }
  throw new Error("Could not generate unique tracking number after 20 attempts");
}

/** Generate a quote reference number in format QR-YYYY-XXXXXX */
export function generateQuoteReference(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `QR-${year}-${suffix}`;
}

/** Mask a name, showing first char + asterisks + last char */
export function maskName(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (trimmed.length <= 2) return "*".repeat(trimmed.length);
  return trimmed[0] + "*".repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
}
