import { hasRight } from "@/lib/guard";
import { deleteReview, setReviewApproved } from "@/lib/store";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await hasRight("reviews"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  let body: { approved?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.approved !== "boolean") {
    return Response.json({ error: "approved must be true or false" }, { status: 400 });
  }

  const updated = await setReviewApproved(id, body.approved);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await hasRight("reviews"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const ok = await deleteReview(id);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
