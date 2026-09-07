import Link from "next/link";
import { routeMetadata } from "@/lib/seo";
import { getCurrentCustomer } from "@/lib/customer";
import { getOrdersForCustomer } from "@/lib/store";
import LoginButton from "@/components/auth/LoginButton";
import LogoutButton from "@/components/account/LogoutButton";
import OrderLookupForm from "@/components/account/OrderLookupForm";
import { StatusPill } from "@/components/account/OrderStatusTimeline";

export const dynamic = "force-dynamic";
export const metadata = routeMetadata("/account");

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  const orders = customer ? await getOrdersForCustomer(customer.id) : [];

  return (
    <div className="bg-cream-soft">
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Account</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">
            {customer ? `Hello, ${customer.name.split(" ")[0]}` : "Your account"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {customer ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <aside className="h-fit rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="font-serif text-lg text-gray-900">Your details</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div><dt className="text-xs text-gray-500">Name</dt><dd className="text-gray-900">{customer.name}</dd></div>
                <div><dt className="text-xs text-gray-500">Email</dt><dd className="text-gray-900">{customer.email}</dd></div>
                <div><dt className="text-xs text-gray-500">Phone</dt><dd className="text-gray-900">{customer.phone}</dd></div>
              </dl>
              <div className="mt-6 border-t border-black/5 pt-4">
                <LogoutButton />
              </div>
            </aside>

            <section className="lg:col-span-2">
              <h2 className="font-serif text-lg text-gray-900">Your orders</h2>
              {orders.length === 0 ? (
                <div className="mt-4 rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
                  <p className="text-sm text-gray-500">No orders yet.</p>
                  <Link
                    href="/shop"
                    className="mt-4 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
                  >
                    START SHOPPING
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/account/orders/${encodeURIComponent(o.id)}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
                      >
                        <div>
                          <p className="font-mono text-sm font-semibold text-gray-900">{o.id}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {fmtDate(o.createdAt)} · {o.items.reduce((s, it) => s + it.qty, 0)} items
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusPill status={o.status} />
                          <span className="font-bold text-brand">₹{o.total.toFixed(0)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <h2 className="font-serif text-xl text-gray-900">Log in or create an account</h2>
              <p className="mt-2 text-sm text-gray-500">
                See every order in one place, reorder favourites, and skip the address form at checkout.
              </p>
              <LoginButton
                label="LOG IN / CREATE ACCOUNT"
                className="mt-6 inline-flex items-center gap-2 bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
              />
            </div>
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <h2 className="font-serif text-xl text-gray-900">Track an order without an account</h2>
              <p className="mt-2 text-sm text-gray-500">
                Enter the order number from your confirmation and the phone number you gave us.
              </p>
              <div className="mt-6">
                <OrderLookupForm />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
