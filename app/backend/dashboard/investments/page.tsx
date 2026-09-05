import { getInvestments } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import InvestmentsAdmin from "@/components/admin/InvestmentsAdmin";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  await requireRight("investments");
  const investments = await getInvestments();
  return <InvestmentsAdmin initialInvestments={investments} />;
}
