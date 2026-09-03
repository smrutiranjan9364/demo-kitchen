import { getSettings } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import SettingsAdmin from "@/components/admin/SettingsAdmin";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRight("settings");
  const settings = await getSettings();
  return <SettingsAdmin initial={settings} />;
}
