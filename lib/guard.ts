// Server-only permission guards. Combines the session (lib/auth) with the
// user's stored rights (lib/store).
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserPermissions } from "@/lib/store";
import type { Right } from "@/lib/permissions";

// True if the current session may use `right`.
export async function hasRight(right: Right): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "super") return true;
  return (await getUserPermissions(session.username)).includes(right);
}

// For server pages: redirect away if the current user lacks `right`.
export async function requireRight(right: Right): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/backend");
  if (session.role === "super") return;
  const perms = await getUserPermissions(session.username);
  if (!perms.includes(right)) redirect("/backend/dashboard");
}
