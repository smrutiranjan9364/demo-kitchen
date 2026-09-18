import { api } from "@/lib/api";
import { customerRequired } from "@/lib/platform";
import { getOrdersForCustomer } from "@/lib/store";

// GET /api/account/orders — the signed-in customer's order history as JSON.
// Additive: the website renders this list server-side on /account; the mobile
// app needs it over the wire. Authenticated via the customer session cookie
// (customerRequired throws 401 when signed out). No same-origin write path.
export const dynamic = "force-dynamic";

export function GET() {
  return api(async () => {
    const id = await customerRequired();
    const orders = await getOrdersForCustomer(id);
    return Response.json({ orders });
  });
}
