"use client";

import { cartKey } from "@/lib/menu";
import { useState } from "react";
import Link from "next/link";
import { isSoldOut, type Product } from "@/data/products";
import { useCart } from "@/components/cart/CartContext";

export default function ProductActions({ product }: { product: Product }) {
  const { lines, qtyOf, setQty } = useCart();
  const inCart = qtyOf(product.id);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id ?? "");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const selected = { ...product, variantId, addonIds, instructions };
  const lineQty = lines.find((l) => cartKey(l) === cartKey(selected))?.qty ?? 0;
  const unitPrice =
    product.price +
    (product.variants?.find((v) => v.id === variantId)?.price ?? 0) +
    (product.addons ?? [])
      .filter((a) => addonIds.includes(a.id))
      .reduce((n, a) => n + a.price, 0);
  const [qty, setQty2] = useState(1);
  const [added, setAdded] = useState(false);
  // How many more this shopper can still add (Infinity when stock isn't tracked).
  const remaining = Math.max(0, Math.min(50, product.stock ?? 50) - inCart);

  if (isSoldOut(product)) {
    return (
      <div className="mt-6 rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">Sold out.</span> This
        batch has gone — check back soon or browse similar items below.
      </div>
    );
  }

  const addToCart = () => {
    if (!setQty(selected, lineQty + Math.min(qty, remaining))) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-6">
      {product.variants?.length ? (
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-semibold">Choose portion</legend>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className="rounded-lg border border-black/10 bg-white p-3 text-sm"
              >
                <input
                  type="radio"
                  name={`variant-${product.id}`}
                  checked={variantId === v.id}
                  onChange={() => setVariantId(v.id)}
                />{" "}
                {v.label} · ₹{product.price + v.price}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {product.addons?.length ? (
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-semibold">Add extras</legend>
          <div className="flex flex-wrap gap-3">
            {product.addons.map((a) => (
              <label
                key={a.id}
                className="rounded-lg border border-black/10 bg-white p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={addonIds.includes(a.id)}
                  onChange={(e) =>
                    setAddonIds((current) =>
                      e.target.checked
                        ? [...current, a.id]
                        : current.filter((id) => id !== a.id),
                    )
                  }
                />{" "}
                {a.label} +₹{a.price}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <label className="mb-4 block text-sm text-gray-600">
        Food instructions (optional)
        <input
          className="mt-1 w-full rounded-lg border border-black/10 bg-white p-3"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          maxLength={200}
          placeholder="For example, less spicy"
        />
      </label>
      <p className="mb-3 text-sm font-semibold text-brand">
        ₹{unitPrice} per item
      </p>
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
          <span className="w-10 text-center text-sm font-bold tabular-nums">
            {qty}
          </span>
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
            added
              ? "bg-rating text-white"
              : "bg-brand text-cream hover:bg-brand-light"
          }`}
        >
          {added
            ? "✓ ADDED TO CART"
            : remaining === 0
              ? "ALL IN YOUR CART"
              : "ADD TO CART"}
        </button>
      </div>

      {product.stock != null && product.stock <= 5 ? (
        <p className="mt-3 text-sm font-medium text-brand">
          Only {product.stock} left
        </p>
      ) : null}

      {inCart > 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          {inCart} already in your cart ·{" "}
          <Link
            href="/cart"
            className="font-semibold text-brand hover:text-brand-light"
          >
            View cart
          </Link>
        </p>
      ) : null}
    </div>
  );
}
