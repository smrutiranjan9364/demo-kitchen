import { hasRight } from "@/lib/guard";
import { updateInvestment, deleteInvestment, type InvestmentInput } from "@/lib/store";

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await hasRight("investments"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  let body: Partial<InvestmentInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await updateInvestment(id, body);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await hasRight("investments"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const ok = await deleteInvestment(id);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
