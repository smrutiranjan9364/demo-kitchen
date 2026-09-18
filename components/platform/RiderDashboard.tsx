"use client";
import { Button, Field, Notice, Panel, formValues, useRemote } from "./UI";
type Delivery = {
  id: string;
  status: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  landmark: string;
  instructions: string;
  total: number;
  payment: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
};
type Data = {
  rider: { approval: string; online: boolean; vehicle: string } | null;
  active: Delivery[];
  available: {
    id: string;
    restaurant_name: string;
    restaurant_address: string;
    delivery: number;
  }[];
  earnings: { order_id: string; rider_amount: number; created_at: string }[];
};
export default function RiderDashboard() {
  const { data, error, busy, act, refresh } = useRemote<Data>(
    "/api/partner?role=rider",
  );
  if (!data)
    return (
      <>
        <Notice error={error} loading={!error} />
        {error ? <Button onClick={() => void refresh()}>Retry</Button> : null}
      </>
    );
  if (!data.rider)
    return (
      <Panel title="Become a delivery partner">
        <p className="mb-4 text-sm text-gray-500">
          Verify your email in account settings, then apply. An administrator
          must approve your application.
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void act({
              action: "register-rider",
              ...formValues(e.currentTarget),
            });
          }}
        >
          <Field name="vehicle" label="Vehicle type and registration number" />
          <Button type="submit" disabled={busy}>
            Apply
          </Button>
        </form>
        <Notice error={error} />
      </Panel>
    );
  return (
    <div className="space-y-6">
      <Notice error={error} />
      <div className="flex flex-wrap items-center gap-4">
        <p>
          Status: <strong>{data.rider.approval}</strong> ·{" "}
          {data.rider.online ? "Online" : "Offline"}
        </p>
        <Button
          disabled={busy || data.rider.approval !== "approved"}
          onClick={() =>
            void act({ action: "online", online: !data.rider!.online })
          }
        >
          {data.rider.online ? "Go offline" : "Go online"}
        </Button>
        <Button onClick={() => void refresh()}>Refresh deliveries</Button>
      </div>
      <Panel title="Active delivery">
        {!data.active.length ? (
          <p className="text-sm text-gray-500">
            No active delivery. Go online to see ready orders.
          </p>
        ) : (
          data.active.map((o) => (
            <div key={o.id} className="space-y-3">
              <h3 className="font-semibold">
                {o.restaurant_name} · {o.status}
              </h3>
              <p className="text-xs text-gray-500">{o.id}</p>
              <p>Pickup: {o.restaurant_address}</p>
              <p>
                Deliver to: {o.name}, {o.address}, {o.city} {o.pincode}
              </p>
              {o.landmark ? <p>Landmark: {o.landmark}</p> : null}
              {o.instructions ? <p>Instructions: {o.instructions}</p> : null}
              <div className="flex flex-wrap gap-4 text-sm text-brand underline">
                <a href={`tel:${o.restaurant_phone}`}>Call restaurant</a>
                <a href={`tel:${o.phone}`}>Call customer</a>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.status === "Rider Assigned" ? o.restaurant_address : `${o.address}, ${o.city} ${o.pincode}`)}`}
                >
                  Open navigation
                </a>
                <a href="/account/settings">Report delivery issue</a>
              </div>
              <p className="font-semibold">
                {o.payment === "Cash on Delivery"
                  ? `Collect ₹${o.total} in cash before completing delivery`
                  : "Online payment"}
              </p>
              <div className="flex flex-wrap gap-3">
                {o.status === "Rider Assigned" ? (
                  <>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "rider-status",
                          id: o.id,
                          status: "Picked Up",
                        })
                      }
                    >
                      Confirm pickup
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Release this delivery back to the queue?"))
                          void act({
                            action: "rider-status",
                            id: o.id,
                            status: "Ready for Pickup",
                            note: "Rider released before pickup",
                          });
                      }}
                    >
                      Release delivery
                    </Button>
                  </>
                ) : null}
                {o.status === "Picked Up" ? (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void act({
                        action: "rider-status",
                        id: o.id,
                        status: "Dispatched",
                      })
                    }
                  >
                    Start delivery
                  </Button>
                ) : null}
                {o.status === "Dispatched" ? (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act({
                        action: "rider-status",
                        id: o.id,
                        status: "Delivered",
                        ...formValues(e.currentTarget),
                      });
                    }}
                  >
                    <Field
                      name="otp"
                      label="Customer's six-digit delivery code"
                    />
                    <Button type="submit" disabled={busy}>
                      Confirm delivered
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))
        )}
      </Panel>
      <Panel title="Ready for pickup">
        {!data.available.length ? (
          <p className="text-sm text-gray-500">
            No delivery requests available right now.
          </p>
        ) : (
          data.available.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 py-4"
            >
              <div>
                <strong>{o.restaurant_name}</strong>
                <p className="text-sm text-gray-500">
                  {o.restaurant_address} · Delivery fee ₹{o.delivery}
                </p>
              </div>
              <Button
                disabled={busy || data.active.length > 0}
                onClick={() =>
                  void act({ action: "accept-delivery", id: o.id })
                }
              >
                Accept delivery
              </Button>
            </div>
          ))
        )}
      </Panel>
      <Panel title="Delivery earnings">
        <p className="mb-3 text-2xl font-bold text-brand">
          ₹{data.earnings.reduce((s, e) => s + e.rider_amount, 0)}
        </p>
        <p className="mb-3 text-sm text-gray-500">
          Latest 100 completed deliveries. Bank payouts are handled separately.
        </p>
        {data.earnings.map((e) => (
          <p className="border-b border-black/5 py-2 text-sm" key={e.order_id}>
            {new Date(e.created_at).toLocaleDateString()} · {e.order_id} · ₹
            {e.rider_amount}
          </p>
        ))}
      </Panel>
    </div>
  );
}
