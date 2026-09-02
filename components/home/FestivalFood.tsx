import Link from "next/link";
import Image from "next/image";
import { FESTIVAL_FOODS } from "@/data/products";

export default function FestivalFood() {
  return (
    <section className="bg-cream-soft">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {/* Heading */}
        <div className="mb-8 text-center">
          <span className="text-xs font-semibold tracking-widest text-brand-light uppercase">
            Seasonal & Festive
          </span>
          <h2 className="mt-2 font-serif text-3xl text-gray-900">Festival Specials</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
            Handmade delicacies prepared for Odisha&apos;s most cherished festivals —
            crafted fresh, packed with tradition.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FESTIVAL_FOODS.map((item) => (
            <Link
              key={item.id}
              href={`/festival/${item.id}`}
              className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold tracking-wide text-cream shadow">
                  {item.festival}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-1 items-center justify-between gap-2 p-4">
                <div>
                  <h3 className="font-serif text-lg leading-tight text-gray-900">
                    {item.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">Festival special</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-brand transition group-hover:bg-brand group-hover:text-cream">
                  <ArrowIcon className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/festival"
            className="inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
          >
            EXPLORE FESTIVAL MENU
          </Link>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
