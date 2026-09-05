import type { MetadataRoute } from "next";
import { DISTRICTS_SEED } from "@/data/site";
import { getPublicProducts } from "@/lib/catalog";
import { getCategories, getDistricts, getProducts } from "@/lib/store";
import { absoluteUrl, getSeoConfig, SEO_PAGES, seoPage, type StaticSeoPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!getSeoConfig().indexable) return [];
  const [products, catalog, categories, districts] = await Promise.all([
    getPublicProducts(), getProducts(), getCategories(), getDistricts(),
  ]);
  const paths = new Set<string>(
    (Object.keys(SEO_PAGES) as StaticSeoPath[]).filter((path) => !seoPage(path).noindex),
  );
  for (const product of products) paths.add(`/product/${encodeURIComponent(product.id)}`);
  for (const category of categories) if (category.count) paths.add(category.href);
  const populatedDistricts = new Set(catalog.map((product) => product.district).filter(Boolean));
  for (const district of [...DISTRICTS_SEED, ...districts]) {
    if (populatedDistricts.has(district.slug)) paths.add(`/district/${encodeURIComponent(district.slug)}`);
  }
  // No fabricated lastModified timestamps: the schema has no reliable update dates.
  // Let DB failures return an error instead of publishing a misleading partial sitemap.
  return Array.from(paths, (path) => ({ url: absoluteUrl(path)! }));
}
