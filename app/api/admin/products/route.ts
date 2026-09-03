import { hasRight } from "@/lib/guard";
import { getProducts, createProduct, type ProductInput } from "@/lib/store";

export async function GET() {
  if (!(await hasRight("products"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await getProducts());
}

export async function POST(request: Request) {
  if (!(await hasRight("products"))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Partial<ProductInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.name || typeof body.price !== "number") {
    return Response.json({ error: "Name and price are required" }, { status: 400 });
  }

  const product = await createProduct(body as ProductInput);
  return Response.json(product, { status: 201 });
}
