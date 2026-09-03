import { hasRight } from "@/lib/guard";
import { updateCategory, deleteCategory, type CategoryInput } from "@/lib/store";

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  if (!(await hasRight("categories"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { slug } = await ctx.params;

  let body: Partial<CategoryInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await updateCategory(slug, body);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  if (!(await hasRight("categories"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { slug } = await ctx.params;

  const ok = await deleteCategory(slug);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
