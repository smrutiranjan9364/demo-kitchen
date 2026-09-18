import { api, body, integer, required, sameOrigin } from "@/lib/api";
import { adminRequired } from "@/lib/platform";
import { processRefund, requestRefund, reconcileRefund } from "@/lib/payments";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const actor = await adminRequired(),
      input = await body(request);
    return Response.json(
      input.action === "reconcile"
        ? await reconcileRefund(required(input.id, "refund"), actor)
        : input.action === "process"
          ? await processRefund(required(input.id, "refund"), actor)
          : await requestRefund(
              required(input.orderId, "order"),
              integer(input.amount, "refund amount", 1),
              required(input.reason, "reason", 500),
              actor,
            ),
    );
  });
}
