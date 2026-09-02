import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CONTACT } from "@/data/site";

export const metadata: Metadata = {
  title: "Brand Collaborations — Rosy's Kitchen",
  description:
    "Partner with Rosy's Kitchen to bring authentic Odisha flavours to a wider audience.",
};

const BENEFITS = [
  {
    icon: "🤝",
    title: "Authentic Partnership",
    text: "Co-create heritage products rooted in genuine Odia culinary tradition.",
  },
  {
    icon: "📦",
    title: "Trusted Supply Chain",
    text: "Reliable sourcing, hygienic packing and dependable pan-India delivery.",
  },
  {
    icon: "📣",
    title: "Shared Reach",
    text: "Featured placement across our store, socials and festive campaigns.",
  },
  {
    icon: "⭐",
    title: "Loyal Community",
    text: "Access a growing base of customers who love home-style Odisha food.",
  },
];

const partnerImg = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=300&q=80`;

const PARTNERS = [
  { name: "Utkal Foods", image: partnerImg("1601050690597-df0568f70950") },
  { name: "Konark Organics", image: partnerImg("1447279506476-3faec8071eee") },
  { name: "Jagannath Sweets", image: partnerImg("1606491956689-2ea866880c84") },
  { name: "Odisha Spice Co.", image: partnerImg("1596040033229-a9821ebd058d") },
  { name: "Kalinga Grains", image: partnerImg("1610832958506-aa56368176cf") },
  { name: "Puri Delights", image: partnerImg("1517244683847-7456b63c5969") },
];

const STEPS = [
  { n: "01", title: "Reach out", text: "Send us your brand details and collaboration idea." },
  { n: "02", title: "Let's talk", text: "We align on products, quality standards and terms." },
  { n: "03", title: "Go live", text: "Your products launch and reach our community." },
];

export default function CollaborationsPage() {
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
            <span className="text-cream">Brand Collaborations</span>
          </nav>
          <h1 className="max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
            Let&apos;s bring Odisha&apos;s flavours to more homes—together.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-cream/85 sm:text-base">
            We partner with makers, farmers and brands who share our love for
            authentic, heritage food. If that&apos;s you, we&apos;d love to talk.
          </p>
          <a
            href="#apply"
            className="mt-8 inline-block bg-cream px-6 py-3 text-xs font-semibold tracking-widest text-brand transition hover:bg-white"
          >
            START A COLLABORATION
          </a>
        </div>
      </div>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-serif text-2xl text-gray-900">
          Why partner with us
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cream-soft text-2xl">
                {b.icon}
              </div>
              <h3 className="mt-4 font-serif text-lg text-gray-900">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-center font-serif text-2xl text-gray-900">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <span className="font-serif text-4xl text-brand-light">{s.n}</span>
                <h3 className="mt-2 font-serif text-lg text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-serif text-2xl text-gray-900">
          Brands we work with
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-cream">
                <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover" />
              </span>
              <span className="text-center text-sm font-semibold text-brand">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Apply CTA */}
      <section id="apply" className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-serif text-3xl text-gray-900">Ready to collaborate?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
            Tell us about your brand and what you&apos;d like to build together. Our
            partnerships team will get back within 2–3 working days.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={`mailto:${CONTACT.email}?subject=Brand Collaboration`}
              className="inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
            >
              EMAIL US
            </a>
            <a
              href={`tel:${CONTACT.phone}`}
              className="inline-block border border-brand px-6 py-3 text-xs font-semibold tracking-widest text-brand transition hover:bg-cream-soft"
            >
              CALL {CONTACT.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
