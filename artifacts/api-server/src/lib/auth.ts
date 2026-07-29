import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type UserRole =
  | "super_admin"
  | "operations_manager"
  | "warehouse_staff"
  | "tracking_staff"
  | "customs_officer"
  | "customer_support"
  | "finance"
  | "read_only_auditor"
  | "customer";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 9,
  operations_manager: 8,
  warehouse_staff: 4,
  tracking_staff: 4,
  customs_officer: 4,
  customer_support: 3,
  finance: 3,
  read_only_auditor: 2,
  customer: 1,
};

export const STAFF_ROLES: UserRole[] = [
  "super_admin",
  "operations_manager",
  "warehouse_staff",
  "tracking_staff",
  "customs_officer",
  "customer_support",
  "finance",
  "read_only_auditor",
];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: typeof usersTable.$inferSelect;
      clerkUserId?: string;
    }
  }
}

/** Require any authenticated Clerk session. Attaches clerkUserId to req. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = clerkUserId;
  next();
}

/** Require auth AND load the DB user record. Attaches currentUser to req. */
export async function requireUserRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = clerkUserId;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (!user) {
    res.status(403).json({ error: "User not found. Please contact an administrator." });
    return;
  }
  if (!user.isActive) {
    res.status(403).json({ error: "Your account has been deactivated." });
    return;
  }
  req.currentUser = user;
  next();
}

/** Require a minimum role level. Call after requireUserRecord. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const userRole = user.role as UserRole;
    const allowed = roles.some((r) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[r]);
    if (!allowed) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

/** Require the user to be any staff role (not customer) */
export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  const user = req.currentUser;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!STAFF_ROLES.includes(user.role as UserRole)) {
    res.status(403).json({ error: "Staff access required" });
    return;
  }
  next();
}
