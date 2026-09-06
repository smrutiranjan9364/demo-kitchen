import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth";

// Writes to the local filesystem, so it must run on the Node.js runtime.
export const runtime = "nodejs";

// Where uploaded images are stored and how they are served.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
// Allowed image types → file extension.
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export async function POST(request: Request) {
  // Any signed-in admin may upload; the specific resource is guarded on save.
  if (!(await getSession())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart form upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return Response.json(
      { error: "Unsupported image type (use JPG, PNG, WebP, GIF, AVIF or SVG)" },
      { status: 415 },
    );
  }

  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
  } catch {
    return Response.json({ error: "Could not save the image" }, { status: 500 });
  }

  return Response.json({ url: `${PUBLIC_PREFIX}/${name}` }, { status: 201 });
}
