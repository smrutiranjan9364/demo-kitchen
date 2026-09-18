import { requireRight } from "@/lib/guard";
import PlatformAdmin from "@/components/platform/PlatformAdmin";
export default async function Page() {
  await requireRight("platform");
  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-6 font-serif text-3xl">Platform operations</h1>
      <PlatformAdmin />
    </div>
  );
}
