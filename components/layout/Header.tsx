import Link from "next/link";
import { NAV_CATEGORIES, CONTACT } from "@/data/site";
import CartLink from "./CartLink";
import MoreMenu from "./MoreMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-brand text-cream">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-serif text-xl italic tracking-wide whitespace-nowrap"
          >
            <span className="text-[#f06aa8]">Rosy&apos;s</span>{" "}
            <span className="text-cream">Kitchen</span>
          </Link>

          {/* Search */}
          <div className="mx-auto hidden w-full max-w-xl md:block">
            <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700">
              <SearchIcon className="h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search for snacks, sweets, spices and more..."
                className="w-full bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-5 text-sm">
            <a
              href={`tel:${CONTACT.phone}`}
              className="hidden items-center gap-1.5 hover:opacity-80 lg:flex"
            >
              <PhoneIcon className="h-4 w-4" />
              <span className="whitespace-nowrap">{CONTACT.phone}</span>
            </a>
            <Link href="/login" className="flex items-center gap-1.5 hover:opacity-80">
              <UserIcon className="h-4 w-4" />
              <span>Login</span>
            </Link>
            <CartLink />
          </div>
        </div>
      </div>

      {/* Category nav */}
      <nav className="border-b border-brand/10 bg-cream-soft">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2.5 text-xs font-semibold tracking-wide text-brand sm:px-6">
          {NAV_CATEGORIES.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-1.5 whitespace-nowrap hover:text-brand-light"
            >
              {item.icon === "grid" && <GridIcon className="h-3.5 w-3.5" />}
              {item.label}
            </Link>
          ))}
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
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
