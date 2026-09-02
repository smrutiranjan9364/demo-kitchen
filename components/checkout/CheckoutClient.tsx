"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/data/products";

type CartLine = Product & { qty: number };

const DELIVERY_FEE = 40;
const FREE_DELIVERY_OVER = 500;
const PAYMENT_METHODS = ["Cash on Delivery", "UPI", "Card"] as const;

export default function CheckoutClient({ items }: { items: CartLine[] }) {
  const [placed, setPlaced] = useState(false);
  const [payment, setPayment] = useState<string>(PAYMENT_METHODS[0]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items],
  );
  const delivery = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  if (placed) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rating/10 text-3xl text-rating">
          ✓
        </div>
        <h2 className="font-serif text-2xl text-gray-900">Order placed!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Thank you for shopping with Rosy&apos;s Kitchen. A confirmation has been
          sent to your email. Your order total was{" "}
          <span className="font-semibold text-brand">₹{total.toFixed(2)}</span>.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
        >
          BACK TO HOME
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setPlaced(true);
      }}
      className="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      {/* Form fields */}
      <div className="space-y-6 lg:col-span-2">
        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-serif text-lg text-gray-900">
            Contact details
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" placeholder="Rosy Sahoo" required />
            <Field label="Phone" name="phone" type="tel" placeholder="9437141055" required />
            <div className="sm:col-span-2">
              <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-serif text-lg text-gray-900">
            Delivery address
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Address" name="address" placeholder="House no, street, area" required />
            </div>
            <Field label="City" name="city" placeholder="Bhubaneswar" required />
            <Field label="State" name="state" placeholder="Odisha" required />
            <Field label="Pincode" name="pincode" placeholder="751001" required />
            <Field label="Landmark (optional)" name="landmark" placeholder="Near temple" />
          </div>
        </fieldset>

        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-serif text-lg text-gray-900">
            Payment method
          </legend>
          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                  payment === method
                    ? "border-brand bg-cream-soft"
                    : "border-black/10 hover:border-brand/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={payment === method}
                  onChange={() => setPayment(method)}
                  className="accent-brand"
                />
                <span className="font-medium text-gray-800">{method}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="font-serif text-lg text-gray-900">Order Summary</h2>

        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-cream-soft">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                ) : null}
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-cream">
                  {item.qty}
                </span>
              </div>
              <span className="flex-1 text-sm text-gray-700">{item.name}</span>
              <span className="text-sm font-medium text-gray-900">
                ₹{(item.price * item.qty).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-3 border-t border-black/10 pt-4 text-sm">
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
          <div className="flex justify-between border-t border-black/10 pt-3 text-base">
            <dt className="font-semibold text-gray-900">Total</dt>
            <dd className="font-bold text-brand">₹{total.toFixed(2)}</dd>
          </div>
        </dl>

        <button
          type="submit"
          className="mt-6 w-full bg-brand py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
        >
          PLACE ORDER
        </button>
        <Link
          href="/cart"
          className="mt-3 block text-center text-xs font-medium text-brand hover:text-brand-light"
        >
          ← Back to cart
        </Link>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required ? <span className="text-brand">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}
