import Link from "next/link";
import { FOOTER_MENU, FOOTER_LEGAL, CONTACT } from "@/data/site";

export default function Footer() {
  return (
    <footer className="bg-brand text-cream">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-3">
        {/* Menu */}
        <div>
          <h3 className="mb-5 font-serif text-lg">Menu</h3>
          <ul className="space-y-2.5 text-xs tracking-wide text-cream/80">
            {FOOTER_MENU.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacts */}
        <div>
          <h3 className="mb-5 font-serif text-lg">Contacts</h3>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="underline hover:text-white">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={`tel:${CONTACT.phone}`} className="underline hover:text-white">
                {CONTACT.phone}
              </a>
            </li>
          </ul>

          <h3 className="mt-8 mb-4 font-serif text-lg">Socials</h3>
          <div className="flex gap-4 text-cream/80">
            <Social label="Facebook" href="#" path="M13 10h3l1-4h-4V4a1 1 0 0 1 1-1h3V-.5" />
            <Social label="Instagram" href="#" instagram />
            <Social label="TikTok" href="#" tiktok />
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="mb-5 font-serif text-lg">Subscribe to our newsletter</h3>
          <form className="space-y-3">
            <div>
              <label htmlFor="newsletter-email" className="mb-1 block text-xs text-cream/80">
                EMAIL <span className="text-cream">*</span>
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                className="w-full rounded-sm bg-white px-3 py-2.5 text-sm text-gray-800 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full border border-cream/60 py-2.5 text-xs font-semibold tracking-widest transition hover:bg-cream hover:text-brand"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream/15">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-cream/70">
          <p>© 2024 Rosy&apos;s Kitchen. All rights reserved. Crafted with heritage.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {FOOTER_LEGAL.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function Social({
  label,
  href,
  instagram,
  tiktok,
}: {
  label: string;
  href: string;
  path?: string;
  instagram?: boolean;
  tiktok?: boolean;
}) {
  return (
    <a href={href} aria-label={label} className="hover:text-white">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        {instagram ? (
          <path d="M12 2c2.7 0 3 0 4.1.1 1 0 1.7.2 2.3.5.6.2 1.1.5 1.6 1s.8 1 1 1.6c.3.6.4 1.3.5 2.3C21.6 8.6 21.6 9 21.6 12s0 3.4-.1 4.5c0 1-.2 1.7-.5 2.3-.2.6-.5 1.1-1 1.6s-1 .8-1.6 1c-.6.3-1.3.4-2.3.5-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.7-.2-2.3-.5-.6-.2-1.1-.5-1.6-1s-.8-1-1-1.6c-.3-.6-.4-1.3-.5-2.3C2.4 15.4 2.4 15 2.4 12s0-3.4.1-4.5c0-1 .2-1.7.5-2.3.2-.6.5-1.1 1-1.6s1-.8 1.6-1c.6-.3 1.3-.4 2.3-.5C9 2 9.3 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.4 6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
        ) : tiktok ? (
          <path d="M16 3c.3 2.1 1.5 3.6 3.5 3.8v2.4c-1.3.1-2.5-.3-3.5-1v6.1c0 3-2 5.2-5 5.2a4.9 4.9 0 0 1-5-4.9c0-2.9 2.3-5 5.2-4.8v2.5a2.4 2.4 0 0 0-2.7 2.4 2.4 2.4 0 0 0 4.8.1V3H16Z" />
        ) : (
          <path d="M14 9h2.5l.5-3H14V4.5c0-.8.3-1.5 1.5-1.5H17V.2C16.7.1 15.7 0 14.6 0 12.3 0 11 1.4 11 3.9V6H8.5v3H11v9h3V9Z" />
        )}
      </svg>
    </a>
  );
}
