import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { NAV_CATEGORIES, CONTACT } from "@/data/site";
import { getDistrictNav } from "@/lib/store";
import CartLink from "./CartLink";
import MoreMenu from "./MoreMenu";
import DistrictsMenu from "./DistrictsMenu";
import MobileNav from "./MobileNav";
import LoginButton from "@/components/auth/LoginButton";

export default async function Header() {
  const districts = await getDistrictNav();
  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-brand text-cream">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          {/* Hamburger (mobile) */}
          <MobileNav districts={districts} />

          <Link href="/" className="shrink-0" aria-label="Odia Kitchen — home">
            <BrandLogo
              src="/logo-1.png"
              width={220}
              height={73}
              priority
              imgClassName="h-12 w-auto sm:h-16"
              fallback={
                <span className="font-serif text-lg italic tracking-wide whitespace-nowrap sm:text-xl">
                  <span className="text-[#f06aa8]">Odia</span>{" "}
                  <span className="text-cream">Kitchen</span>
                </span>
              }
            />
          </Link>

          {/* Search (desktop) */}
          <div className="mx-auto hidden w-full max-w-xl md:block">
            <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700">
              <SearchIcon className="h-4 w-4 text-gray-400" />
              <input
                type="search"
                aria-label="Search products"
                placeholder="Search for snacks, sweets, spices and more..."
                className="w-full bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3 text-sm sm:gap-5">
            {/* Social icons */}
            <div className="hidden items-center gap-3 lg:flex">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:opacity-80">
                <InstagramIcon className="h-6 w-6" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:opacity-80">
                <FacebookIcon className="h-6 w-6" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:opacity-80">
                <YoutubeIcon className="h-6 w-6" />
              </a>
              <span className="h-4 w-px bg-cream/30" />
            </div>

            <a
              href={`tel:${CONTACT.phone}`}
              className="hidden items-center gap-1.5 hover:opacity-80 xl:flex"
            >
              <PhoneIcon className="h-4 w-4" />
              <span className="whitespace-nowrap">{CONTACT.phone}</span>
            </a>

            {/* Login: label hides on very small screens, icon stays */}
            <LoginButton />
            <CartLink />
          </div>
        </div>

        {/* Search (mobile) */}
        <div className="px-4 pb-3 md:hidden">
          <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700">
            <SearchIcon className="h-4 w-4 text-gray-400" />
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search snacks, sweets, spices..."
              className="w-full bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Category nav (desktop) */}
      <nav aria-label="Main navigation" className="hidden border-b border-brand/10 bg-cream-soft md:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-1.5 px-4 py-2 sm:px-6">
          {NAV_CATEGORIES.map((item) => {
            const isPrimary = item.icon === "grid";
            return (
              <Link
                key={item.label}
                href={item.href}
                className={
                  isPrimary
                    ? "flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-4 py-2 text-[13px] font-semibold tracking-wide text-cream shadow-sm transition hover:bg-brand-dark"
                    : "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold tracking-wide text-brand/90 transition hover:bg-white hover:text-brand hover:shadow-sm"
                }
              >
                {isPrimary && <GridIcon className="h-3.5 w-3.5" />}
                {item.label}
              </Link>
            );
          })}
          <DistrictsMenu districts={districts} />
          <MoreMenu />
        </div>
      </nav>
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.35" stopColor="#fa7e1e" />
          <stop offset="0.6" stopColor="#d62976" />
          <stop offset="0.8" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#ig-grad)" />
      <rect x="6" y="6" width="12" height="12" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17" cy="7" r="1.1" fill="#fff" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#1877F2" />
      <path
        fill="#fff"
        d="M15.3 12.5l.4-2.6h-2.5V8.2c0-.7.4-1.4 1.5-1.4h1.1V4.5s-1-.2-2-.2c-2 0-3.3 1.2-3.3 3.5v2H8.2v2.6H10V19h2.7v-6.5h2.6Z"
      />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
      <path fill="#fff" d="M10 8.5v7l6-3.5-6-3.5Z" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
