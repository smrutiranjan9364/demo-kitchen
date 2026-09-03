import Link from "next/link";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  const user = session?.username ?? "admin";
  const roleLabel = session?.role === "super" ? "Super Admin" : "Admin";

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-gray-900">Profile</h1>
      <p className="mt-1 text-sm text-gray-500">Your admin account.</p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-cream">
            {user.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user}</p>
            <span className="mt-1 inline-block rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold text-brand">
              {roleLabel}
            </span>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-black/5 border-t border-black/5 text-sm">
          <div className="flex justify-between py-3">
            <dt className="text-gray-500">Username</dt>
            <dd className="font-medium text-gray-800">{user}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium text-gray-800">{roleLabel}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-gray-500">Session</dt>
            <dd className="font-medium text-gray-800">Signed in</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="font-semibold text-gray-900">Credentials</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your admin username and password are configured with the{" "}
          <code className="rounded bg-cream-soft px-1.5 py-0.5 text-brand">ADMIN_USERNAME</code> and{" "}
          <code className="rounded bg-cream-soft px-1.5 py-0.5 text-brand">ADMIN_PASSWORD</code>{" "}
          environment variables in <code className="rounded bg-cream-soft px-1.5 py-0.5 text-brand">.env.local</code>.
          Update them there and restart the server to change your login.
        </p>
        <Link
          href="/backend/dashboard/settings"
          className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
        >
          Go to store settings →
        </Link>
      </div>
    </div>
  );
}
