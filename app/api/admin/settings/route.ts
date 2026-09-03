import { hasRight } from "@/lib/guard";
import { getSettings, updateSettings, type Settings } from "@/lib/store";

export async function GET() {
  if (!(await hasRight("settings"))) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json(await getSettings());
}

export async function PUT(request: Request) {
  if (!(await hasRight("settings"))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Partial<Settings>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await updateSettings(body);
  return Response.json(updated);
}
