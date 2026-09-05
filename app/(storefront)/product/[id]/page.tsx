import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import ProductActions from "@/components/product/ProductActions";
import ProductGallery from "@/components/product/ProductGallery";
import ProductReviews from "@/components/product/ProductReviews";
import { productDescription, SAMPLE_REVIEWS } from "@/data/products";
import { getProductPageData } from "@/lib/catalog";
import { createMetadata } from "@/lib/seo";
import { productSeo } from "@/lib/catalog-seo";
import { PageJsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getProductPageData(id);
  if (!data) notFound();
  if (data.canonicalId !== id) permanentRedirect(`/product/${encodeURIComponent(data.canonicalId)}`);
  return createMetadata(productSeo(data.product));
}

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`text-amber-400 ${className}`} aria-label={`${rating} out of 5`}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i} className={i < Math.round(rating) ? "" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProductPageData(id);
  if (!data) notFound();
  if (data.canonicalId !== id) permanentRedirect(`/product/${encodeURIComponent(data.canonicalId)}`);
  const { product, category, related } = data;
  const page = productSeo(product);

  return (
    <div className="bg-cream-soft">
      <PageJsonLd page={page} product={product} breadcrumbs={[
        { name: "Home", path: "/" },
        ...(category ? [{ name: category.label, path: category.href }] : []),
        { name: product.name, path: page.path },
      ]} />
      {/* Breadcrumb */}
      <div className="border-b border-black/5 bg-white">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 py-4 text-xs text-gray-500 sm:px-6">
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
          <span className="mx-2">/</span>
          {category ? (
            <>
              <Link href={category.href} className="hover:text-brand">
                {category.label}
              </Link>
              <span className="mx-2">/</span>
            </>
          ) : null}
          <span aria-current="page" className="text-gray-800">{product.name}</span>
        </nav>
      </div>

      {/* Detail */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Image gallery */}
          <ProductGallery
            image={product.image}
            alt={product.name}
            discount={product.discount}
          />

          {/* Info */}
          <div>
            {category ? (
              <Link
                href={category.href}
                className="text-xs font-semibold tracking-widest text-brand-light uppercase hover:text-brand"
              >
                {category.label}
              </Link>
            ) : null}
            <h1 className="mt-2 font-serif text-3xl text-gray-900">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <Stars rating={product.rating} />
              <span className="font-medium text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-gray-400">({product.reviews} reviews)</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ₹{product.price.toFixed(2)}
              </span>
              {product.oldPrice ? (
                <span className="text-lg text-gray-400 line-through">
                  ₹{product.oldPrice.toFixed(2)}
                </span>
              ) : null}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-gray-600">
              {productDescription(product)}
            </p>

            <ProductActions product={product} />

            {/* Meta */}
            <ul className="mt-8 space-y-2 border-t border-black/5 pt-6 text-sm text-gray-500">
              <li>✓ Freshly made in small batches</li>
              <li>✓ Free delivery on orders over ₹500</li>
              <li>✓ Hygienically packed with care</li>
            </ul>
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews
          productId={product.id}
          productName={product.name}
          baseRating={product.rating}
          baseCount={product.reviews}
          sampleReviews={SAMPLE_REVIEWS}
        />

        {/* Related */}
        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="mb-6 font-serif text-2xl text-gray-900">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} headingLevel={3} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
