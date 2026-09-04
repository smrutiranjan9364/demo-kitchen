import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getProducts,
  getCategories,
  getOrders,
  getReviews,
  getFestivalFoods,
  getUserPermissions,
} from "@/lib/store";
import { ALL_RIGHTS } from "@/lib/permissions";
import AdminShell from "@/components/admin/AdminShell";
import AutoRefresh from "@/components/admin/AutoRefresh";

// Dashboard pages read live request data (cookies), so they render dynamically.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/backend");

  const [products, categories, orders, reviews, festival, rights] = await Promise.all([
    getProducts(),
    getCategories(),
    getOrders(),
    getReviews(),
    getFestivalFoods(),
    session.role === "super"
      ? Promise.resolve(ALL_RIGHTS)
      : getUserPermissions(session.username),
  ]);

  const counts = {
    categories: categories.length,
    products: products.length,
    festival: festival.length,
    orders: orders.length,
    reviews: reviews.length,
  };

  return (
    <AdminShell user={session.username} role={session.role} counts={counts} rights={rights}>
      {/* Auto-refresh server data (orders, counts, etc.) on a poll + tab focus. */}
      <AutoRefresh intervalMs={15000} />
      {children}
    </AdminShell>
  );
}
