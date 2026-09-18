"use client";
import { optionsText, type MenuOption } from "@/lib/menu";
import { useState } from "react";
import { canTransition } from "@/lib/commerce";
import { Button, Field, Notice, Panel, formValues, useRemote } from "./UI";
type Restaurant = {
  id: string;
  name: string;
  approval: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  pincodes: string;
  opens: string;
  closes: string;
  minimum_order: number;
  delivery_fee: number;
  packaging_fee: number;
  eta_minutes: number;
  enabled: boolean;
};
type Product = {
  variants?: MenuOption[];
  addons?: MenuOption[];
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  weight: string;
  veg: boolean;
  available: boolean;
};
type Order = {
  id: string;
  name: string;
  phone: string;
  items: { name: string; qty: number; instructions?: string }[];
  total: number;
  status: string;
  instructions: string;
  payment_status: string;
  created_at: string;
};
type Data = {
  restaurant: Restaurant | null;
  products: Product[];
  orders: Order[];
  earnings: {
    order_id: string;
    restaurant_amount: number;
    commission: number;
  }[];
};
export default function RestaurantDashboard() {
  const { data, error, busy, act, refresh } = useRemote<Data>(
    "/api/partner?role=restaurant",
  );
  const [edit, setEdit] = useState<Product | null>(null);
  const [tab, setTab] = useState("Orders");
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = formValues(form);
    if (
      await act({
        ...values,
        action,
        enabled: values.enabled === "on",
        veg: values.veg === "on",
        available: values.available === "on",
      })
    ) {
      setMessage("Saved successfully.");
      setEdit(null);
    }
  }
  if (!data)
    return (
      <>
        <Notice error={error} loading={!error} />
        {error ? <Button onClick={() => void refresh()}>Retry</Button> : null}
      </>
    );
  if (!data.restaurant)
    return (
      <Panel title="Apply to join as a restaurant">
        <p className="mb-4 text-sm text-gray-500">
          Verify your email in account settings first. Your restaurant appears
          to customers after admin approval.
        </p>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => submit(e, "register-restaurant")}
        >
          {[
            ["name", "Restaurant name"],
            ["address", "Restaurant address"],
            ["phone", "Contact phone"],
            ["cuisine", "Cuisines"],
            ["pincodes", "Delivery pincode prefixes (e.g. 751,752)"],
          ].map(([name, label]) => (
            <Field key={name} name={name} label={label} />
          ))}
          <Button type="submit" disabled={busy}>
            Submit application
          </Button>
        </form>
        <Notice error={error} />
      </Panel>
    );
  const r = data.restaurant;
  return (
    <div className="space-y-6">
      <Notice error={error} />
      {message ? (
        <p role="status" className="text-rating">
          {message}
        </p>
      ) : null}
      <p className="text-sm text-gray-600">
        {r.name} · Approval: <strong>{r.approval}</strong> ·{" "}
        {r.enabled
          ? "Accepting orders during opening hours"
          : "Temporarily closed"}
      </p>
      <div className="flex flex-wrap gap-2">
        {["Orders", "Menu", "Restaurant", "Earnings"].map((t) => (
          <Button key={t} onClick={() => setTab(t)} disabled={tab === t}>
            {t}
          </Button>
        ))}
        <Button onClick={() => void refresh()}>Refresh</Button>
      </div>
      {tab === "Orders" ? (
        <Panel title="Order queue">
          <p className="mb-4 text-sm text-gray-500">
            {
              data.orders.filter(
                (o) =>
                  !["Delivered", "Cancelled", "Rejected"].includes(o.status),
              ).length
            }{" "}
            active orders ·{" "}
            {data.orders.filter((o) => o.status === "Delivered").length}{" "}
            delivered in the latest 100 orders
          </p>
          {!data.orders.length ? (
            <p>No orders yet.</p>
          ) : (
            data.orders.map((o) => (
              <article
                key={o.id}
                className="mb-4 rounded-lg border border-black/10 p-4"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>
                    {o.name} · ₹{o.total}
                  </strong>
                  <span>{o.status}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {o.id} · Payment {o.payment_status}
                </p>
                <ul className="my-3 text-sm">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      {it.qty} × {it.name}
                      {it.instructions ? (
                        <p className="text-xs text-gray-500">
                          {it.instructions}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {o.instructions ? (
                  <p className="mb-3 text-sm">Instructions: {o.instructions}</p>
                ) : null}
                <a
                  href={`tel:${o.phone}`}
                  className="text-sm text-brand underline"
                >
                  Contact customer
                </a>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Confirmed",
                    "Preparing",
                    "Ready for Pickup",
                    "Rejected",
                    "Cancelled",
                  ]
                    .filter((s) => canTransition(o.status, s, "restaurant"))
                    .map((s) => (
                      <Button
                        key={s}
                        disabled={busy}
                        onClick={() => {
                          let note = "";
                          if (["Rejected", "Cancelled"].includes(s)) {
                            const reason = prompt(
                              "Reason for rejecting/cancelling this order",
                            );
                            if (!reason) return;
                            note = reason;
                          }
                          void act({
                            action: "restaurant-status",
                            id: o.id,
                            status: s,
                            note,
                          });
                        }}
                      >
                        {s === "Confirmed" ? "Accept order" : s}
                      </Button>
                    ))}
                </div>
              </article>
            ))
          )}
        </Panel>
      ) : null}
      {tab === "Menu" ? (
        <Panel title="Menu management">
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {data.products.map((p) => (
              <button
                key={p.id}
                onClick={() => setEdit(p)}
                className="rounded-lg border border-black/10 p-3 text-left"
              >
                <strong>{p.name}</strong>
                <p className="text-sm text-gray-500">
                  ₹{p.price} · {p.stock ?? "Untracked"} left ·{" "}
                  {p.available ? "Available" : "Hidden"}
                </p>
                <span className="text-xs text-brand">Edit item</span>
              </button>
            ))}
          </div>
          <h3 className="mb-3 font-semibold">
            {edit ? "Edit food item" : "Add food item"}
          </h3>
          <form
            key={edit?.id ?? "new"}
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => submit(e, "menu")}
          >
            {edit ? <input type="hidden" name="id" value={edit.id} /> : null}
            {(["name", "price", "stock", "description", "weight"] as const).map(
              (n) => (
                <Field
                  key={n}
                  name={n}
                  label={n === "weight" ? "Portion / weight" : n}
                  value={edit?.[n] ?? ""}
                  type={["price", "stock"].includes(n) ? "number" : "text"}
                />
              ),
            )}
            {["variants", "addons"].map((kind) => (
              <label key={kind} className="text-sm">
                {kind === "variants" ? "Portions" : "Add-ons"} — one option per
                line: Name | extra price
                <textarea
                  className="mt-1 w-full rounded-lg border border-black/10 p-3"
                  name={`${kind}Text`}
                  rows={3}
                  defaultValue={optionsText(
                    edit?.[kind as "variants" | "addons"],
                  )}
                  placeholder={
                    kind === "variants"
                      ? "Regular | 0\nLarge | 50"
                      : "Extra chutney | 20"
                  }
                />
              </label>
            ))}
            <label>
              <input
                name="veg"
                type="checkbox"
                defaultChecked={edit?.veg ?? true}
              />{" "}
              Vegetarian
            </label>
            <label>
              <input
                name="available"
                type="checkbox"
                defaultChecked={edit?.available ?? true}
              />{" "}
              Available
            </label>
            <Button type="submit" disabled={busy}>
              Save item
            </Button>
            {edit ? (
              <Button onClick={() => setEdit(null)}>Cancel edit</Button>
            ) : null}
          </form>
        </Panel>
      ) : null}
      {tab === "Restaurant" ? (
        <Panel title="Restaurant settings">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => submit(e, "restaurant-settings")}
          >
            {(
              [
                "name",
                "description",
                "cuisine",
                "address",
                "phone",
                "pincodes",
                "opens",
                "closes",
                "minimum_order",
                "delivery_fee",
                "packaging_fee",
                "eta_minutes",
              ] as const
            ).map((n) => (
              <Field
                key={n}
                name={n}
                label={n.replaceAll("_", " ")}
                value={r[n]}
                type={
                  ["opens", "closes"].includes(n)
                    ? "time"
                    : typeof r[n] === "number"
                      ? "number"
                      : "text"
                }
              />
            ))}
            <label>
              <input
                name="enabled"
                type="checkbox"
                defaultChecked={r.enabled}
              />{" "}
              Accept orders during opening hours
            </label>
            <Button type="submit" disabled={busy}>
              Save settings
            </Button>
          </form>
          <p className="mt-3 text-xs text-gray-500">
            Times use India Standard Time. Equal opening and closing times mean
            open all day.
          </p>
        </Panel>
      ) : null}
      {tab === "Earnings" ? (
        <Panel title="Completed-order earnings">
          <p className="mb-3 text-2xl font-bold text-brand">
            ₹{data.earnings.reduce((s, e) => s + e.restaurant_amount, 0)}
          </p>
          <p className="mb-4 text-sm text-gray-500">
            Latest 100 completed orders. These are recorded earnings, not
            confirmation of a bank payout.
          </p>
          {data.earnings.map((e) => (
            <p
              key={e.order_id}
              className="border-b border-black/5 py-3 text-sm"
            >
              {e.order_id} · ₹{e.restaurant_amount} · Commission ₹{e.commission}
            </p>
          ))}
        </Panel>
      ) : null}
    </div>
  );
}
