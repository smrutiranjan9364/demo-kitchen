import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import { getProductsByDistrict } from "@/lib/store";
import { resolveDistrict } from "@/lib/catalog";
import { createMetadata } from "@/lib/seo";
import { districtSeo } from "@/lib/catalog-seo";
import { PageJsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const district = await resolveDistrict(slug);
  if (!district) notFound();
  const products = await getProductsByDistrict(slug);
  return createMetadata(districtSeo(district, products.length));
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
      <PageJsonLd page={districtSeo(district, products.length)} breadcrumbs={[
        { name: "Home", path: "/" },
        { name: district.name, path: `/district/${encodeURIComponent(district.slug)}` },
      ]} />
      {/* Page header */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream/70">Districts</span>
            <span className="mx-2">/</span>
            <span aria-current="page" className="text-cream">{district.name}</span>
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
