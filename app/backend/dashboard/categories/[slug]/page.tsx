import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getProductsByCategory, getCategories } from "@/lib/store";
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

  const [products, categories] = await Promise.all([
    getProductsByCategory(slug),
    getCategories(),
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
          heading={category.label}
          lockedCategory={slug}
        />
      </div>
    </div>
  );
}
