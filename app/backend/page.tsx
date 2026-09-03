import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Only redirect when the session token actually verifies. An invalid/stale
  // cookie falls through to the login form (no redirect loop).
  const session = await getSession();
  if (session) redirect("/backend/dashboard");
  return <LoginForm />;
}
