import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import ProductActions from "@/components/product/ProductActions";
import {
  CATALOG_PRODUCTS,
  getProductById,
  relatedProducts,
  productDescription,
  SAMPLE_REVIEWS,
} from "@/data/products";
import { getCategoryBySlug } from "@/data/site";

export function generateStaticParams() {
  return CATALOG_PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return { title: "Product not found — Rosy's Kitchen" };
  return {
    title: `${product.name} — Rosy's Kitchen`,
    description: productDescription(product),
  };
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
  const product = getProductById(id);
  if (!product) notFound();

  const category = product.category ? getCategoryBySlug(product.category) : undefined;
  const related = relatedProducts(product);

  return (
    <div className="bg-cream-soft">
      {/* Breadcrumb */}
      <div className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-gray-500 sm:px-6">
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
          <span className="text-gray-800">{product.name}</span>
        </div>
      </div>

      {/* Detail */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : null}
            {product.discount ? (
              <span className="absolute left-4 top-4 rounded bg-brand px-2.5 py-1 text-xs font-bold text-cream">
                {product.discount}% OFF
              </span>
            ) : null}
          </div>

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
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-gray-900">Customer Reviews</h2>

          <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="text-center">
              <p className="font-serif text-4xl text-gray-900">
                {product.rating.toFixed(1)}
              </p>
              <Stars rating={product.rating} className="text-lg" />
              <p className="mt-1 text-xs text-gray-500">{product.reviews} reviews</p>
            </div>
            <div className="flex-1 border-l border-black/5 pl-6 text-sm text-gray-600">
              Most customers love the authentic taste and careful packaging. Here&apos;s
              what a few of them said.
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {SAMPLE_REVIEWS.map((r, i) => (
              <div
                key={i}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-sm font-bold text-brand">
                      {r.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                      <Stars rating={r.rating} className="text-xs" />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="mb-6 font-serif text-2xl text-gray-900">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
