import { routeMetadata } from "@/lib/seo";
import Link from "next/link";
import CheckoutClient, { type CheckoutPrefill } from "@/components/checkout/CheckoutClient";
import { getOrdersForCustomer, getSettings } from "@/lib/store";
import { getCurrentCustomer } from "@/lib/customer";

// Server-rendered on every request so it can reflect live data / settings.
export const dynamic = "force-dynamic";

export const metadata = routeMetadata("/checkout");

export default async function CheckoutPage() {
  // Quote the same delivery rates the orders API will charge.
  const [{ deliveryFee, freeDeliveryOver, deliveryPincodes }, customer] = await Promise.all([
    getSettings(),
    getCurrentCustomer(),
  ]);

  // Signed in: prefill from the last order (full address) or the account.
  let prefill: CheckoutPrefill | undefined;
  if (customer) {
    const [last] = await getOrdersForCustomer(customer.id);
    prefill = last
      ? { name: last.name, phone: last.phone, email: last.email, address: last.address, city: last.city, state: last.state, pincode: last.pincode }
      : { name: customer.name, phone: customer.phone, email: customer.email };
  }

  return (
    <div className="bg-cream-soft">
      {/* Page header */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/cart" className="hover:text-white">
              Cart
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Checkout</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <CheckoutClient rates={{ deliveryFee, freeDeliveryOver }} prefill={prefill} deliveryPincodes={deliveryPincodes} />
      </div>
    </div>
  );
}
