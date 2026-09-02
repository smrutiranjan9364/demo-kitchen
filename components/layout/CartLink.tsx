"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";

export default function CartLink() {
  const { count } = useCart();

  return (
    <Link href="/cart" className="relative flex items-center gap-1.5 hover:opacity-80">
      <span className="relative">
        <CartIcon className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-cream px-1 text-[10px] font-bold text-brand">
            {count}
          </span>
        ) : null}
      </span>
      <span className="hidden sm:inline">Cart</span>
    </Link>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.5 12h11l2-8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
