import { clearCustomerSession } from "@/lib/auth";

export async function POST() {
  await clearCustomerSession();
  return Response.json({ ok: true });
}
