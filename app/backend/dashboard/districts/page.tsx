import { getDistricts } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import DistrictsAdmin from "@/components/admin/DistrictsAdmin";

export const dynamic = "force-dynamic";

export default async function DistrictsPage() {
  await requireRight("districts");
  const districts = await getDistricts();
  return <DistrictsAdmin initialDistricts={districts} />;
}
