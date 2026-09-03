"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { FestivalFood } from "@/data/products";

// Approximate month/day for each festival, used to detect the current/upcoming one.
const FESTIVAL_DATES: Record<string, { month: number; day: number }> = {
  "Makar Sankranti": { month: 1, day: 14 },
  "Raja Parba": { month: 6, day: 15 },
  "Kartik Purnima": { month: 11, day: 24 },
  Prathamastami: { month: 12, day: 1 },
};

const FESTIVAL_NOTES: Record<string, string> = {
  "chhena-poda": "A caramelised cheese dessert, slow-baked to a smoky, golden finish.",
  "arisa-pitha": "Sweet rice-flour cakes fried in ghee — a Sankranti favourite.",
  rasabali: "Soft fried chhena discs soaked in thickened, cardamom-spiced milk.",
  "enduri-pitha": "Rice-and-lentil cakes steamed in fragrant turmeric leaves — the Prathamastami classic.",
};

// Which festival is nearest upcoming from today (wraps to next year if passed).
function currentFestival(festivals: string[]): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let best = festivals[0];
  let bestDiff = Infinity;

  for (const f of festivals) {
    const d = FESTIVAL_DATES[f];
    if (!d) continue;
    let date = new Date(now.getFullYear(), d.month - 1, d.day);
    if (date < today) date = new Date(now.getFullYear() + 1, d.month - 1, d.day);
    const diff = date.getTime() - today.getTime();
    if (diff < bestDiff) {
      bestDiff = diff;
      best = f;
    }
  }
  return best;
}

export default function FestivalTabs({ foods }: { foods: FestivalFood[] }) {
  const festivals = useMemo(
    () => Array.from(new Set(foods.map((f) => f.festival))),
    [foods],
  );

  const [active, setActive] = useState(() => currentFestival(festivals));

  const visible = foods.filter((f) => f.festival === active);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {festivals.map((f) => {
          const isActive = f === active;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition ${
                isActive
                  ? "bg-brand text-cream shadow"
                  : "border border-black/10 bg-white text-gray-600 hover:border-brand/40 hover:text-brand"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Cards for the active festival */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {visible.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:flex-row"
          >
            <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, 176px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold text-cream shadow">
                {item.festival}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-light">
                <FestivalIcon className="h-3.5 w-3.5" />
                {item.festival}
              </span>
              <h2 className="mt-1 font-serif text-xl text-gray-900">{item.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                {FESTIVAL_NOTES[item.id] ??
                  "A cherished festive delicacy from Odisha's kitchens."}
              </p>
              <Link
                href="/category/sweets"
                className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand hover:text-brand-light"
              >
                Order for {item.festival} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FestivalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M5 8l14 0M4 8l4 12h8l4-12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
