"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";
import { useCart } from "@/components/cart/CartContext";

export default function ProductActions({ product }: { product: Product }) {
  const { qtyOf, setQty } = useCart();
  const inCart = qtyOf(product.id);
  const [qty, setQty2] = useState(1);
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    setQty(product, inCart + qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        {/* Quantity */}
        <div className="flex h-11 items-center overflow-hidden rounded-md border border-black/15">
          <button
            type="button"
            onClick={() => setQty2((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex h-full w-11 items-center justify-center text-lg text-brand hover:bg-cream-soft"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-bold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty2((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex h-full w-11 items-center justify-center text-lg text-brand hover:bg-cream-soft"
          >
            +
          </button>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          onClick={addToCart}
          className={`h-11 flex-1 rounded-md text-xs font-semibold tracking-widest transition ${
            added ? "bg-rating text-white" : "bg-brand text-cream hover:bg-brand-light"
          }`}
        >
          {added ? "✓ ADDED TO CART" : "ADD TO CART"}
        </button>
      </div>

      {inCart > 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          {inCart} already in your cart ·{" "}
          <Link href="/cart" className="font-semibold text-brand hover:text-brand-light">
            View cart
          </Link>
        </p>
      ) : null}
    </div>
  );
}
