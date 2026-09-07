"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/products";
import { useCart } from "@/components/cart/CartContext";

// Re-adds a past order's lines to the cart using today's product records, so
// prices are current and deleted / sold-out items are simply skipped upstream.
export default function BuyAgainButton({ lines }: { lines: { product: Product; qty: number }[] }) {
  const { qtyOf, setQty } = useCart();
  const [added, setAdded] = useState(false);

  if (lines.length === 0) return null;

  if (added) {
    return (
      <p className="text-sm text-gray-600">
        Added to your cart ·{" "}
        <Link href="/cart" className="font-semibold text-brand hover:text-brand-light">
          View cart
        </Link>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        for (const line of lines) setQty(line.product, qtyOf(line.product.id) + line.qty);
        setAdded(true);
      }}
      className="bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
    >
      BUY AGAIN
    </button>
  );
}
