import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/store";

// One "reel" repeats the base list enough times to be wider than any screen.
// We render two identical reels, so translateX(-50%) loops seamlessly with
// no blank space, on any viewport width.
const REEL_REPEAT = 2;

export default async function CategoryCircles() {
  const categories = await getCategories();
  const reel = Array.from({ length: REEL_REPEAT }).flatMap(() => categories);
  const items = [...reel, ...reel]; // two identical halves

  return (
    <section className="bg-white py-6">
      <div className="marquee-group group relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />

        <div className="animate-marquee flex w-max py-5">
          {items.map((cat, i) => (
            <Link
              key={`${cat.label}-${i}`}
              href={cat.href}
              aria-hidden={i >= categories.length}
              tabIndex={i >= categories.length ? -1 : undefined}
              prefetch={i >= categories.length ? false : undefined}
              className="group/item flex shrink-0 flex-col items-center gap-3 px-6"
            >
              <span className="relative h-24 w-24 overflow-hidden rounded-2xl bg-cream-soft p-2 shadow-sm ring-1 ring-black/5 transition duration-300 group-hover/item:-translate-y-1 group-hover/item:shadow-lg group-hover/item:ring-2 group-hover/item:ring-brand">
                <span className="relative block h-full w-full overflow-hidden rounded-xl">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </span>
              </span>
              <span className="text-base font-semibold text-gray-700 transition group-hover/item:text-brand">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
