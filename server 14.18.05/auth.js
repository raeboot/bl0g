import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

export function makeToken(secret, userId = "user") {
  const issuedAt = Date.now();
  const payload = `${userId}|${issuedAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function verifyToken(token, secret) {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split("|");
    if (parts.length !== 3) return false;
    const [userId, issuedAt, sig] = parts;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${userId}|${issuedAt}`)
      .digest("hex");
    if (sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function authMiddleware(getSecret) {
  return (req, res, next) => {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer (.+)$/);
    if (!m || !verifyToken(m[1], getSecret())) {
      return res.status(401).json({ error: "unauthorized" });
    }
    next();
  };
}
