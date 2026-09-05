import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import AddToCartButton from "./AddToCartButton";

export default function ProductCard({
  product,
  headingLevel = 2,
  sizes = "(min-width: 1280px) 296px, (min-width: 1024px) calc(25vw - 24px), (min-width: 640px) calc(33.333vw - 27px), calc(50vw - 24px)",
  eager = false,
}: {
  product: Product;
  headingLevel?: 2 | 3;
  sizes?: string;
  eager?: boolean;
}) {
  const href = `/product/${product.id}`;
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm transition hover:shadow-md">
      {/* Image */}
      <Link href={href} aria-label={`View ${product.name}`} className="relative block aspect-square bg-cream-soft">
        {product.discount ? (
          <span className="absolute left-2 top-2 z-10 rounded bg-brand px-2 py-0.5 text-[10px] font-bold text-cream">
            {product.discount}% OFF
          </span>
        ) : null}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-brand/20">
            <ImagePlaceholder />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Heading className="text-sm font-medium text-gray-800">
          <Link href={href} className="hover:text-brand">
            {product.name}
          </Link>
        </Heading>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 rounded bg-rating px-1.5 py-0.5 font-semibold text-white">
            <StarIcon className="h-3 w-3" />
            {product.rating.toFixed(1)}
          </span>
          <span className="text-gray-500">({product.reviews})</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-sm font-bold text-gray-900">
            ₹{product.price.toFixed(2)}
          </span>
          {product.oldPrice ? (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.oldPrice.toFixed(2)}
            </span>
          ) : null}
        </div>

        <AddToCartButton product={product} />
      </div>
    </article>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="m12 2 3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
    </svg>
  );
}

function ImagePlaceholder() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
