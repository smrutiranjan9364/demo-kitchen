// Shared helpers for the public, read-only catalog API consumed by the mobile
// app (see /api/catalog/*). These endpoints are ADDITIVE — they expose the same
// catalog data the storefront already renders server-side, as JSON, without
// touching any existing route or the website UI. They are safe to call cross
// origin because they are public GETs of data anyone can already see on the
// site; nothing here reads a session or returns anything customer-specific.
import { NextResponse } from "next/server";

// Permissive CORS for the native app (and Expo web during development). Only
// GET/OPTIONS are allowed here — the write endpoints (orders, auth, …) keep
// their existing same-origin protection and are not touched.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Catalog is dynamic (admin-managed); let clients cache briefly but revalidate.
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
};

export function publicJson(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200, headers: CORS });
}

export function publicError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: CORS });
}

// Preflight for browsers (Expo web). Native fetch never sends one.
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Wraps a handler so a thrown error becomes a friendly 500 with CORS headers,
// mirroring lib/api.ts's `api()` for the write routes.
export async function publicApi(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    console.error("Public catalog API failed", error instanceof Error ? error.message : "Unknown error");
    return publicError("We couldn't load this right now. Please try again.", 500);
  }
}
