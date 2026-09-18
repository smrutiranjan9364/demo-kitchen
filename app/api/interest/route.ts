import { addInterestSignup, getInterestCount } from "@/lib/store";

function bad(error: string) {
  return Response.json({ error }, { status: 400 });
}

// The count changes as people sign up, so never let this response be cached.
export const dynamic = "force-dynamic";

// Public: powers the storefront's pre-launch teaser modal.
// GET returns the running interest count; POST registers one visitor.
export async function GET() {
  return Response.json({ count: await getInterestCount() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request");
  }

  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  if (!email || email.length > 200 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return bad("Please enter a valid email address.");
  }

  const count = await addInterestSignup({ email, name: name || null });
  return Response.json({ ok: true, count }, { status: 201 });
}
