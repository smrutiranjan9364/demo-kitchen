"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

type Slide = {
  title: string;
  text: string;
  cta: string;
  href: string;
  image: string;
};

const SLIDES: Slide[] = [
  {
    title: "Authentic Odisha Flavours",
    text: "Cultural Odisha cuisine, lovingly prepared and delivered from Rosy's Kitchen.",
    cta: "SHOP NOW",
    href: "/shop",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Festive Sweets & Khaja",
    text: "Traditional recipes made with heritage care, packed fresh for your celebrations.",
    cta: "EXPLORE SWEETS",
    href: "/category/sweets",
    image:
      "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Spices That Tell a Story",
    text: "Handpicked heritage spice blends to bring Odisha's kitchen to your home.",
    cta: "SHOP SPICES",
    href: "/category/spices",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[340px] w-full overflow-hidden bg-brand-dark sm:h-[460px]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            aria-hidden={i !== index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            {/* Dark gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />

            {/* Content — constrained to page width, aligned with the rest of the site */}
            <div className="relative mx-auto flex h-full max-w-7xl items-center px-6 sm:px-12">
              <div className="flex max-w-md flex-col justify-center">
                <h1 className="font-serif text-3xl leading-tight text-cream sm:text-5xl">
                  {slide.title}
                </h1>
                <p className="mt-3 max-w-sm text-sm text-cream/85 sm:text-base">
                  {slide.text}
                </p>
                <Link
                  href={slide.href}
                  className="mt-6 w-fit bg-brand px-5 py-2.5 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-6 top-1/2 -translate-y-1/2 rounded bg-cream/85 px-3 py-4 text-lg text-brand shadow transition hover:bg-cream sm:left-9"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-6 top-1/2 -translate-y-1/2 rounded bg-cream/85 px-3 py-4 text-lg text-brand shadow transition hover:bg-cream sm:right-9"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 w-2 rounded-full transition ${
              i === index ? "w-5 bg-cream" : "bg-cream/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
