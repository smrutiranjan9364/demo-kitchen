import {
  api,
  body as readBody,
  sameOrigin,
  rateLimit,
  ApiError,
} from "@/lib/api";
import {
  checkSuperCredentials,
  setAdminSession,
  verifyPassword,
} from "@/lib/auth";
import { findUser } from "@/lib/store";

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    let body: { username?: string; password?: string };
    try {
      body = await readBody(request);
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const username = (
      typeof body.username === "string" ? body.username : ""
    ).trim();
    const password = body.password || "";
    if (typeof password !== "string" || password.length > 128)
      throw new ApiError("Invalid password.");
    await rateLimit(`login:${username}`, 10);

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

    return Response.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  });
}
