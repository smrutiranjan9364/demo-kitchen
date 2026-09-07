import Link from "next/link";
import Image from "next/image";
import { routeMetadata } from "@/lib/seo";
import { getCurrentCustomer } from "@/lib/customer";
import { getOrder, getProduct } from "@/lib/store";
import { verifyOrderTrackingToken } from "@/lib/auth";
import { isSoldOut, type Product } from "@/data/products";
import OrderStatusTimeline from "@/components/account/OrderStatusTimeline";
import OrderLookupForm from "@/components/account/OrderLookupForm";
import BuyAgainButton from "@/components/account/BuyAgainButton";

export const dynamic = "force-dynamic";
export const metadata = routeMetadata("/account");

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ id }, { t }, customer] = await Promise.all([params, searchParams, getCurrentCustomer()]);
  const order = await getOrder(id);

  // Owner (signed in) or holder of the signed tracking link. Anyone else sees
  // the lookup form — the same screen whether the id is wrong or unauthorised.
  const allowed =
    !!order &&
    ((customer != null && order.customerId === customer.id) || verifyOrderTrackingToken(id, t));

  if (!order || !allowed) {
    return (
      <div className="bg-cream-soft">
        <div className="bg-brand text-cream">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h1 className="font-serif text-3xl sm:text-4xl">Track your order</h1>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-600">
              We couldn&apos;t match that order number and phone number. Check both against your
              confirmation and try again.
            </p>
            <div className="mt-6">
              <OrderLookupForm orderId={id} />
            </div>
            <p className="mt-6 text-xs text-gray-400">
              Have an account?{" "}
              <Link href="/account" className="font-medium text-brand hover:underline">Log in</Link>{" "}
              to see all your orders without a phone number.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Current product records for "Buy again" — live prices, skip gone / sold out.
  const products = await Promise.all(order.items.map((it) => getProduct(it.id)));
  const buyAgain = order.items.flatMap((it, i) => {
    const product: Product | undefined = products[i];
    return product && !isSoldOut(product) ? [{ product, qty: it.qty }] : [];
  });

  return (
    <div className="bg-cream-soft">
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/account" className="hover:text-white">Account</Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Order</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">Order {order.id}</h1>
          <p className="mt-2 text-sm text-cream/80">Placed {fmtDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <OrderStatusTimeline status={order.status} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:col-span-2">
            <h2 className="font-serif text-lg text-gray-900">Items</h2>
            <ul className="mt-4 divide-y divide-black/5">
              {order.items.map((it, i) => (
                <li key={it.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-cream-soft">
                    {products[i]?.image ? (
                      <Image src={products[i]!.image!} alt={it.name} fill sizes="56px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <Link href={`/product/${encodeURIComponent(it.id)}`} className="text-sm font-medium text-gray-900 hover:text-brand">
                      {it.name}
                    </Link>
                    <p className="text-xs text-gray-500">₹{it.price.toFixed(0)} × {it.qty}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">₹{(it.price * it.qty).toFixed(0)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>₹{order.subtotal.toFixed(0)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Delivery</dt><dd>{order.delivery === 0 ? "Free" : `₹${order.delivery.toFixed(0)}`}</dd></div>
              <div className="flex justify-between border-t border-black/10 pt-2 text-base"><dt className="font-semibold text-gray-900">Total</dt><dd className="font-bold text-brand">₹{order.total.toFixed(0)}</dd></div>
            </dl>
            <div className="mt-6">
              <BuyAgainButton lines={buyAgain} />
            </div>
          </section>

          <aside className="h-fit rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="font-serif text-lg text-gray-900">Delivery</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-gray-700">
              {order.name}<br />
              {order.address}<br />
              {order.city}, {order.state} {order.pincode}<br />
              {order.phone}
            </address>
            <p className="mt-4 text-xs text-gray-500">Payment: {order.payment}</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
