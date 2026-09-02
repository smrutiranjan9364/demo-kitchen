"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { REVIEWS } from "@/data/site";

export default function Testimonial() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % REVIEWS.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + REVIEWS.length) % REVIEWS.length),
    [],
  );

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="relative h-[360px] overflow-hidden rounded-lg bg-brand-dark sm:h-[340px]">
        {REVIEWS.map((review, i) => (
          <div
            key={review.name}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* Background image */}
            <Image
              src={review.background}
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[#3a1e12]/75" />

            {/* Content */}
            <div className="relative flex h-full flex-col items-center justify-center px-10 text-center text-cream">
              <div className="mb-4 flex justify-center gap-1 text-lg text-amber-300">
                {Array.from({ length: review.rating }).map((_, s) => (
                  <span key={s}>★</span>
                ))}
              </div>
              <blockquote className="mx-auto max-w-2xl font-serif text-xl italic leading-relaxed sm:text-2xl">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex flex-col items-center gap-2">
                <span className="relative h-12 w-12 overflow-hidden rounded-xl ring-2 ring-cream/80">
                  <Image src={review.avatar} alt={review.name} fill sizes="48px" className="object-cover" />
                </span>
                <span className="text-[11px] font-semibold tracking-widest text-cream/80 uppercase">
                  {review.name}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          onClick={prev}
          aria-label="Previous review"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded bg-cream/85 px-3 py-4 text-lg text-brand shadow transition hover:bg-cream"
        >
          ‹
        </button>
        <button
          onClick={next}
          aria-label="Next review"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded bg-cream/85 px-3 py-4 text-lg text-brand shadow transition hover:bg-cream"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to review ${i + 1}`}
              className={`h-2 rounded-full transition ${
                i === index ? "w-5 bg-cream" : "w-2 bg-cream/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
