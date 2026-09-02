"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/data/products";

type CartLine = Product & { qty: number };

const DELIVERY_FEE = 40;
const FREE_DELIVERY_OVER = 500;

export default function CartClient({ initialItems }: { initialItems: CartLine[] }) {
  const [items, setItems] = useState<CartLine[]>(initialItems);

  const updateQty = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it,
      ),
    );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items],
  );
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-soft text-3xl">
          🛒
        </div>
        <h2 className="font-serif text-xl text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-sm text-gray-500">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/categories"
          className="mt-6 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
        >
          START SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Items */}
      <div className="space-y-4 lg:col-span-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-cream-soft">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
              ) : null}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">₹{item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="text-gray-400 transition hover:text-brand"
                >
                  ✕
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between">
                {/* Qty stepper */}
                <div className="flex items-center rounded-md border border-black/10">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    aria-label="Decrease quantity"
                    className="px-3 py-1.5 text-brand hover:bg-cream-soft"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    aria-label="Increase quantity"
                    className="px-3 py-1.5 text-brand hover:bg-cream-soft"
                  >
                    +
                  </button>
                </div>
                <span className="font-semibold text-gray-900">
                  ₹{(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}

        <Link
          href="/categories"
          className="inline-block text-sm font-medium text-brand hover:text-brand-light"
        >
          ← Continue shopping
        </Link>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="font-serif text-lg text-gray-900">Order Summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Subtotal</dt>
            <dd className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Delivery</dt>
            <dd className="font-medium text-gray-900">
              {delivery === 0 ? "Free" : `₹${delivery.toFixed(2)}`}
            </dd>
          </div>
          {delivery > 0 ? (
            <p className="text-xs text-gray-400">
              Add ₹{(FREE_DELIVERY_OVER - subtotal).toFixed(2)} more for free delivery.
            </p>
          ) : null}
          <div className="flex justify-between border-t border-black/10 pt-3 text-base">
            <dt className="font-semibold text-gray-900">Total</dt>
            <dd className="font-bold text-brand">₹{total.toFixed(2)}</dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          className="mt-6 block w-full bg-brand py-3 text-center text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
        >
          PROCEED TO CHECKOUT
        </Link>
        <p className="mt-3 text-center text-[11px] text-gray-400">
          Secure checkout · Free delivery over ₹{FREE_DELIVERY_OVER}
        </p>
      </aside>
    </div>
  );
}
