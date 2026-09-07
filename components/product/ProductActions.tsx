"use client";

import { useState } from "react";
import Link from "next/link";
import { isSoldOut, type Product } from "@/data/products";
import { useCart } from "@/components/cart/CartContext";

export default function ProductActions({ product }: { product: Product }) {
  const { qtyOf, setQty } = useCart();
  const inCart = qtyOf(product.id);
  const [qty, setQty2] = useState(1);
  const [added, setAdded] = useState(false);
  // How many more this shopper can still add (Infinity when stock isn't tracked).
  const remaining = product.stock != null ? Math.max(0, product.stock - inCart) : Infinity;

  if (isSoldOut(product)) {
    return (
      <div className="mt-6 rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">Sold out.</span> This batch has gone —
        check back soon or browse similar items below.
      </div>
    );
  }

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
            onClick={() => setQty2((q) => Math.min(remaining, q + 1))}
            disabled={qty >= remaining}
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
          disabled={remaining === 0}
          className={`h-11 flex-1 rounded-md text-xs font-semibold tracking-widest transition disabled:cursor-not-allowed disabled:opacity-60 ${
            added ? "bg-rating text-white" : "bg-brand text-cream hover:bg-brand-light"
          }`}
        >
          {added ? "✓ ADDED TO CART" : remaining === 0 ? "ALL IN YOUR CART" : "ADD TO CART"}
        </button>
      </div>

      {product.stock != null && product.stock <= 5 ? (
        <p className="mt-3 text-sm font-medium text-brand">Only {product.stock} left</p>
      ) : null}

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
