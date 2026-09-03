import Link from "next/link";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { getUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

const FEATURES: { label: string; super: boolean; admin: boolean }[] = [
  { label: "Dashboard overview", super: true, admin: true },
  { label: "Manage categories", super: true, admin: true },
  { label: "Manage products", super: true, admin: true },
  { label: "Manage festival menu", super: true, admin: true },
  { label: "View & manage orders", super: true, admin: true },
  { label: "View reviews", super: true, admin: true },
  { label: "Store settings", super: true, admin: true },
  { label: "Manage users (access)", super: true, admin: false },
  { label: "Manage roles", super: true, admin: false },
  { label: "Own profile", super: true, admin: true },
];

function Cell({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rating/10 text-rating">
      ✓
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-300">
      —
    </span>
  );
}

export default async function RolesPage() {
  if (!(await isSuperAdmin())) redirect("/backend/dashboard");

  const users = await getUsers();
  const superName = process.env.ADMIN_USERNAME || "admin";

  const roles = [
    {
      name: "Super Admin",
      count: 1,
      accent: "bg-brand/10 text-brand",
      desc: "Full access to everything, including store settings and managing other users.",
      who: superName,
    },
    {
      name: "Admin",
      count: users.length,
      accent: "bg-gray-100 text-gray-600",
      desc: "Can manage the catalog, orders and reviews. Cannot change settings or manage users.",
      who: users.length ? users.map((u) => u.username).join(", ") : "No admin users yet",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">Roles &amp; Access</h1>
          <p className="mt-1 text-sm text-gray-500">
            What each role can do, and who holds it.
          </p>
        </div>
        <Link
          href="/backend/dashboard/admins"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          Manage users →
        </Link>
      </div>

      {/* Role cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {roles.map((r) => (
          <div key={r.name} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${r.accent}`}>
                {r.name}
              </span>
              <span className="text-sm text-gray-400">
                {r.count} {r.count === 1 ? "user" : "users"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.desc}</p>
            <p className="mt-3 border-t border-black/5 pt-3 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Members:</span> {r.who}
            </p>
          </div>
        ))}
      </div>

      {/* Permissions matrix */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Permission</th>
              <th className="px-4 py-3 text-center">Super Admin</th>
              <th className="px-4 py-3 text-center">Admin</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.label} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 text-gray-700">{f.label}</td>
                <td className="px-4 py-3 text-center">
                  <Cell ok={f.super} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Cell ok={f.admin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        The environment account is the Super Admin (full access). Each Admin&apos;s rights
        are configurable per user — a ✓ above means that page <em>can</em> be granted. Set
        each admin&apos;s access on the{" "}
        <Link href="/backend/dashboard/admins" className="font-medium text-brand hover:underline">
          Users
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
