import { isSuperAdmin } from "@/lib/auth";
import { deleteUser, updateUserPermissions } from "@/lib/store";
import { ALL_RIGHTS, type Right } from "@/lib/permissions";

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ username: string }> },
) {
  if (!(await isSuperAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { username } = await ctx.params;

  let body: { permissions?: Right[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const permissions = Array.isArray(body.permissions)
    ? body.permissions.filter((p): p is Right => ALL_RIGHTS.includes(p as Right))
    : [];

  const updated = await updateUserPermissions(decodeURIComponent(username), permissions);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({
    username: updated.username,
    role: updated.role,
    permissions: updated.permissions,
    createdAt: updated.createdAt,
  });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ username: string }> },
) {
  if (!(await isSuperAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { username } = await ctx.params;

  const ok = await deleteUser(decodeURIComponent(username));
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
