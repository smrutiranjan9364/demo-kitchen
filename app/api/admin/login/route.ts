import { checkSuperCredentials, setAdminSession, verifyPassword } from "@/lib/auth";
import { findUser } from "@/lib/store";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const password = body.password || "";

  // 1) Bootstrap super admin (from environment).
  if (checkSuperCredentials(username, password)) {
    await setAdminSession(username, "super");
    return Response.json({ ok: true, role: "super" });
  }

  // 2) Store-managed admin user.
  const user = await findUser(username);
  if (user && verifyPassword(password, user.passwordHash, user.salt)) {
    await setAdminSession(username, "admin");
    return Response.json({ ok: true, role: "admin" });
  }

  return Response.json({ error: "Invalid username or password" }, { status: 401 });
}
