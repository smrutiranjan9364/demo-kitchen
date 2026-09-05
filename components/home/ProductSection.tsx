import Link from "next/link";
import type { Product } from "@/data/products";
import ProductCard from "./ProductCard";

export default function ProductSection({
  title,
  products,
  viewAllHref = "/shop",
  prioritizeFirstImage = false,
}: {
  title: string;
  products: Product[];
  viewAllHref?: string;
  prioritizeFirstImage?: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-xl text-gray-900">{title}</h2>
        <Link
          href={viewAllHref}
          aria-label={`View all ${title.toLowerCase()}`}
          className="rounded bg-brand px-3 py-1.5 text-xs font-semibold tracking-wide text-cream hover:bg-brand-light"
        >
          VIEW ALL
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            headingLevel={3}
            sizes="(min-width: 1280px) 234px, (min-width: 1024px) calc(20vw - 23px), (min-width: 640px) calc(33.333vw - 27px), calc(50vw - 24px)"
            eager={prioritizeFirstImage && index === 0}
          />
        ))}
      </div>
    </section>
  );
}
