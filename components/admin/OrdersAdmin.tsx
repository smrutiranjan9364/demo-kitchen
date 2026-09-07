"use client";

import { useState } from "react";
import { useAdminUI } from "@/components/admin/AdminUI";
import { useServerData } from "@/components/admin/useServerData";
import { ORDER_STATUSES, STATUS_STYLE, type OrderStatus } from "@/lib/orders";
import type { Order } from "@/lib/store";

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

export default function OrdersAdmin({ orders: serverOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useServerData(serverOrders);
  const { toast } = useAdminUI();
  const [saving, setSaving] = useState<string | null>(null);

  async function changeStatus(order: Order, status: OrderStatus) {
    const previous = order.status;
    setSaving(order.id);
    // Optimistic: the select shows the new stage while the write is in flight.
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("failed");
      toast(`Order marked ${status}`);
    } catch {
      setOrders((list) =>
        list.map((o) => (o.id === order.id ? { ...o, status: previous } : o)),
      );
      toast("Could not update the order status", "error");
    } finally {
      setSaving(null);
    }
  }

  if (orders.length === 0) {
    return (
      <p className="mt-10 rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
        No orders yet. Orders placed at checkout will appear here.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{o.name}</p>
              <p className="text-xs text-gray-500">
                {o.phone} · {o.email}
              </p>
              {o.address ? (
                <p className="mt-1 text-xs text-gray-500">
                  {o.address}, {o.city}, {o.state} {o.pincode}
                </p>
              ) : null}
              <p className="mt-1 font-mono text-[11px] text-gray-400">{o.id}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand">₹{o.total.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{fmtDate(o.createdAt)}</p>
              <span className="mt-1 inline-block rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                {o.payment}
              </span>
            </div>
          </div>

          <ul className="mt-3 divide-y divide-black/5 border-t border-black/5 pt-3 text-sm">
            {o.items.map((it) => (
              <li key={it.id} className="flex justify-between py-1.5">
                <span className="text-gray-700">
                  {it.name} × {it.qty}
                </span>
                <span className="text-gray-900">₹{(it.price * it.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/5 pt-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                STATUS_STYLE[o.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {o.status}
            </span>
            <label className="ml-auto flex items-center gap-2 text-xs text-gray-500">
              Update status
              <select
                value={o.status}
                disabled={saving === o.id}
                onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                className="rounded-md border border-black/10 px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
