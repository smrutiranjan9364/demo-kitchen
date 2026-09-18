import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer";
import AccountSettings from "@/components/platform/AccountSettings";
export const metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!(await getCurrentCustomer())) redirect("/account");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl">Account settings</h1>
      <AccountSettings />
    </div>
  );
}
