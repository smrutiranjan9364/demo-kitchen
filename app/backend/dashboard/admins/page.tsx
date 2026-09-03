import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { getUsers } from "@/lib/store";
import AdminsAdmin from "@/components/admin/AdminsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  if (!(await isSuperAdmin())) redirect("/backend/dashboard");

  const users = (await getUsers()).map((u) => ({
    username: u.username,
    role: u.role,
    permissions: u.permissions,
    createdAt: u.createdAt,
  }));
  const superUsername = process.env.ADMIN_USERNAME || "admin";

  return <AdminsAdmin initialUsers={users} superUsername={superUsername} />;
}
