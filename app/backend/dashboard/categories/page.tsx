import { getCategories } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireRight("categories");
  const categories = await getCategories();
  return <CategoriesAdmin initialCategories={categories} />;
}
