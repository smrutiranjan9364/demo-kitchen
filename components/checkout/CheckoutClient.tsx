"use client";

import { cartKey } from "@/lib/menu";
import { useRef, useState } from "react";
import { requestApi } from "@/components/platform/UI";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/CartContext";
import {
  INDIAN_STATES,
  PAYMENT_METHODS,
  isServiceable,
  parsePincodePrefixes,
  priceOrder,
  type DeliveryRates,
} from "@/lib/orders";

// What the server confirmed it saved. Totals come back from the API rather
// than the browser, so the shopper sees the amount actually recorded.
type PlacedOrder = { id: string; total: number; trackUrl?: string };

// Known details for a signed-in shopper (their last order, else their account).
export type CheckoutPrefill = Partial<
  Record<
    "name" | "phone" | "email" | "address" | "city" | "state" | "pincode",
    string
  >
>;

export default function CheckoutClient({
  rates,
  prefill,
  deliveryPincodes,
  addresses = [],
  onlinePayment = false,
}: {
  onlinePayment?: boolean;
  addresses?: {
    id: string;
    label: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
  }[];
  rates: DeliveryRates;
  prefill?: CheckoutPrefill;
  deliveryPincodes: string;
}) {
  const { lines: items, clear } = useCart();
  // Pincode is controlled so we can say "we don't deliver there" before submit.
  const [pincode, setPincode] = useState(prefill?.pincode ?? "");
  const pincodeComplete = /^\d{6}$/.test(pincode.trim());
  const isHouseOrder = items.every(item=>(item.restaurantId ?? "odia-kitchen") === "odia-kitchen");
  const serviceable =
    pincodeComplete && isServiceable(pincode, deliveryPincodes);
  const hasServiceArea = isHouseOrder && parsePincodePrefixes(deliveryPincodes).length > 0;
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<string>(PAYMENT_METHODS[0]);

  const [quote, setQuote] = useState<{
    fingerprint: string;
    cart: string;
    restaurantName: string;
    etaMinutes: number;
    lines: ({
      id: string;
      name: string;
      price: number;
      qty: number;
    } & import("@/lib/menu").Selection)[];
    breakdown: Record<string, number>;
  } | null>(null);
  const requestKey = useRef("");
  const cartSignature = JSON.stringify(
    items.map((i) => ({
      id: i.id,
      qty: i.qty,
      variantId: i.variantId,
      addonIds: i.addonIds,
      instructions: i.instructions,
    })),
  );
  const reviewed = quote?.cart === cartSignature ? quote : null;
  const { subtotal, delivery, total } = reviewed
    ? reviewed.breakdown
    : priceOrder(items, rates);

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    const fd = new FormData(event.currentTarget);
    try {
      const payload = {
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        address: fd.get("address"),
        city: fd.get("city"),
        state: fd.get("state"),
        pincode: fd.get("pincode"),
        landmark: fd.get("landmark"),
        instructions: fd.get("instructions"),
        coupon: fd.get("coupon"),
        tip: Number(fd.get("tip") || 0),
        payment,
        items: items.map((it) => ({
          id: it.id,
          qty: it.qty,
          variantId: it.variantId,
          addonIds: it.addonIds,
          instructions: it.instructions,
        })),
      };
      if (!reviewed) {
        const fresh = await requestApi("/api/orders/quote", payload);
        setQuote({ ...fresh, cart: cartSignature });
        requestKey.current = crypto.randomUUID();
        return;
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          fingerprint: reviewed.fingerprint,
          requestKey: requestKey.current,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        total?: number;
        trackUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.id) {
        if (response.status === 409) setQuote(null);
        throw new Error(
          data.error || "We could not place your order. Please try again.",
        );
      }
      // Confirm only once the order is actually saved.
      setPlaced({
        id: data.id,
        total: data.total ?? total,
        trackUrl: data.trackUrl,
      });
      clear();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We could not place your order. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rating/10 text-3xl text-rating">
          ✓
        </div>
        <h2 className="font-serif text-2xl text-gray-900">Order placed!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Thank you for shopping with Odia Kitchen. Your order total is{" "}
          <span className="font-semibold text-brand">
            ₹{placed.total.toFixed(2)}
          </span>
          . We&apos;ll call you on the number you gave us to confirm delivery.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Order number{" "}
          <span className="font-mono font-semibold text-gray-900">
            {placed.id}
          </span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={placed.trackUrl ?? "/account"}
            className="inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
          >
            TRACK ORDER / COMPLETE PAYMENT
          </Link>
          <Link
            href="/"
            className="inline-block border border-brand px-6 py-3 text-xs font-semibold tracking-widest text-brand transition hover:bg-cream"
          >
            BACK TO HOME
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
        <h2 className="font-serif text-xl text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-sm text-gray-500">
          Add something to your cart before checking out.
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
    <form
      onSubmit={placeOrder}
      onChange={() => setQuote(null)}
      className="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      {/* Form fields */}
      <div className="space-y-6 lg:col-span-2">
        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-serif text-lg text-gray-900">
            Contact details
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="name"
              placeholder="Rosy Sahoo"
              defaultValue={prefill?.name}
              required
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              placeholder="6370649364"
              defaultValue={prefill?.phone}
              required
            />
            <div className="sm:col-span-2">
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={prefill?.email}
                required
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-serif text-lg text-gray-900">
            Delivery address
          </legend>
          <p className="mb-4 text-xs text-gray-500">
            We currently deliver within India only.
          </p>
          {addresses.length ? (
            <label className="mb-4 block text-sm text-gray-600">
              Use saved address
              <select
                className="mt-1 w-full rounded-md border border-black/10 bg-white p-3"
                defaultValue=""
                onChange={(e) => {
                  const chosen = addresses.find((a) => a.id === e.target.value);
                  if (!chosen) return;
                  const form = e.currentTarget.form;
                  if (!form) return;
                  for (const key of [
                    "name",
                    "phone",
                    "address",
                    "city",
                    "state",
                    "landmark",
                  ] as const) {
                    const field = form.elements.namedItem(
                      key,
                    ) as HTMLInputElement | null;
                    if (field) field.value = chosen[key];
                  }
                  setPincode(chosen.pincode);
                  setQuote(null);
                }}
              >
                <option value="">Choose an address</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} · {a.address}, {a.pincode}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Address"
                name="address"
                placeholder="House no, street, area"
                defaultValue={prefill?.address}
                required
              />
            </div>
            <Field
              label="City"
              name="city"
              placeholder="Bhubaneswar"
              defaultValue={prefill?.city}
              required
            />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                State <span className="text-brand">*</span>
              </span>
              <select
                name="state"
                required
                defaultValue={prefill?.state ?? "Odisha"}
                className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Pincode <span className="text-brand">*</span>
              </span>
              <input
                name="pincode"
                inputMode="numeric"
                placeholder="751001"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              {pincodeComplete && hasServiceArea ? (
                <span
                  className={`mt-1 block text-xs font-medium ${serviceable ? "text-rating" : "text-red-600"}`}
                >
                  {serviceable
                    ? "✓ We deliver here."
                    : "Sorry, we don't deliver to this pincode yet."}
                </span>
              ) : null}
            </label>
            <Field
              label="Landmark (optional)"
              name="landmark"
              placeholder="Near temple"
            />
            <Field
              label="Delivery instructions (optional)"
              name="instructions"
              placeholder="Call when you arrive"
            />
          </div>
        </fieldset>

        <fieldset className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <legend className="px-2 font-serif text-lg text-gray-900">
            Payment method
          </legend>
          <div className="space-y-3">
            {[...PAYMENT_METHODS, ...(onlinePayment ? ["Online"] : [])].map(
              (method) => (
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
              ),
            )}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {payment === "Online"
              ? "Place the order, then complete secure payment on the order tracking page. Preparation begins after payment is confirmed."
              : "Pay in cash when your order arrives."}
          </p>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="font-serif text-lg text-gray-900">Order Summary</h2>

        {reviewed ? (
          <p
            role="status"
            className="mt-3 rounded-lg bg-cream-soft p-3 text-sm text-brand"
          >
            Review confirmed prices below. {reviewed.restaurantName} · Estimated
            delivery in {reviewed.etaMinutes} minutes.
          </p>
        ) : (
          <p className="mt-3 text-xs text-gray-500">
            Review your order to confirm current prices, availability, fees and
            delivery time.
          </p>
        )}
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={cartKey(item)} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-cream-soft">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-cream">
                  {item.qty}
                </span>
              </div>
              <span className="flex-1 text-sm text-gray-700">
                {reviewed?.lines.find((l) => cartKey(l) === cartKey(item))
                  ?.name ?? item.name}
              </span>
              <span className="text-sm font-medium text-gray-900">
                ₹
                {(
                  (reviewed?.lines.find((l) => cartKey(l) === cartKey(item))
                    ?.price ?? item.price) * item.qty
                ).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-3 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Subtotal</dt>
            <dd className="font-medium text-gray-900">
              ₹{subtotal.toFixed(2)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Delivery</dt>
            <dd className="font-medium text-gray-900">
              {delivery === 0 ? "Free" : `₹${delivery.toFixed(2)}`}
            </dd>
          </div>
          {reviewed
            ? ["packaging", "platform", "tax", "discount", "tip"].map((key) => (
                <div key={key} className="flex justify-between">
                  <dt className="capitalize text-gray-500">{key}</dt>
                  <dd>
                    {key === "discount" ? "−" : ""}₹
                    {reviewed.breakdown[key] ?? 0}
                  </dd>
                </div>
              ))
            : null}
          <div className="flex justify-between border-t border-black/10 pt-3 text-base">
            <dt className="font-semibold text-gray-900">Total</dt>
            <dd className="font-bold text-brand">₹{total.toFixed(2)}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3">
          <Field
            label="Coupon code (optional)"
            name="coupon"
            placeholder="Offer code"
          />
          <Field
            label="Tip (₹, optional)"
            name="tip"
            type="number"
            defaultValue="0"
          />
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" required className="mt-0.5" />
            <span>
              I confirm my delivery details and agree to the{" "}
              <Link href="/terms" className="text-brand underline">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/returns" className="text-brand underline">
                cancellation policy
              </Link>
              .
            </span>
          </label>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving || (isHouseOrder && pincodeComplete && !serviceable)}
          className="mt-6 w-full bg-brand py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "PLEASE WAIT..."
            : reviewed
              ? "CONFIRM & PLACE ORDER"
              : "REVIEW ORDER"}
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
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}
