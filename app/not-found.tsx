import Link from "next/link";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Page Not Found", description: "This page could not be found. Browse the Odia Kitchen shop to find food and categories.", path: "/", noindex: true, canonical: false });

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-cream-soft px-6 py-20 text-center">
      <h1 className="font-serif text-3xl text-gray-900">Page not found</h1>
      <p className="mt-3 text-sm text-gray-600">The page you are looking for does not exist.</p>
      <Link href="/shop" className="mt-6 bg-brand px-6 py-3 text-sm font-semibold text-cream">Browse the shop</Link>
    </div>
  );
}
