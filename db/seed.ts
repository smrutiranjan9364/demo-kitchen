// Seeds the database from the static catalog in data/*.ts — but only for tables
// that are still empty, so it never clobbers admin edits. Safe to re-run.
//   npm run db:seed
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also load .env if present (does not override existing vars)
import postgres from "postgres";
import { ALL_PRODUCTS, FESTIVAL_FOODS } from "../data/products";
import { CATEGORIES, categorySlug, CONTACT, DISTRICTS_SEED } from "../data/site";

// Mirrors the defaults previously baked into lib/store.ts.
const DEFAULT_CATEGORY_IMAGE = "/images/wm/chanachur.jpg";

const SEED_FESTIVAL_NOTES: Record<string, string> = {
  "chhena-poda": "A caramelised cheese dessert, slow-baked to a smoky, golden finish.",
  "arisa-pitha": "Sweet rice-flour cakes fried in ghee — a Sankranti favourite.",
  rasabali: "Soft fried chhena discs soaked in thickened, cardamom-spiced milk.",
  "enduri-pitha":
    "Rice-and-lentil cakes steamed in fragrant turmeric leaves — the Prathamastami classic.",
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (add it to .env.local).");
  const sql = postgres(url, { ssl: "require", max: 1 });

  const isEmpty = async (table: string) => {
    const [{ n }] = await sql.unsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM ${table}`,
    );
    return n === 0;
  };

  // Products
  if (await isEmpty("products")) {
    for (const p of ALL_PRODUCTS) {
      await sql`
        INSERT INTO products (id, name, price, rating, reviews, category, image, old_price, discount)
        VALUES (${p.id}, ${p.name}, ${p.price}, 0, 0,
                ${p.category ?? null}, ${p.image ?? null}, ${p.oldPrice ?? null}, ${p.discount ?? null})
        ON CONFLICT (id) DO NOTHING`;
    }
    console.log(`✓ Seeded ${ALL_PRODUCTS.length} products.`);
  } else {
    console.log("• products already populated — skipped.");
  }

  // Categories
  if (await isEmpty("categories")) {
    for (const c of CATEGORIES) {
      await sql`
        INSERT INTO categories (slug, label, image, emoji, description)
        VALUES (${categorySlug(c)}, ${c.label}, ${c.image ?? ""}, ${c.emoji ?? null}, ${c.description ?? null})
        ON CONFLICT (slug) DO NOTHING`;
    }
    console.log(`✓ Seeded ${CATEGORIES.length} categories.`);
  } else {
    console.log("• categories already populated — skipped.");
  }

  // Districts
  if (await isEmpty("districts")) {
    let order = 0;
    for (const d of DISTRICTS_SEED) {
      await sql`
        INSERT INTO districts (slug, name, region, headquarter, description, image, sort_order)
        VALUES (${d.slug}, ${d.name}, ${d.region ?? null}, ${d.headquarter ?? null},
                ${d.description ?? null}, ${null}, ${order})
        ON CONFLICT (slug) DO NOTHING`;
      order += 1;
    }
    console.log(`✓ Seeded ${DISTRICTS_SEED.length} districts.`);
  } else {
    console.log("• districts already populated — skipped.");
  }

  // Festival foods
  if (await isEmpty("festival_foods")) {
    for (const f of FESTIVAL_FOODS) {
      await sql`
        INSERT INTO festival_foods (id, name, festival, image, note)
        VALUES (${f.id}, ${f.name}, ${f.festival},
                ${f.image || DEFAULT_CATEGORY_IMAGE}, ${SEED_FESTIVAL_NOTES[f.id] ?? null})
        ON CONFLICT (id) DO NOTHING`;
    }
    console.log(`✓ Seeded ${FESTIVAL_FOODS.length} festival foods.`);
  } else {
    console.log("• festival_foods already populated — skipped.");
  }

  // Settings (single row)
  await sql`
    INSERT INTO settings (id, store_name, email, phone, delivery_fee, free_delivery_over)
    VALUES (1, ${"Odia Kitchen"}, ${CONTACT.email}, ${CONTACT.phone}, ${40}, ${500})
    ON CONFLICT (id) DO NOTHING`;
  console.log("✓ Settings ensured.");

  await sql.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
