import { hasRight } from "@/lib/guard";
import { getDistricts, createDistrict, type DistrictInput } from "@/lib/store";

export async function GET() {
  if (!(await hasRight("districts"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await getDistricts());
}

export async function POST(request: Request) {
  if (!(await hasRight("districts"))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Partial<DistrictInput>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.name || !body.name.trim()) {
    return Response.json({ error: "District name is required" }, { status: 400 });
  }

  const created = await createDistrict(body as DistrictInput);
  if (!created) {
    return Response.json({ error: "A district with that name/slug already exists" }, { status: 409 });
  }
  return Response.json(created, { status: 201 });
}
