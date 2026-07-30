import { Router } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const router = Router();

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but not set.");
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

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
