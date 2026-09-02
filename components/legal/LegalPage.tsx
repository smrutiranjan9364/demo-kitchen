import Link from "next/link";

export type LegalSection = { heading: string; body: string[] };

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="bg-cream-soft">
      {/* Header */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <nav className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">{title}</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-2 text-xs text-cream/70">Last updated: {updated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
          {intro ? (
            <p className="mb-8 text-sm leading-relaxed text-gray-600">{intro}</p>
          ) : null}

          <div className="space-y-8">
            {sections.map((section, i) => (
              <section key={section.heading}>
                <h2 className="font-serif text-lg text-gray-900">
                  {i + 1}. {section.heading}
                </h2>
                <div className="mt-2 space-y-3">
                  {section.body.map((para, j) => (
                    <p key={j} className="text-sm leading-relaxed text-gray-600">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 border-t border-black/5 pt-6 text-sm text-gray-500">
            Questions? Reach us via the{" "}
            <Link href="/contact" className="font-medium text-brand hover:text-brand-light">
              contact page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
