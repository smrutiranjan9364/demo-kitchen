import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer";
import RiderDashboard from "@/components/platform/RiderDashboard";
export const metadata = {
  title: "Delivery partner dashboard",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!(await getCurrentCustomer())) redirect("/account");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl">Delivery partner dashboard</h1>
      <RiderDashboard />
    </div>
  );
}
