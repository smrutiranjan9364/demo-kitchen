import Link from "next/link";
import type { Product } from "@/data/products";
import ProductCard from "./ProductCard";

export default function ProductSection({
  title,
  products,
  viewAllHref = "#",
}: {
  title: string;
  products: Product[];
  viewAllHref?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-xl text-gray-900">{title}</h2>
        <Link
          href={viewAllHref}
          className="rounded bg-brand px-3 py-1.5 text-xs font-semibold tracking-wide text-cream hover:bg-brand-light"
        >
          VIEW ALL
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
