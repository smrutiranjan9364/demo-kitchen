import { hashPassword, setCustomerSession } from "@/lib/auth";
import { createCustomer } from "@/lib/store";
import { isIndianMobile } from "@/lib/orders";

function text(value: unknown, max: number): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length > 0 && s.length <= max ? s : null;
}

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

// Public: creates a customer account and signs them in.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request");
  }

  const name = text(body.name, 100);
  const phone = text(body.phone, 20);
  const email = text(body.email, 200)?.toLowerCase() ?? null;
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) return bad("Please enter your name.");
  if (!phone || !isIndianMobile(phone)) return bad("Please enter a valid Indian mobile number.");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Please enter a valid email address.");
  if (password.length < 8) return bad("Please choose a password of at least 8 characters.");

  const { hash, salt } = hashPassword(password);
  const customer = await createCustomer({ name, phone, email, passwordHash: hash, salt });
  if (!customer) return bad("An account with this email already exists. Try logging in.", 409);

  await setCustomerSession(customer.id);
  return Response.json({ ok: true, customer: { name: customer.name, email: customer.email } }, { status: 201 });
}
