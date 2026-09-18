"use client";
import { useEffect, useState } from "react";
import OrderReview from "./OrderReview";
import PayOrderButton from "./PayOrderButton";
import { useRouter } from "next/navigation";
import { Button, Notice, requestApi } from "./UI";
type Tracking = {
  status: string;
  payment: string;
  paymentStatus: string;
  eta: string;
  delayed: boolean;
  deliveryCode: string;
  restaurantName: string;
  restaurantPhone: string;
  riderName: string;
  riderPhone: string;
  landmark: string;
  instructions: string;
  canCancel: boolean;
  canReview: boolean;
  breakdown: Record<string, number>;
  events: { status: string; note: string; created_at: string }[];
  refunds: { amount: number; status: string }[];
};
export default function OrderTracking({
  id,
  token,
}: {
  id: string;
  token?: string;
}) {
  const [data, setData] = useState<Tracking | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (document.hidden) return;
      try {
        const result = await requestApi(
          `/api/orders/${id}${token ? `?t=${encodeURIComponent(token)}` : ""}`,
        );
        if (active) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    };
    void load();
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, token]);
  return (
    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="font-serif text-xl">Delivery updates</h2>
      <Notice error={error} loading={!data && !error} />
      {data ? (
        <>
          <p className="mt-3 font-semibold text-brand">
            {data.status} · Payment {data.paymentStatus}
          </p>
          {!["Delivered", "Cancelled", "Rejected"].includes(data.status) ? (
            <>
              <p className="mt-2 text-sm">
                Estimated arrival:{" "}
                {new Date(data.eta).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {data.delayed
                  ? " · Running late — contact the restaurant for an update."
                  : ""}
              </p>
              <p className="mt-3 rounded-lg bg-cream-soft p-3 text-sm">
                Delivery code:{" "}
                <strong className="font-mono text-lg">
                  {data.deliveryCode}
                </strong>
                . Share only when you receive your order.
              </p>
            </>
          ) : null}
          {data.payment === "Online" &&
          data.status === "Placed" &&
          !["paid", "refunded"].includes(data.paymentStatus) ? (
            <PayOrderButton id={id} token={token} />
          ) : null}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand underline">
            <a href={`tel:${data.restaurantPhone}`}>
              Call {data.restaurantName}
            </a>
            {data.riderPhone ? (
              <a href={`tel:${data.riderPhone}`}>Call rider {data.riderName}</a>
            ) : (
              <span className="text-gray-500 no-underline">
                Rider not assigned yet
              </span>
            )}
            <a href="/account/settings">Get help</a>
            <button type="button" onClick={() => window.print()}>
              Print receipt
            </button>
          </div>
          {data.landmark ? (
            <p className="mt-3 text-sm">Landmark: {data.landmark}</p>
          ) : null}
          {data.instructions ? (
            <p className="mt-2 text-sm">Instructions: {data.instructions}</p>
          ) : null}
          <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {[
              "subtotal",
              "delivery",
              "packaging",
              "platform",
              "tax",
              "discount",
              "tip",
              "total",
            ]
              .filter((k) => k in data.breakdown)
              .map((k) => [k, data.breakdown[k]] as const)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="capitalize text-gray-500">{k}</dt>
                  <dd>
                    {k === "discount" ? "−" : ""}₹{v}
                  </dd>
                </div>
              ))}
          </dl>
          <ol className="mt-5 space-y-3 border-l-2 border-brand/20 pl-4">
            {data.events.map((e, i) => (
              <li key={i} className="text-sm">
                <strong>{e.status}</strong>
                <p className="text-xs text-gray-500">
                  {new Date(e.created_at).toLocaleString()}
                </p>
                {e.note ? <p>{e.note}</p> : null}
              </li>
            ))}
          </ol>
          {data.refunds.map((r, i) => (
            <p key={i} className="mt-3 text-sm">
              Refund ₹{r.amount}: {r.status}
            </p>
          ))}
          {data.canReview ? <OrderReview id={id} /> : null}
          {data.canCancel ? (
            <div className="mt-4">
              <Button
                disabled={busy}
                onClick={async () => {
                  const reason = prompt("Why are you cancelling this order?");
                  if (!reason) return;
                  setBusy(true);
                  try {
                    await requestApi(`/api/orders/${id}`, { reason }, "PATCH");
                    setData({ ...data, status: "Cancelled", canCancel: false });
                    router.refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Cancel order
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
