import { hasRight } from "@/lib/guard";
import { getInvestments, createInvestment, type InvestmentInput } from "@/lib/store";

export async function GET() {
  if (!(await hasRight("investments"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await getInvestments());
}

export async function POST(request: Request) {
  if (!(await hasRight("investments"))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Partial<InvestmentInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.item || !body.item.trim()) {
    return Response.json({ error: "Item is required" }, { status: 400 });
  }
  if (typeof body.amount !== "number" || Number.isNaN(body.amount) || body.amount < 0) {
    return Response.json({ error: "A valid amount is required" }, { status: 400 });
  }

  const created = await createInvestment(body as InvestmentInput);
  return Response.json(created, { status: 201 });
}
