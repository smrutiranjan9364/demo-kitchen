import { createMessage, getSettings } from "@/lib/store";
import { notifyContactMessage } from "@/lib/mail";

// A trimmed string, or null when it is missing / implausibly long.
function text(value: unknown, max: number): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length > 0 && s.length <= max ? s : null;
}

function bad(error: string) {
  return Response.json({ error }, { status: 400 });
}

// Public: the storefront contact form.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request");
  }

  // Honeypot: real visitors never see the `website` field. A bot that fills it
  // gets a cheerful 201 and nothing is stored or sent.
  // ponytail: honeypot only; add IP rate limiting if spam still gets through.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const name = text(body.name, 100);
  const email = text(body.email, 200);
  const subject = text(body.subject, 150);
  const message = text(body.message, 4000);

  if (!name) return bad("Please enter your name.");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return bad("Please enter a valid email address.");
  }
  if (!subject) return bad("Please enter a subject.");
  if (!message) return bad("Please write a message.");

  const saved = await createMessage({ name, email, subject, body: message });
  await notifyContactMessage(saved, await getSettings());

  return Response.json({ ok: true, id: saved.id }, { status: 201 });
}
