import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer";
import RestaurantDashboard from "@/components/platform/RestaurantDashboard";
export const metadata = {
  title: "Restaurant dashboard",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!(await getCurrentCustomer())) redirect("/account");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl">Restaurant dashboard</h1>
      <RestaurantDashboard />
    </div>
  );
}
