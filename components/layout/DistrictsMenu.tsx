"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { DISTRICTS, type District } from "@/data/site";

export default function DistrictsMenu({
  districts = DISTRICTS,
}: {
  districts?: District[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold tracking-wide text-brand/90 transition hover:bg-white hover:text-brand hover:shadow-sm"
      >
        DISTRICTS
        <ChevronIcon className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 mt-2 max-h-[70vh] w-[min(38rem,90vw)] -translate-x-1/2 overflow-y-auto rounded-lg border border-black/10 bg-white p-2 shadow-lg">
          <p className="px-2 pb-1 pt-1 text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            All Districts of Odisha
          </p>
          <div className="grid grid-cols-2 gap-x-2 sm:grid-cols-3">
            {districts.map((district) => (
              <Link
                key={district.label}
                href={district.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-cream-soft hover:text-brand"
              >
                {district.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
