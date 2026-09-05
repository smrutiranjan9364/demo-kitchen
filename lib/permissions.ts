// Shared permission definitions — plain data, safe to import from both server
// and client code (no fs / next/headers here).

// Grantable rights — one per manageable sidebar page.
export const RIGHTS = [
  { key: "categories", label: "Categories" },
  { key: "districts", label: "Districts" },
  { key: "products", label: "Products" },
  { key: "festival", label: "Festival" },
  { key: "orders", label: "Orders" },
  { key: "reviews", label: "Reviews" },
  { key: "settings", label: "Settings" },
] as const;

export type Right = (typeof RIGHTS)[number]["key"];

// The remaining sidebar pages, shown in the access list for completeness but
// not individually grantable: Overview & Profile are always available; Users &
// Roles are Super-Admin only because they control access itself.
export const NON_GRANTABLE_PAGES = [
  { label: "Overview", note: "Always available" },
  { label: "Profile", note: "Always available" },
  { label: "Users", note: "Super Admin only" },
  { label: "Roles", note: "Super Admin only" },
] as const;

export const ALL_RIGHTS: Right[] = RIGHTS.map((r) => r.key);

// Super admins can do everything; admins are limited to their granted rights.
export function can(
  role: "super" | "admin",
  permissions: Right[] | undefined,
  right: Right,
): boolean {
  return role === "super" || (permissions?.includes(right) ?? false);
}
