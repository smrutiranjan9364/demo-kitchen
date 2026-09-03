import { isSuperAdmin, hashPassword } from "@/lib/auth";
import { getUsers, createUser } from "@/lib/store";
import { ALL_RIGHTS, type Right } from "@/lib/permissions";

export async function GET() {
  if (!(await isSuperAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const users = (await getUsers()).map((u) => ({
    username: u.username,
    role: u.role,
    permissions: u.permissions,
    createdAt: u.createdAt,
  }));
  return Response.json(users);
}

export async function POST(request: Request) {
  if (!(await isSuperAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { username?: string; password?: string; permissions?: Right[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || password.length < 4) {
    return Response.json(
      { error: "Username and a password (min 4 chars) are required" },
      { status: 400 },
    );
  }

  const permissions = Array.isArray(body.permissions)
    ? body.permissions.filter((p): p is Right => ALL_RIGHTS.includes(p as Right))
    : ALL_RIGHTS;

  const { hash, salt } = hashPassword(password);
  const created = await createUser({ username, passwordHash: hash, salt, permissions });
  if (!created) {
    return Response.json({ error: "That username already exists" }, { status: 409 });
  }
  return Response.json(
    {
      username: created.username,
      role: created.role,
      permissions: created.permissions,
      createdAt: created.createdAt,
    },
    { status: 201 },
  );
}
