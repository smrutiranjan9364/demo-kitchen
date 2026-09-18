import { publicApi, publicJson, corsPreflight } from "@/lib/public-api";
import { getPublicProducts } from "@/lib/catalog";
import { isSoldOut, type Product } from "@/data/products";

// GET /api/catalog/products
//   ?q=chhena          full-text-ish match on name/category/district
//   ?category=sweets   filter by category slug
//   ?district=puri     filter by district slug
//   ?sort=price_asc|price_desc|rating|popular   (default: name)
//   ?inStock=true      hide sold-out items
//   ?page=1&limit=20   pagination (limit capped at 50)
// Backs the mobile Search, Shop, Deals and Category listing screens.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

function matches(p: Product, q: string): boolean {
  if (!q) return true;
  const hay = `${p.name} ${p.category ?? ""} ${p.district ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export function GET(request: Request) {
  return publicApi(async () => {
    const params = new URL(request.url).searchParams;
    const q = (params.get("q") ?? "").trim().slice(0, 100);
    const category = (params.get("category") ?? "").trim();
    const district = (params.get("district") ?? "").trim();
    const sort = params.get("sort") ?? "";
    const inStock = params.get("inStock") === "true";
    const page = Math.max(1, Math.min(1000, Number(params.get("page")) || 1));
    const limit = Math.max(1, Math.min(50, Number(params.get("limit")) || 20));

    let items = await getPublicProducts();
    if (category) items = items.filter((p) => p.category === category);
    if (district) items = items.filter((p) => p.district === district);
    if (q) items = items.filter((p) => matches(p, q));
    if (inStock) items = items.filter((p) => !isSoldOut(p));

    switch (sort) {
      case "price_asc":
        items = [...items].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        items = [...items].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        items = [...items].sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
        items = [...items].sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = items.length;
    const start = (page - 1) * limit;
    return publicJson({
      products: items.slice(start, start + limit),
      total,
      page,
      limit,
      hasMore: start + limit < total,
    });
  });
}
