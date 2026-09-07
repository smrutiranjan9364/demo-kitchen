import { getMessages } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import MessagesAdmin from "@/components/admin/MessagesAdmin";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  await requireRight("messages");
  const messages = await getMessages();
  const open = messages.filter((m) => !m.handled).length;

  return (
    <div>
      <h1 className="font-serif text-2xl text-gray-900">Messages</h1>
      <p className="mt-1 text-sm text-gray-500">
        {open} open · {messages.length} total
      </p>
      <MessagesAdmin messages={messages} />
    </div>
  );
}
