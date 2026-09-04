// Server-only Postgres connection (Neon). All data access in lib/store.ts goes
// through this single shared client. Import only from server code (server
// components, route handlers, scripts) — never from a "use client" file.
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add your Neon connection string to .env.local " +
      "(use the pooled -pooler endpoint for serverless).",
  );
}

// Reuse a single client across hot reloads in dev so we don't leak connections.
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

export const sql =
  globalForDb.sql ??
  postgres(url, {
    // Neon requires TLS. `require` verifies the chain via the system CAs.
    ssl: "require",
    // Keep the per-instance pool small — serverless spins up many instances,
    // and the Neon pooler multiplexes them on its side.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
