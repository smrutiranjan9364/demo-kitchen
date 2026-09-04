import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

// Server-rendered on every request so it can reflect live data / settings.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us — Odia Kitchen",
  description:
    "The story behind Odia Kitchen — bringing authentic Odisha flavours to homes everywhere.",
};

const aboutImg = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const VALUES = [
  { icon: "🌾", title: "Authentic Recipes", text: "Family recipes passed down through generations, unchanged and honest." },
  { icon: "🤲", title: "Hand-made Care", text: "Every batch is prepared by hand, in small quantities, for freshness." },
  { icon: "🚚", title: "Fresh Delivery", text: "Carefully packed and delivered so it reaches you tasting like home." },
  { icon: "❤️", title: "Community First", text: "Supporting local makers, farmers and Odia culinary heritage." },
];

const STATS = [
  { value: "10k+", label: "Happy customers" },
  { value: "120+", label: "Traditional products" },
  { value: "15+", label: "Years of heritage" },
  { value: "4.8★", label: "Average rating" },
];

export default function AboutPage() {
  return (
    <div className="bg-cream-soft">
      {/* Hero */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <nav className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">About Us</span>
          </nav>
          <h1 className="max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
            Bringing Odisha&apos;s kitchen to your home
          </h1>
          <p className="mt-4 max-w-xl text-sm text-cream/85 sm:text-base">
            Odia Kitchen began with a simple belief — that the authentic
            flavours of Odisha deserve to be shared, one lovingly packed box at a time.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
            <Image
              src={aboutImg("1556909114-f6e7ad7d3136")}
              alt="Home-style cooking at Odia Kitchen"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-gray-900">Our story</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
              <p>
                What started in a small home kitchen — with Rosy preparing khaja and
                snacks for family and neighbours — quickly grew into something more.
                Word spread, orders came, and a heritage brand was born.
              </p>
              <p>
                Today, we work with local makers and farmers across Odisha to bring you
                snacks, sweets, spices and meals made the traditional way. No shortcuts,
                no artificial flavours — just honest, home-style food.
              </p>
              <p>
                Every product carries a little bit of Odisha&apos;s culture, and we&apos;re
                proud to deliver that taste of home to families near and far.
              </p>
            </div>
            <Link
              href="/shop"
              className="mt-6 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
            >
              EXPLORE OUR PRODUCTS
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-center font-serif text-2xl text-gray-900">What we stand for</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl bg-cream-soft p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-2xl shadow-sm">
                  {v.icon}
                </div>
                <h3 className="mt-4 font-serif text-lg text-gray-900">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-6 rounded-2xl bg-brand px-6 py-10 text-center text-cream sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-serif text-3xl sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs tracking-wide text-cream/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-serif text-2xl text-gray-900">Taste the tradition</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
            Join thousands who have brought Odisha&apos;s authentic flavours home.
          </p>
          <Link
            href="/categories"
            className="mt-6 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
          >
            SHOP ALL CATEGORIES
          </Link>
        </div>
      </section>
    </div>
  );
}
