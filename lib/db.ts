// Server-only Postgres connection (Neon). All data access in lib/store.ts goes
// through this single shared client. Import only from server code (server
// components, route handlers, scripts) — never from a "use client" file.
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

// Reuse a single client across hot reloads in dev so we don't leak connections.
const globalForDb = globalThis as unknown as { sql?: Sql };

function createClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to the " +
        "environment (.env.local locally, or the host's env vars in production) " +
        "— use the pooled -pooler endpoint for serverless.",
    );
  }
  return postgres(url, {
    // Neon requires TLS. `require` verifies the chain via the system CAs.
    ssl: "require",
    // Keep the per-instance pool small — serverless spins up many instances,
    // and the Neon pooler multiplexes them on its side.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Disable prepared statements. Neon's pooled endpoint (PgBouncer in
    // transaction mode) caches query plans across the pool, so after a schema
    // change (e.g. adding the products.district column) a cached `SELECT *`
    // plan throws "cached plan must not change result type". Turning prepare
    // off avoids that entirely and is required for transaction-mode pooling.
    prepare: false,
  });
}

// Lazily create the client on first use so merely importing this module never
// touches DATABASE_URL. Next.js evaluates route/page modules during the build
// ("collect page data"); an eager connection there would fail the build on any
// host that only provides DATABASE_URL at runtime.
function getClient(): Sql {
  if (!globalForDb.sql) globalForDb.sql = createClient();
  return globalForDb.sql;
}

// A thin proxy that forwards tagged-template calls (`sql\`...\``) and property
// access (`sql.json`, `sql.begin`, …) to the lazily-initialised client.
export const sql: Sql = new Proxy(function () {} as unknown as Sql, {
  apply(_target, _thisArg, args: unknown[]) {
    // @ts-expect-error — postgres' call signature is a tagged template.
    return getClient()(...args);
  },
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as Sql;
