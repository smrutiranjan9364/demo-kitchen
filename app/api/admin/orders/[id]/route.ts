import { hasRight } from "@/lib/guard";
import { getSettings, updateOrderStatus } from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/orders";
import { notifyOrderStatus } from "@/lib/mail";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await hasRight("orders"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const status = ORDER_STATUSES.find((s) => s === body.status);
  if (!status) return Response.json({ error: "Unknown status" }, { status: 400 });

  const updated = await updateOrderStatus(id, status);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });

  await notifyOrderStatus(updated, await getSettings());
  return Response.json(updated);
}
