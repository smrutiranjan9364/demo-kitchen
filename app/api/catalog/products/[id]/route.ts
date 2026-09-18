import { publicApi, publicJson, publicError, corsPreflight } from "@/lib/public-api";
import { getProductPageData } from "@/lib/catalog";
import { getReviewsForProduct } from "@/lib/store";

// GET /api/catalog/products/[id] — full product detail for the mobile Product
// screen: the canonical product, its category, related items and approved
// reviews. Mirrors what the storefront /product/[id] page renders.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return publicApi(async () => {
    const { id } = await ctx.params;
    const data = await getProductPageData(id);
    if (!data) return publicError("Product not found.", 404);
    const reviews = await getReviewsForProduct(data.canonicalId);
    return publicJson({
      product: data.product,
      canonicalId: data.canonicalId,
      category: data.category ?? null,
      related: data.related,
      reviews,
    });
  });
}
