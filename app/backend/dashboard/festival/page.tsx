import { getFestivalFoods } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import FestivalAdmin from "@/components/admin/FestivalAdmin";

export const dynamic = "force-dynamic";

export default async function FestivalPage() {
  await requireRight("festival");
  const foods = await getFestivalFoods();
  return <FestivalAdmin initialFoods={foods} />;
}
