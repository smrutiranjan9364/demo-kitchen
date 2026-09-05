import { routeMetadata } from "@/lib/seo";
import Link from "next/link";
import CartClient from "@/components/cart/CartClient";
import { BEST_SELLERS } from "@/data/products";

// Server-rendered on every request so it can reflect live data / settings.
export const dynamic = "force-dynamic";

export const metadata = routeMetadata("/cart");

// Sample items to demo the cart (replace with real cart state / store).
const initialItems = [
  { ...BEST_SELLERS[0], qty: 2 },
  { ...BEST_SELLERS[2], qty: 1 },
  { ...BEST_SELLERS[3], qty: 1 },
];

export default function CartPage() {
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
            <span className="text-cream">Cart</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">Your Cart</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <CartClient initialItems={initialItems} />
      </div>
    </div>
  );
}
