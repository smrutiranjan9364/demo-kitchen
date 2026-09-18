import { hasRight } from "@/lib/guard";
import { getSession } from "@/lib/auth";
import { getOrder, getSettings } from "@/lib/store";
import { notifyOrderStatus } from "@/lib/mail";
import { transitionOrder } from "@/lib/platform";
import { api, ApiError, body, required, sameOrigin } from "@/lib/api";
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    sameOrigin(request);
    if (!(await hasRight("orders"))) throw new ApiError("Forbidden", 403);
    const { id } = await ctx.params;
    const input = await body(request);
    await transitionOrder(
      id,
      required(input.status, "status"),
      { id: (await getSession())!.username, role: "admin" },
      typeof input.note === "string" ? input.note : "",
    );
    const order = await getOrder(id);
    if (order) await notifyOrderStatus(order, await getSettings());
    return Response.json(order);
  });
}
