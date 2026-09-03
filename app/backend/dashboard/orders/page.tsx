import { getOrders } from "@/lib/store";
import { requireRight } from "@/lib/guard";

export const dynamic = "force-dynamic";

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

export default async function OrdersPage() {
  await requireRight("orders");
  const orders = await getOrders();

  return (
    <div>
      <h1 className="font-serif text-2xl text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">{orders.length} orders</p>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
          No orders yet. Orders placed at checkout will appear here.
        </p>
      ) : (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
