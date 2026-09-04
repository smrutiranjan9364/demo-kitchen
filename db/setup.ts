// Applies db/schema.sql to the database. Idempotent — run any time.
//   npm run db:setup
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also load .env if present (does not override existing vars)
import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (add it to .env.local).");

  const sql = postgres(url, { ssl: "require", max: 1 });
  const schema = await readFile(path.join(process.cwd(), "db", "schema.sql"), "utf8");

  // `.simple()` runs the whole multi-statement script in one round trip.
  await sql.unsafe(schema).simple();
  console.log("✓ Schema applied.");
  await sql.end();
}

main().catch((err) => {
  console.error("Schema setup failed:", err);
  process.exit(1);
});
