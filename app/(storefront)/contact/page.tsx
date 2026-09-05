import { routeMetadata, seoPage } from "@/lib/seo";
import { PageJsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT } from "@/data/site";

// Server-rendered on every request so it can reflect live data / settings.
export const dynamic = "force-dynamic";

export const metadata = routeMetadata("/contact");

const DETAILS = [
  { icon: "✉️", label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: "📞", label: "Phone", value: CONTACT.phone, href: `tel:${CONTACT.phone}` },
  { icon: "📍", label: "Address", value: "Bhubaneswar, Odisha, India" },
  { icon: "🕐", label: "Hours", value: "Mon–Sat, 9:00 AM – 7:00 PM" },
];

export default function ContactPage() {
  return (
    <div className="bg-cream-soft">
      <PageJsonLd page={seoPage("/contact")} />
      {/* Hero */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Contact</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl">Get in touch</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/80">
            Have a question about an order, a product, or a collaboration? We&apos;d
            love to hear from you.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
        {/* Details */}
        <aside className="space-y-4">
          {DETAILS.map((d) => (
            <div
              key={d.label}
              className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cream-soft text-xl">
                {d.icon}
              </span>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  {d.label}
                </p>
                {d.href ? (
                  <a href={d.href} className="text-sm font-medium text-brand hover:text-brand-light">
                    {d.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-800">{d.value}</p>
                )}
              </div>
            </div>
          ))}
        </aside>

        {/* Form */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
