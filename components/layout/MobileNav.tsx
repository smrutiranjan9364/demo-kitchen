"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useState, useEffect } from "react";
import { NAV_CATEGORIES, MORE_MENU, CONTACT } from "@/data/site";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex items-center md:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className="absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-white text-gray-800 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-brand px-4 py-4 text-cream">
              <BrandLogo
                width={130}
                height={43}
                imgClassName="h-8 w-auto"
                fallback={
                  <span className="font-serif text-lg italic">
                    <span className="text-[#f06aa8]">Odia</span> Kitchen
                  </span>
                }
              />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-xl">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Categories */}
              <nav className="p-2">
                {NAV_CATEGORIES.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-4 py-3 text-sm font-semibold text-brand transition hover:bg-cream-soft"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mx-4 border-t border-black/10" />

              {/* More links */}
              <nav className="p-2">
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                  More
                </p>
                {MORE_MENU.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-4 py-2.5 text-sm text-gray-700 transition hover:bg-cream-soft hover:text-brand"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mx-4 border-t border-black/10" />

              {/* Contact */}
              <div className="p-4">
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="block text-sm font-medium text-brand"
                >
                  📞 {CONTACT.phone}
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="mt-2 block text-sm text-gray-600"
                >
                  ✉️ {CONTACT.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
