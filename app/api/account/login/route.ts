import {
  api,
  body as readBody,
  sameOrigin,
  rateLimit,
  ApiError,
} from "@/lib/api";
import { setCustomerSession, verifyPassword } from "@/lib/auth";
import { findCustomerForLogin } from "@/lib/store";

// Public: customer sign-in. One generic error for every failure so the
// endpoint doesn't confirm which emails have accounts.
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    let body: { email?: unknown; password?: unknown };
    try {
      body = await readBody(request);
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (typeof password !== "string" || password.length > 128)
      throw new ApiError("Invalid password.");
    await rateLimit(`login:${email}`, 10);
    const invalid = () =>
      Response.json({ error: "Invalid email or password." }, { status: 401 });
    if (!email || !password) return invalid();

    const customer = await findCustomerForLogin(email);
    if (
      !customer ||
      !verifyPassword(password, customer.passwordHash, customer.salt)
    )
      return invalid();

    await setCustomerSession(customer.id);
    return Response.json({
      ok: true,
      customer: { name: customer.name, email: customer.email },
    });
  });
}
