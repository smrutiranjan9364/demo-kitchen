// Applies db/schema.sql to the database. Idempotent — run any time.
//   npm run db:setup
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also load .env if present (does not override existing vars)
import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { TOP_DEALS } from "../data/products";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (add it to .env.local).");

  const sql = postgres(url, {
    ssl: ["localhost", "127.0.0.1"].includes(new URL(url).hostname)
      ? false
      : "require",
    max: 1,
  });
  const schema = await readFile(
    path.join(process.cwd(), "db", "schema.sql"),
    "utf8",
  );

  // `.simple()` runs the whole multi-statement script in one round trip.
  await sql.unsafe(schema).simple();
  const platform = await readFile(
    path.join(process.cwd(), "db", "platform.sql"),
    "utf8",
  );
  await sql.unsafe(platform).simple();
  // Curated deals previously existed only in static data. Persist them once
  // so checkout can reserve inventory and always use database prices.
  for (const product of TOP_DEALS) {
    await sql`INSERT INTO products(id,name,price,rating,reviews,image,old_price,discount)
      VALUES(${product.id},${product.name},${product.price},0,0,${product.image ?? null},${product.oldPrice ?? null},${product.discount ?? null}) ON CONFLICT(id) DO NOTHING`;
  }
  console.log("✓ Schema and platform migration applied.");
  await sql.end();
}

main().catch((err) => {
  console.error("Schema setup failed:", err);
  process.exit(1);
});
