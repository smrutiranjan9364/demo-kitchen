"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { AdminUIProvider } from "./AdminUI";
import type { Role } from "@/lib/auth";
import type { Right } from "@/lib/permissions";

type CountKey = "categories" | "districts" | "products" | "festival" | "orders" | "reviews" | "investments";
type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  super?: boolean;
  countKey?: CountKey;
  right?: Right;
};
type NavSection = { label?: string; items: NavItem[] };

const SIDEBAR_STORAGE_KEY = "admin_sidebar_collapsed";
const SIDEBAR_CHANGE_EVENT = "admin-sidebar-change";
let fallbackCollapsed: boolean | null = null;

function getSidebarPreference() {
  if (fallbackCollapsed !== null) return fallbackCollapsed;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeToSidebarPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  };
}

const getServerSidebarPreference = () => false;

const SECTIONS: NavSection[] = [
  {
    items: [{ label: "Overview", href: "/backend/dashboard", icon: "grid" }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Categories", href: "/backend/dashboard/categories", icon: "tag", countKey: "categories", right: "categories" },
      { label: "Districts", href: "/backend/dashboard/districts", icon: "map", countKey: "districts", right: "districts" },
      { label: "Products", href: "/backend/dashboard/products", icon: "box", countKey: "products", right: "products" },
      { label: "Festival", href: "/backend/dashboard/festival", icon: "confetti", countKey: "festival", right: "festival" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Orders", href: "/backend/dashboard/orders", icon: "cart", countKey: "orders", right: "orders" },
      { label: "Reviews", href: "/backend/dashboard/reviews", icon: "star", countKey: "reviews", right: "reviews" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Investments", href: "/backend/dashboard/investments", icon: "wallet", countKey: "investments", right: "investments" },
    ],
  },
  {
    label: "Access",
    items: [
      { label: "Users", href: "/backend/dashboard/admins", icon: "users", super: true },
      { label: "Roles", href: "/backend/dashboard/roles", icon: "shield", super: true },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/backend/dashboard/profile", icon: "user" },
      { label: "Settings", href: "/backend/dashboard/settings", icon: "gear", right: "settings" },
    ],
  },
];

export default function AdminShell({
  user,
  role,
  counts,
  rights = [],
  children,
}: {
  user: string;
  role: Role;
  counts?: Partial<Record<CountKey, number>>;
  rights?: Right[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const collapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    getServerSidebarPreference,
  );
  function toggleCollapsed() {
    const next = !collapsed;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      fallbackCollapsed = null;
    } catch {
      fallbackCollapsed = next;
    }
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/backend");
    router.refresh();
  }

  // Only sections/items the current role and rights allow.
  const canSee = (i: NavItem) => {
    if (i.super) return role === "super";
    if (i.right) return role === "super" || rights.includes(i.right);
    return true;
  };
  const visibleSections = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter(canSee),
  })).filter((s) => s.items.length > 0);

  const flatItems = visibleSections.flatMap((s) => s.items);

  const isActive = (href: string) =>
    href === "/backend/dashboard" ? pathname === href : pathname.startsWith(href);

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const count = item.countKey ? counts?.[item.countKey] : undefined;
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition ${
          collapsed ? "justify-center px-0" : "gap-3 px-3"
        } ${active ? "bg-white/15 text-white" : "text-cream/70 hover:bg-white/10 hover:text-white"}`}
      >
        <span
          className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#f06aa8] transition-opacity ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />
        <span className="relative shrink-0">
          <Icon name={item.icon} className="h-[18px] w-[18px]" />
          {/* count dot when collapsed */}
          {collapsed && count != null && count > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-[#f06aa8] ring-2 ring-brand" />
          ) : null}
        </span>
        {!collapsed ? <span className="flex-1">{item.label}</span> : null}
        {!collapsed && count != null ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              active ? "bg-white/20 text-white" : "bg-white/10 text-cream/70"
            }`}
          >
            {count}
          </span>
        ) : null}
      </Link>
    );
  };

  const roleLabel = role === "super" ? "Super Admin" : "Admin";

  return (
    <div className="flex min-h-screen bg-cream-soft">
      {/* Sidebar (fixed, collapsible) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-gradient-to-b from-brand to-brand-dark text-cream transition-[width] duration-300 ease-in-out sm:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {/* Collapse toggle (sits on the sidebar's right edge) */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-7 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-brand shadow-md transition hover:text-brand-light"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>

        <div className={`flex items-center py-5 ${collapsed ? "justify-center px-0" : "px-6"}`}>
          {collapsed ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 font-serif text-lg italic text-[#f06aa8]">
              O
            </span>
          ) : (
            <BrandLogo
              src="/logo-1.png"
              width={260}
              height={87}
              priority
              imgClassName="h-16 w-auto"
              fallback={
                <p className="font-serif text-lg italic leading-tight text-cream">
                  <span className="text-[#f06aa8]">Odia</span> Kitchen
                </p>
              }
            />
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
          {visibleSections.map((section, i) => (
            <div key={section.label ?? i} className={i === 0 ? "" : "mt-5"}>
              {section.label && !collapsed ? (
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cream/40">
                  {section.label}
                </p>
              ) : null}
              {section.label && collapsed ? <div className="mx-3 mb-2 border-t border-white/10" /> : null}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center rounded-lg py-2 ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
              {user.charAt(0).toUpperCase()}
            </span>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user}</p>
                <p className="text-[11px] text-cream/50">{roleLabel}</p>
              </div>
            ) : null}
          </div>
          <Link
            href="/"
            title={collapsed ? "View store" : undefined}
            className={`mt-1 flex items-center rounded-lg py-2 text-sm text-cream/60 transition hover:bg-white/10 hover:text-white ${
              collapsed ? "justify-center px-0" : "gap-3 px-3"
            }`}
          >
            <Icon name="external" className="h-[18px] w-[18px] shrink-0" />
            {!collapsed ? "View store" : null}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-in-out ${
          collapsed ? "sm:pl-[76px]" : "sm:pl-64"
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto sm:hidden">
            {flatItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
            Signed in as <span className="font-semibold text-gray-800">{user}</span>
            <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-brand">
              {roleLabel}
            </span>
          </span>
          <button
            onClick={logout}
            className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand hover:text-brand"
          >
            Log out
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AdminUIProvider>{children}</AdminUIProvider>
        </main>
      </div>
    </div>
  );
}

/* --------------------------------- Icons --------------------------------- */

type IconName =
  | "grid"
  | "tag"
  | "map"
  | "box"
  | "confetti"
  | "cart"
  | "star"
  | "user"
  | "users"
  | "shield"
  | "gear"
  | "wallet"
  | "external";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const p = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "tag":
      return (
        <svg {...p}>
          <path d="M20.6 13.4 12 22l-8-8 8.6-8.6a2 2 0 0 1 1.4-.6H20a2 2 0 0 1 2 2v6a2 2 0 0 1-.6 1.4Z" />
          <circle cx="16.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "map":
      return (
        <svg {...p}>
          <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      );
    case "box":
      return (
        <svg {...p}>
          <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
          <path d="m3 8 9 5 9-5M12 13v8" />
        </svg>
      );
    case "confetti":
      return (
        <svg {...p}>
          <path d="M4 20 9 8l7 7-12 5Z" />
          <path d="M14 5.5 15 4M18 8l1.5-1M17 12h2M12.5 3.5 13 2" />
        </svg>
      );
    case "cart":
      return (
        <svg {...p}>
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.8a2 2 0 0 0 2-1.6L22 7H5" />
        </svg>
      );
    case "star":
      return (
        <svg {...p}>
          <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9Z" />
        </svg>
      );
    case "user":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    case "users":
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2 21c0-3.5 3.2-5.5 7-5.5s7 2 7 5.5" />
          <path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21c0-3-1.8-4.8-4.5-5.3" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "gear":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...p}>
          <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2Z" />
          <path d="M3 8h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "external":
      return (
        <svg {...p}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6M10 14 21 3" />
        </svg>
      );
  }
}
