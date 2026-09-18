import { publicApi, publicJson, corsPreflight } from "@/lib/public-api";
import { getFestivalFoods } from "@/lib/store";

// GET /api/catalog/festival — festival foods shown on the storefront /festival
// page, grouped client-side by `festival`.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export function GET() {
  return publicApi(async () => publicJson({ festival: await getFestivalFoods() }));
}
