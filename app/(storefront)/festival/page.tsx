import { createMetadata, isSearchVariant, seoPage } from "@/lib/seo";
import { PageJsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { getFestivalFoods } from "@/lib/store";
import FestivalTabs from "@/components/festival/FestivalTabs";

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return createMetadata({ ...seoPage("/festival"), noindex: isSearchVariant(await searchParams) });
}

export const dynamic = "force-dynamic";

export default async function FestivalPage() {
  const festivalFoods = await getFestivalFoods();
  return (
    <div className="bg-cream-soft">
      <PageJsonLd page={seoPage("/festival")} />
      {/* Hero */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Festival</span>
          </nav>
          <span className="inline-block rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold tracking-widest">
            SEASONAL & FESTIVE
          </span>
          <h1 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
            The Festival Menu
          </h1>
          <p className="mt-4 max-w-xl text-sm text-cream/85 sm:text-base">
            Every festival in Odisha carries its own flavour. We prepare each delicacy
            fresh, by hand, and pack it with care so celebrations taste like home.
          </p>
        </div>
      </div>

      {/* Festival specials (filterable by festival) */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <FestivalTabs foods={festivalFoods} />
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-serif text-2xl text-gray-900">Planning a celebration?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
            Order festive hampers and bulk boxes for your family gatherings and events.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/category/sweets"
              className="inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
            >
              SHOP FESTIVE SWEETS
            </Link>
            <Link
              href="/shop"
              className="inline-block border border-brand px-6 py-3 text-xs font-semibold tracking-widest text-brand transition hover:bg-cream-soft"
            >
              BROWSE ALL PRODUCTS
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
