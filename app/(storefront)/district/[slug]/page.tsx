import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import { getDistrictBySlug } from "@/data/site";
import { getDistrict, getProductsByDistrict } from "@/lib/store";

export const dynamic = "force-dynamic";

// Resolve a district by slug: prefer the DB (admin-managed), fall back to the
// static seed list. Returns a normalised { name, region?, headquarter?, description? }.
async function resolveDistrict(slug: string) {
  const db = await getDistrict(slug);
  if (db) return db;
  const seed = getDistrictBySlug(slug);
  return seed ? { ...seed, image: undefined } : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const district = await resolveDistrict(slug);
  if (!district) return { title: "District not found — Odia Kitchen" };
  return {
    title: `${district.name} — Odia Kitchen`,
    description:
      district.description ||
      `Authentic Odia snacks, sweets and spices delivered across ${district.name} district.`,
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const district = await resolveDistrict(slug);
  if (!district) notFound();

  const products = await getProductsByDistrict(slug);

  return (
    <div className="bg-cream-soft">
      {/* Page header */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream/70">Districts</span>
            <span className="mx-2">/</span>
            <span className="text-cream">{district.name}</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">{district.name}</h1>
          {district.region || district.headquarter ? (
            <p className="mt-1 text-xs text-cream/70">
              {[district.region ? `${district.region} Odisha` : null, district.headquarter ? `HQ: ${district.headquarter}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          <p className="mt-2 max-w-xl text-sm text-cream/80">
            {district.description ||
              `Authentic Odia snacks, sweets and spices — freshly made and delivered across ${district.name} district.`}
          </p>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="mb-6 text-sm text-gray-500">
          {products.length} {products.length === 1 ? "product" : "products"} available
          in {district.name}
        </p>

        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">
            No products available in this district yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
