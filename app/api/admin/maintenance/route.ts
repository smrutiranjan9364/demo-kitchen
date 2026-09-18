import { api, sameOrigin } from "@/lib/api";
import { adminRequired } from "@/lib/platform";
import { authorizedScheduler, expireUnacceptedOrders } from "@/lib/maintenance";
export async function POST(request: Request) {
  return api(async () => {
    const scheduled = authorizedScheduler(request.headers.get("authorization"));
    if (!scheduled) sameOrigin(request);
    const actor = scheduled ? "scheduler" : await adminRequired();
    return Response.json(await expireUnacceptedOrders(actor));
  });
}
