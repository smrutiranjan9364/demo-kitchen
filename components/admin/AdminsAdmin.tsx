"use client";

import { useState } from "react";
import SlideOver from "./SlideOver";
import { useAdminUI } from "./AdminUI";
import { RIGHTS, ALL_RIGHTS, NON_GRANTABLE_PAGES, type Right } from "@/lib/permissions";

type AdminRow = {
  username: string;
  role: string;
  permissions: Right[];
  createdAt: string;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminsAdmin({
  initialUsers,
  superUsername,
}: {
  initialUsers: AdminRow[];
  superUsername: string;
}) {
  const { toast, confirm } = useAdminUI();
  const [users, setUsers] = useState<AdminRow[]>(initialUsers);
  // null = closed, "new" = add, else the username being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState<Right[]>(ALL_RIGHTS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function togglePerm(r: Right) {
    setPerms((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));
  }

  function openAdd() {
    setUsername("");
    setPassword("");
    setPerms(ALL_RIGHTS);
    setError("");
    setEditing("new");
  }
  function openEdit(u: AdminRow) {
    setUsername(u.username);
    setPassword("");
    setPerms(u.permissions);
    setError("");
    setEditing(u.username);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (editing === "new" && (!username.trim() || password.length < 4)) {
      return setError("Username and a password (min 4 chars) are required.");
    }
    setBusy(true);
    setError("");
    try {
      if (editing === "new") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password, permissions: perms }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Could not create admin");
        }
        const created: AdminRow = await res.json();
        setUsers((prev) => [...prev, created]);
        toast("Admin added");
      } else if (editing) {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(editing)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: perms }),
        });
        if (!res.ok) throw new Error("Could not update access");
        const updated: AdminRow = await res.json();
        setUsers((prev) => prev.map((u) => (u.username === updated.username ? updated : u)));
        toast("Access updated");
      }
      setEditing(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(u: string) {
    const ok = await confirm({
      title: "Remove admin",
      message: `"${u}" will no longer be able to sign in.`,
      confirmText: "Remove",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(u)}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((x) => x.username !== u));
      toast("Admin removed");
    } else {
      toast("Could not remove admin", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">Users &amp; Access</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage who can sign in and what they can access.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          + Add admin
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Access rights</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Super admin (env) — full access, not editable */}
            <tr className="border-b border-black/5">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-cream">
                    {superUsername.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-gray-800">{superUsername}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                  Super Admin
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">Full access</td>
              <td className="px-4 py-3 text-right text-xs text-gray-400">Env account</td>
            </tr>

            {users.map((u) => (
              <tr key={u.username} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-sm font-bold text-brand">
                      {u.username.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{u.username}</p>
                      <p className="text-xs text-gray-400">Added {fmtDate(u.createdAt)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    Admin
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.permissions.length === 0 ? (
                    <span className="text-xs text-gray-400">No access</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.permissions.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-cream-soft px-2 py-0.5 text-[11px] font-medium capitalize text-brand"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-cream-soft"
                    >
                      Edit access
                    </button>
                    <button
                      onClick={() => remove(u.username)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add admin" : `Edit access — ${editing}`}
      >
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="grid flex-1 gap-4">
            {editing === "new" ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Username</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                    className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </label>
              </>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Access rights</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPerms(ALL_RIGHTS)}
                    className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold text-gray-600 transition hover:border-brand hover:bg-cream-soft hover:text-brand"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerms([])}
                    className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold text-gray-600 transition hover:border-brand hover:bg-cream-soft hover:text-brand"
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {/* Grantable pages */}
                {RIGHTS.map((r) => (
                  <label
                    key={r.key}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/10 px-3 py-2.5 text-sm transition hover:border-brand/40"
                  >
                    <input
                      type="checkbox"
                      checked={perms.includes(r.key)}
                      onChange={() => togglePerm(r.key)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="font-medium text-gray-800">{r.label}</span>
                  </label>
                ))}
                {/* Remaining sidebar pages (not individually grantable) */}
                {NON_GRANTABLE_PAGES.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center gap-3 rounded-lg border border-dashed border-black/10 bg-gray-50 px-3 py-2.5 text-sm"
                  >
                    <input type="checkbox" disabled checked readOnly className="h-4 w-4 accent-gray-400" />
                    <span className="font-medium text-gray-500">{p.label}</span>
                    <span className="ml-auto text-[11px] text-gray-400">{p.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <div className="mt-6 flex gap-3 border-t border-black/5 pt-4">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Saving…" : editing === "new" ? "Add admin" : "Save access"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
