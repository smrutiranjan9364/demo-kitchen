import { publicApi, publicJson, corsPreflight } from "@/lib/public-api";
import { getDistricts, getDistrictNav } from "@/lib/store";

// GET /api/catalog/districts — the 30 Odisha districts. `districts` carries the
// full records (region, headquarter, image); `nav` is the {label, href} list
// the storefront menus use. Falls back to the static seed when the DB is empty.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export function GET() {
  return publicApi(async () => {
    const [districts, nav] = await Promise.all([
      getDistricts().catch(() => []),
      getDistrictNav(),
    ]);
    return publicJson({ districts, nav });
  });
}
