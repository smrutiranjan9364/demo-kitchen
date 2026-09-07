import { hasRight } from "@/lib/guard";
import { updateMessageHandled } from "@/lib/store";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await hasRight("messages"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  let body: { handled?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.handled !== "boolean") {
    return Response.json({ error: "handled must be true or false" }, { status: 400 });
  }

  const updated = await updateMessageHandled(id, body.handled);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}
