"use client";

import type { Product } from "@/data/products";
import { useCart } from "@/components/cart/CartContext";

export default function AddToCartButton({ product }: { product: Product }) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(product.id);

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => add(product)}
        aria-label={`Add ${product.name} to cart`}
        className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-brand text-[11px] font-semibold tracking-widest text-cream transition hover:bg-brand-light"
      >
        <CartIcon className="h-3.5 w-3.5" />
        ADD TO CART
      </button>
    );
  }

  return (
    <div className="mt-3 flex h-9 w-full items-center justify-between overflow-hidden rounded-md border border-brand">
      <button
        type="button"
        onClick={() => setQty(product, qty - 1)}
        aria-label="Decrease quantity"
        className="flex h-full w-9 items-center justify-center text-lg leading-none text-brand transition hover:bg-brand hover:text-cream"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-brand">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => setQty(product, qty + 1)}
        aria-label="Increase quantity"
        className="flex h-full w-9 items-center justify-center text-lg leading-none text-brand transition hover:bg-brand hover:text-cream"
      >
        +
      </button>
    </div>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.5 12h11l2-8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
