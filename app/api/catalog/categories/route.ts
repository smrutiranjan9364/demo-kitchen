import { publicApi, publicJson, corsPreflight } from "@/lib/public-api";
import { getCategories } from "@/lib/store";

// GET /api/catalog/categories — admin-managed categories with live product
// counts, in the same shape the storefront /categories page uses.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export function GET() {
  return publicApi(async () => publicJson({ categories: await getCategories() }));
}
