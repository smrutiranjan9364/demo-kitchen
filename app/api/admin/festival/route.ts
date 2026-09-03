import { hasRight } from "@/lib/guard";
import { getFestivalFoods, createFestivalFood, type FestivalInput } from "@/lib/store";

export async function GET() {
  if (!(await hasRight("festival"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await getFestivalFoods());
}

export async function POST(request: Request) {
  if (!(await hasRight("festival"))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Partial<FestivalInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.name?.trim() || !body.festival?.trim()) {
    return Response.json({ error: "Name and festival are required" }, { status: 400 });
  }

  const food = await createFestivalFood(body as FestivalInput);
  return Response.json(food, { status: 201 });
}
