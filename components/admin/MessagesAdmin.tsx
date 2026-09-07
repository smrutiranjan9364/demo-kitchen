"use client";

import { useState } from "react";
import { useAdminUI } from "@/components/admin/AdminUI";
import { useServerData } from "@/components/admin/useServerData";
import type { Message } from "@/lib/store";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function MessagesAdmin({ messages: serverMessages }: { messages: Message[] }) {
  const [messages, setMessages] = useServerData(serverMessages);
  const { toast } = useAdminUI();
  const [saving, setSaving] = useState<string | null>(null);

  async function setHandled(msg: Message, handled: boolean) {
    setSaving(msg.id);
    setMessages((list) => list.map((m) => (m.id === msg.id ? { ...m, handled } : m)));
    try {
      const response = await fetch(`/api/admin/messages/${msg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handled }),
      });
      if (!response.ok) throw new Error("failed");
      toast(handled ? "Marked as handled" : "Moved back to open");
    } catch {
      setMessages((list) =>
        list.map((m) => (m.id === msg.id ? { ...m, handled: !handled } : m)),
      );
      toast("Could not update the message", "error");
    } finally {
      setSaving(null);
    }
  }

  if (messages.length === 0) {
    return (
      <p className="mt-10 rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
        No messages yet. Submissions from the contact page will appear here.
      </p>
    );
  }

  // Open messages first, newest first within each group.
  const sorted = [...messages].sort((a, b) => Number(a.handled) - Number(b.handled));

  return (
    <div className="mt-6 space-y-4">
      {sorted.map((m) => (
        <div
          key={m.id}
          className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 ${
            m.handled ? "opacity-60" : ""
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{m.subject}</p>
              <p className="text-xs text-gray-500">
                {m.name} ·{" "}
                <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="text-brand hover:underline">
                  {m.email}
                </a>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{fmtDate(m.createdAt)}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  m.handled ? "bg-rating/10 text-rating" : "bg-cream text-brand"
                }`}
              >
                {m.handled ? "Handled" : "Open"}
              </span>
            </div>
          </div>

          <p className="mt-3 whitespace-pre-wrap border-t border-black/5 pt-3 text-sm leading-relaxed text-gray-700">
            {m.body}
          </p>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={saving === m.id}
              onClick={() => setHandled(m, !m.handled)}
              className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand hover:text-brand disabled:opacity-60"
            >
              {m.handled ? "Reopen" : "Mark handled"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
