import { hasRight } from "@/lib/guard";
import { getCategories, createCategory, type CategoryInput } from "@/lib/store";

export async function GET() {
  if (!(await hasRight("categories"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await getCategories());
}

export async function POST(request: Request) {
  if (!(await hasRight("categories"))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Partial<CategoryInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.label || !body.label.trim()) {
    return Response.json({ error: "Category name is required" }, { status: 400 });
  }

  const created = await createCategory(body as CategoryInput);
  if (!created) {
    return Response.json({ error: "A category with that name/slug already exists" }, { status: 409 });
  }
  return Response.json(created, { status: 201 });
}
