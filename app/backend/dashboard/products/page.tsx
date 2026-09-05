import { getProducts, getCategories, getDistricts } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import ProductsAdmin from "@/components/admin/ProductsAdmin";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireRight("products");
  const [products, categories, districts] = await Promise.all([
    getProducts(),
    getCategories(),
    getDistricts(),
  ]);
  return (
    <ProductsAdmin
      initialProducts={products}
      categories={categories}
      districts={districts.map((d) => ({ slug: d.slug, name: d.name }))}
    />
  );
}
