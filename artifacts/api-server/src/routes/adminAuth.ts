import { Router } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const router = Router();

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but not set.");
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// In-memory rate limiter for login attempts
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX_FAILURES = 5;       // failures allowed before lockout
const RATE_LIMIT_WINDOW_MS   = 60_000;  // 1-minute sliding window
const RATE_LIMIT_LOCKOUT_MS  = 60_000;  // lockout duration (1 minute)

interface RateLimitEntry {
  failures: number;
  windowStart: number;
  lockedUntil: number | null;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/** Returns { allowed: true } or { allowed: false, retryAfterMs } */
function checkRateLimit(ip: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry) {
    entry = { failures: 0, windowStart: now, lockedUntil: null };
    rateLimitStore.set(ip, entry);
  }

  // If currently locked out, check whether the lockout has expired
  if (entry.lockedUntil !== null) {
    if (now < entry.lockedUntil) {
      return { allowed: false, retryAfterMs: entry.lockedUntil - now };
    }
    // Lockout expired — reset
    entry.failures = 0;
    entry.windowStart = now;
    entry.lockedUntil = null;
  }

  // Slide the window if it has expired
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.failures = 0;
    entry.windowStart = now;
  }

  return { allowed: true };
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry) return;

  entry.failures += 1;

  if (entry.failures >= RATE_LIMIT_MAX_FAILURES) {
    entry.lockedUntil = now + RATE_LIMIT_LOCKOUT_MS;
  }
}

function recordSuccess(ip: string): void {
  rateLimitStore.delete(ip);
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET!).update(payload).digest("hex");
}

function makeToken(username: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${username}:${exp}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = raw.lastIndexOf(":");
    const payload = raw.slice(0, lastColon);
    const sig = raw.slice(lastColon + 1);

    const expected = sign(payload);
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;

    const expStr = payload.split(":")[1];
    if (!expStr || Date.now() > parseInt(expStr, 10)) return false;

    return true;
  } catch {
    return false;
  }
}

// POST /api/admin-auth/login
router.post("/admin-auth/login", (req, res) => {
  // Use req.ip — Express computes this from X-Forwarded-For according to the
  // `trust proxy` setting (1 hop, configured in app.ts for Replit's ingress proxy).
  // This gives the real per-client IP as recorded by Replit's proxy without
  // collapsing all clients onto the proxy socket address.
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";

  // Check rate limit before touching credentials
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
    res
      .status(429)
      .setHeader("Retry-After", String(retryAfterSec))
      .json({
        error: "Too many failed login attempts.",
        retryAfterSeconds: retryAfterSec,
      });
    return;
  }

  const { username, password } = req.body as { username?: string; password?: string };

  const expectedUsername = process.env.ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedUsername || !expectedPassword) {
    res.status(500).json({ error: "Admin credentials not configured." });
    return;
  }

  // Pad to expected length so timingSafeEqual never throws on length mismatch.
  // We still track a boolean so wrong-length inputs fail.
  function safeCompare(input: string, expected: string): boolean {
    const a = Buffer.from(input.padEnd(expected.length, "\0").slice(0, expected.length));
    const b = Buffer.from(expected);
    return timingSafeEqual(a, b) && input.length === expected.length;
  }

  const usernameMatch = !!username && safeCompare(username, expectedUsername);
  const passwordMatch = !!password && safeCompare(password, expectedPassword);

  if (!usernameMatch || !passwordMatch) {
    recordFailure(ip);
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  recordSuccess(ip);
  const token = makeToken(expectedUsername);
  res.json({ token });
});

// POST /api/admin-auth/verify
router.post("/admin-auth/verify", (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ valid: false });
    return;
  }
  res.json({ valid: true });
});

export default router;
