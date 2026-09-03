import { getProducts, getCategories } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import ProductsAdmin from "@/components/admin/ProductsAdmin";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireRight("products");
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <ProductsAdmin initialProducts={products} categories={categories} />;
}
