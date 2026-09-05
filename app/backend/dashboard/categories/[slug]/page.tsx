import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getProductsByCategory, getCategories, getDistricts } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import ProductsAdmin from "@/components/admin/ProductsAdmin";

export const dynamic = "force-dynamic";

export default async function CategoryProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireRight("categories");
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const [products, categories, districts] = await Promise.all([
    getProductsByCategory(slug),
    getCategories(),
    getDistricts(),
  ]);

  return (
    <div>
      <Link
        href="/backend/dashboard/categories"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← All categories
      </Link>

      <div className="mt-4">
        <ProductsAdmin
          initialProducts={products}
          categories={categories}
          districts={districts.map((d) => ({ slug: d.slug, name: d.name }))}
          heading={category.label}
          lockedCategory={slug}
        />
      </div>
    </div>
  );
}
