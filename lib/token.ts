// HMAC-signed session tokens. Pure Node crypto with no Next imports, so admin
// and customer sessions share one implementation and it unit-tests without a
// request context (see tests/auth.test.ts).
import crypto from "crypto";

export type Role = "super" | "admin";

// `k` is the kind discriminator. Admin and customer tokens are signed with the
// same secret, so without it a customer session would be a structurally valid
// admin session. Every reader checks `k` before anything else.
export type Payload =
  | { k: "admin"; u: string; r: Role; t: number }
  | { k: "customer"; u: string; t: number };

export const ADMIN_MAX_AGE = 60 * 60 * 8; // 8 hours
export const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function hmac(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function signToken(payload: Payload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body, secret)}`;
}

function readToken(token: string | null | undefined, secret: string): Payload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(hmac(body, secret));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<Payload>;
    if (typeof p.u !== "string" || typeof p.t !== "number") return null;
    if (p.k !== "admin" && p.k !== "customer") return null;
    return p as Payload;
  } catch {
    return null;
  }
}

const fresh = (issuedAt: number, maxAge: number) => Date.now() - issuedAt <= maxAge * 1000;

export function verifyAdminToken(
  token: string | null | undefined,
  secret: string,
): Extract<Payload, { k: "admin" }> | null {
  const p = readToken(token, secret);
  if (!p || p.k !== "admin") return null;
  if (p.r !== "super" && p.r !== "admin") return null;
  return fresh(p.t, ADMIN_MAX_AGE) ? p : null;
}

export function verifyCustomerToken(
  token: string | null | undefined,
  secret: string,
): Extract<Payload, { k: "customer" }> | null {
  const p = readToken(token, secret);
  if (!p || p.k !== "customer") return null;
  return fresh(p.t, CUSTOMER_MAX_AGE) ? p : null;
}
