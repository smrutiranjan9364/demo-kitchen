// Shared server-side identity rules for product pages, featured links and the
// sitemap. These readers are memoized only for the current render request.
import { cache } from "react";
import { ALL_PRODUCTS, BEST_SELLERS, TOP_DEALS, type Product } from "@/data/products";
import { getDistrictBySlug, type Category } from "@/data/site";
import {
  getCategory,
  getDistrict,
  getProduct,
  getProducts,
  getRelated,
  getRatingSummary,
  withLiveRating,
  type AdminDistrict,
} from "@/lib/store";

// Only the five known homepage aliases can resolve to a seeded catalog ID.
// Matching the original ID, name and image prevents merging unrelated products
// merely because an administrator happens to give them the same name.
function aliasSeed(product: Product): Product | undefined {
  const alias = BEST_SELLERS.find(
    (entry) => entry.id === product.id && sameIdentity(entry, product),
  );
  return alias
    ? ALL_PRODUCTS.find((entry) => sameIdentity(entry, alias))
    : undefined;
}

function sameIdentity(left: Product, right: Product): boolean {
  return left.name === right.name && left.image === right.image;
}

function canonicalProduct(product: Product, products: Map<string, Product>): Product {
  const seed = aliasSeed(product);
  const candidate = seed ? products.get(seed.id) : undefined;
  return seed && candidate && sameIdentity(seed, candidate) ? candidate : product;
}

const getCatalog = cache(async (): Promise<Map<string, Product>> => {
  const products = new Map((await getProducts()).map((product) => [product.id, product]));
  // These curated items have always existed independently of the DB. Do not
  // reintroduce arbitrary seeded products that an administrator has deleted.
  const curated = [...BEST_SELLERS, ...TOP_DEALS].filter((product) => !products.has(product.id));
  // Their seeded ratings are demo numbers; real ones come from approved reviews.
  const live = await getRatingSummary(curated.map((product) => product.id));
  for (const product of curated) products.set(product.id, withLiveRating(product, live));
  return products;
});

/** Every live canonical product, including the explicitly curated deal items. */
export const getPublicProducts = cache(async (): Promise<Product[]> => {
  const catalog = await getCatalog();
  const canonical = new Map<string, Product>();
  for (const product of catalog.values()) {
    const resolved = canonicalProduct(product, catalog);
    canonical.set(resolved.id, resolved);
  }
  return Array.from(canonical.values());
});

/** Homepage/deal cards use the same canonical product and current DB price. */
export const getFeaturedProducts = cache(async (): Promise<{
  bestSellers: Product[];
  topDeals: Product[];
}> => {
  const catalog = await getCatalog();
  const resolve = (product: Product) => canonicalProduct(catalog.get(product.id) ?? product, catalog);
  return {
    bestSellers: BEST_SELLERS.map(resolve),
    topDeals: TOP_DEALS.map(resolve),
  };
});

export type ProductPageData = {
  product: Product;
  canonicalId: string;
  category: Category | undefined;
  related: Product[];
};

/** Missing/deleted catalog IDs remain missing; callers choose notFound/redirect. */
export const getProductPageData = cache(async (id: string): Promise<ProductPageData | undefined> => {
  const requested = await getProduct(id);
  if (!requested) return undefined;

  const seed = aliasSeed(requested);
  const candidate = seed ? await getProduct(seed.id) : undefined;
  const product = seed && candidate && sameIdentity(seed, candidate) ? candidate : requested;
  const [category, related] = await Promise.all([
    product.category ? getCategory(product.category) : Promise.resolve(undefined),
    getRelated(product),
  ]);
  return { product, canonicalId: product.id, category, related };
});

/** Keep the existing district fallback consistent between metadata and content. */
export const resolveDistrict = cache(async (slug: string): Promise<AdminDistrict | undefined> => {
  const district = await getDistrict(slug);
  if (district) return district;
  const seed = getDistrictBySlug(slug);
  return seed ? { ...seed, image: undefined, sortOrder: 0 } : undefined;
});
