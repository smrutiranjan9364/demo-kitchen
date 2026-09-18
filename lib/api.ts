import crypto from "node:crypto";
import { sql } from "@/lib/db";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function required(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new ApiError(`Please enter a valid ${label}.`);
  return value.trim();
}
export function integer(
  value: unknown,
  label: string,
  min = 0,
  max = 100000,
): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw new ApiError(`Invalid ${label}.`);
  return n;
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") ?? 0) > 64000)
    throw new ApiError("Request too large.", 413);
  let value;
  try {
    const raw = await request.text();
    if (raw.length > 64000) throw new Error();
    value = JSON.parse(raw);
  } catch {
    throw new ApiError("Invalid request body.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ApiError("Invalid request body.");
  return value;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new ApiError("Request origin is not allowed.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new ApiError("Request origin is not allowed.", 403);
}
export async function rateLimit(key: string, limit = 10, seconds = 900) {
  // Shared across instances; identifiers are hashed to keep email/IP out of storage.
  const digest = crypto.createHash("sha256").update(key).digest("hex");
  const [row] =
    await sql`INSERT INTO rate_limits(key,count,expires_at) VALUES (${digest},1,now() + ${seconds} * interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at <= now() THEN 1 ELSE rate_limits.count+1 END,
    expires_at=CASE WHEN rate_limits.expires_at <= now() THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END RETURNING count`;
  if (row.count > limit)
    throw new ApiError("Too many attempts. Please try again later.", 429);
}
export async function api(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError)
      return Response.json(
        { error: error.message },
        {
          status: error.status,
          headers: error.status === 429 ? { "Retry-After": "900" } : undefined,
        },
      );
    console.error(
      "API request failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "We couldn't complete this request. Please try again." },
      { status: 500 },
    );
  }
}
