// Admin session auth with roles. The env-var account (ADMIN_USERNAME /
// ADMIN_PASSWORD) is the bootstrap "super" admin. Additional "admin" users are
// created by a super admin and stored in the data store (verified in the login
// route — this module stays free of the fs store so it is safe to import from
// the edge proxy). The session cookie is an HMAC-signed token.
import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ok_admin";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export type Role = "super" | "admin";
export type Session = { username: string; role: Role };

type Payload = { u: string; r: Role; t: number };

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-insecure-secret-change-me";
}

// The bootstrap super-admin credentials from the environment.
export function checkSuperCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME || "admin";
  const p = process.env.ADMIN_PASSWORD || "admin123";
  return username === u && password === p;
}

/* ---- Password hashing (for store-managed admin users) ---- */

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

/* ---- Session token ---- */

export function createToken(username: string, role: Role): string {
  const payload = Buffer.from(
    JSON.stringify({ u: username, r: role, t: Date.now() } satisfies Payload),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token?: string | null): Payload | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as Payload;
    if (parsed.r !== "super" && parsed.r !== "admin") return null;
    if (typeof parsed.t !== "number" || Date.now() - parsed.t > SESSION_MAX_AGE * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
