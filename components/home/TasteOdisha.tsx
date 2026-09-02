import Link from "next/link";

export default function TasteOdisha() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <h2 className="font-serif text-3xl text-gray-900">Taste Odisha</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
          Bring Odisha&apos;s authentic flavours home, from comforting classics to
          delicious dry foods prepared with traditional care.
        </p>
        <Link
          href="/categories"
          className="mt-6 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
        >
          SHOP ALL CATEGORIES
        </Link>
      </div>
    </section>
  );
}
