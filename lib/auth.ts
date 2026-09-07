// Session auth. Two independent sessions live in two cookies:
//   - admin    (ADMIN_COOKIE):    the env-var bootstrap "super" admin, or a
//                                 store-managed "admin" user. 8-hour tokens.
//   - customer (CUSTOMER_COOKIE): a shopper with an account. 30-day tokens.
// Both are HMAC tokens signed with the same secret; lib/token.ts stamps a kind
// on each so one can never be read as the other. This module is only the
// cookie glue — it stays free of the data store so the edge proxy can import
// ADMIN_COOKIE from it.
import crypto from "crypto";
import { cookies } from "next/headers";
import {
  ADMIN_MAX_AGE,
  CUSTOMER_MAX_AGE,
  signToken,
  verifyAdminToken,
  verifyCustomerToken,
  type Role,
} from "@/lib/token";

export const ADMIN_COOKIE = "ok_admin";
export const CUSTOMER_COOKIE = "ok_customer";

export type { Role };
export type Session = { username: string; role: Role };

// Convenience fallbacks for local development only. Shipping a known signing
// secret or a known admin password is a full takeover, so in production these
// must be configured — there is no default to fall back to.
function devFallback(value: string): string | null {
  return process.env.NODE_ENV === "production" ? null : value;
}

function secret(): string {
  const configured = process.env.ADMIN_SESSION_SECRET;
  if (configured) return configured;
  const fallback = devFallback("dev-insecure-secret-change-me");
  // No safe default exists: refuse to sign or verify sessions rather than sign
  // them with a value an attacker already knows.
  if (!fallback) throw new Error("ADMIN_SESSION_SECRET must be set in production.");
  return fallback;
}

// The bootstrap super-admin credentials from the environment. When they are not
// configured in production the bootstrap account is simply disabled — store-managed
// admin users still sign in normally.
export function checkSuperCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME || devFallback("admin");
  const p = process.env.ADMIN_PASSWORD || devFallback("admin123");
  if (!u || !p) return false;
  return username === u && password === p;
}

/* ---- Password hashing (admin users and customers) ---- */

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const h = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(h);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---- Admin session ---- */

export function createToken(username: string, role: Role): string {
  return signToken({ k: "admin", u: username, r: role, t: Date.now() }, secret());
}

export function verifyToken(token?: string | null) {
  return verifyAdminToken(token, secret());
}

// Full session (username + role), or null.
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const payload = verifyToken(store.get(ADMIN_COOKIE)?.value);
  return payload ? { username: payload.u, role: payload.r } : null;
}

// Back-compat helper: the signed-in username (any role), or null.
export async function getAdminUser(): Promise<string | null> {
  return (await getSession())?.username ?? null;
}

export async function isSuperAdmin(): Promise<boolean> {
  return (await getSession())?.role === "super";
}

export async function setAdminSession(username: string, role: Role): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createToken(username, role), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/* ---- Customer session ---- */

// The signed-in customer's id, or null. Cheap: no database read.
export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  return verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value, secret())?.u ?? null;
}

export async function setCustomerSession(customerId: string): Promise<void> {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, signToken({ k: "customer", u: customerId, t: Date.now() }, secret()), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearCustomerSession(): Promise<void> {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/* ---- Order tracking links ---- */

// A guest's tracking link carries a signature of the order id — not the phone
// number — so nothing personal sits in the URL, browser history or server logs.
// Anyone holding the link can view that one order, which is the intent (it is
// what we email them); the phone number is only ever sent in a POST body.
export function orderTrackingToken(orderId: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`track:${orderId}`)
    .digest("base64url")
    .slice(0, 24);
}

export function verifyOrderTrackingToken(orderId: string, token: string | undefined): boolean {
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(orderTrackingToken(orderId));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function orderTrackingPath(orderId: string): string {
  return `/account/orders/${encodeURIComponent(orderId)}?t=${orderTrackingToken(orderId)}`;
}
