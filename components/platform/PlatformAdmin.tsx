"use client";
import { useState } from "react";
import {
  Button,
  Field,
  Notice,
  Panel,
  formValues,
  inputClass,
  requestApi,
  useRemote,
} from "./UI";
type Data = {
  restaurants: {
    id: string;
    name: string;
    approval: string;
    commission_bps: number;
  }[];
  riders: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    approval: string;
    online: boolean;
  }[];
  customers: { id: string; name: string; email: string; blocked: boolean }[];
  tickets: {
    id: string;
    subject: string;
    body: string;
    status: string;
    reply: string;
    order_id: string;
  }[];
  coupons: { code: string; kind: string; value: number; active: boolean }[];
  refunds: {
    id: string;
    order_id: string;
    amount: number;
    status: string;
    reason: string;
  }[];
  earnings: {
    order_id: string;
    restaurant_amount: number;
    rider_amount: number;
    commission: number;
  }[];
  audit: {
    id: number;
    actor: string;
    action: string;
    target: string;
    created_at: string;
  }[];
};
export default function PlatformAdmin() {
  const [page, setPage] = useState(0);
  const { data, error, busy, act, refresh } = useRemote<Data>(
    `/api/admin/platform?page=${page}`,
  );
  const [tab, setTab] = useState("Restaurants");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState("");
  const [refundBusy, setRefundBusy] = useState(false),
    [refundError, setRefundError] = useState("");
  async function refundAction(input: Record<string, unknown>) {
    setRefundBusy(true);
    setRefundError("");
    try {
      await requestApi("/api/admin/refunds", input);
      setSaved("Refund request updated.");
      await refresh();
    } catch (e) {
      setRefundError((e as Error).message);
    } finally {
      setRefundBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const values = formValues(e.currentTarget);
    if (
      await act({
        ...values,
        action,
        first_order: values.first_order === "on",
        active: values.active === "on",
      })
    )
      setSaved("Saved successfully.");
  }
  if (!data)
    return (
      <>
        <Notice error={error} loading={!error} />
        {error ? <Button onClick={() => void refresh()}>Retry</Button> : null}
      </>
    );
  return (
    <div className="space-y-5">
      <Notice error={error} />
      {saved ? (
        <p role="status" className="text-rating">
          {saved}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {[
          "Restaurants",
          "Riders",
          "Customers",
          "Support",
          "Coupons",
          "Finance",
          "Audit",
        ].map((t) => (
          <Button key={t} disabled={t === tab} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>
      <label className="block text-sm">
        Search this page
        <input
          className={inputClass}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {tab === "Restaurants" ? (
        <Panel title="Restaurant applications & management">
          {data.restaurants
            .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
            .map((r) => (
              <article
                className="mb-4 rounded-lg border border-black/10 p-4"
                key={r.id}
              >
                <strong>{r.name}</strong>
                <p className="mb-3 text-sm">{r.approval}</p>
                <div className="flex flex-wrap gap-2">
                  {["approved", "rejected", "suspended"]
                    .filter((s) => s !== r.approval)
                    .map((s) => (
                      <Button
                        key={s}
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Set ${r.name} to ${s}?`))
                            void act({
                              action: "approval",
                              kind: "restaurant",
                              id: r.id,
                              status: s,
                            });
                        }}
                      >
                        {s}
                      </Button>
                    ))}
                </div>
                <form
                  className="mt-4 flex flex-wrap items-end gap-3"
                  onSubmit={(e) => submit(e, "commission")}
                >
                  <input type="hidden" name="id" value={r.id} />
                  <Field
                    name="commission_bps"
                    label="Commission basis points (100 = 1%)"
                    type="number"
                    value={r.commission_bps}
                  />
                  <Button type="submit" disabled={busy}>
                    Save commission
                  </Button>
                </form>
              </article>
            ))}
        </Panel>
      ) : null}
      {tab === "Riders" ? (
        <Panel title="Delivery partners">
          {!data.riders.length ? (
            <p>No rider applications yet.</p>
          ) : (
            data.riders
              .filter((r) =>
                r.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((r) => (
                <article
                  className="mb-4 rounded-lg border border-black/10 p-4"
                  key={r.id}
                >
                  <strong>
                    {r.name} · {r.approval}
                  </strong>
                  <p className="mb-3 text-sm">
                    {r.phone} · {r.vehicle} · {r.online ? "Online" : "Offline"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["approved", "rejected", "suspended"]
                      .filter((s) => s !== r.approval)
                      .map((s) => (
                        <Button
                          key={s}
                          disabled={busy}
                          onClick={() => {
                            if (confirm(`Set rider to ${s}?`))
                              void act({
                                action: "approval",
                                kind: "rider",
                                id: r.id,
                                status: s,
                              });
                          }}
                        >
                          {s}
                        </Button>
                      ))}
                  </div>
                </article>
              ))
          )}
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => submit(e, "assign")}
          >
            <Field name="id" label="Ready-for-pickup order number" />
            <label className="block text-sm">
              Assign rider
              <select name="riderId" className={inputClass} required>
                <option value="">Choose approved online rider</option>
                {data.riders
                  .filter((r) => r.approval === "approved" && r.online)
                  .map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
            <Button type="submit" disabled={busy}>
              Assign delivery
            </Button>
          </form>
        </Panel>
      ) : null}
      {tab === "Customers" ? (
        <Panel title="Customers">
          {data.customers
            .filter((c) =>
              `${c.name} ${c.email}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((c) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 py-4"
                key={c.id}
              >
                <div>
                  <strong>{c.name}</strong>
                  <p className="text-sm text-gray-500">{c.email}</p>
                </div>
                <Button
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        `${c.blocked ? "Unblock" : "Block"} this account?`,
                      )
                    )
                      void act({
                        action: "block",
                        id: c.id,
                        blocked: !c.blocked,
                      });
                  }}
                >
                  {c.blocked ? "Unblock" : "Block"}
                </Button>
              </div>
            ))}
        </Panel>
      ) : null}
      {tab === "Support" ? (
        <Panel title="Support tickets">
          {!data.tickets.length ? (
            <p>No tickets.</p>
          ) : (
            data.tickets
              .filter((t) =>
                `${t.subject} ${t.order_id}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((t) => (
                <form
                  key={t.id}
                  className="mb-5 space-y-3 rounded-lg border border-black/10 p-4"
                  onSubmit={(e) => submit(e, "ticket")}
                >
                  <input type="hidden" name="id" value={t.id} />
                  <strong>{t.subject}</strong>
                  <p className="text-xs text-gray-500">{t.order_id}</p>
                  <p className="whitespace-pre-wrap text-sm">{t.body}</p>
                  <Field
                    name="reply"
                    label="Reply to customer"
                    value={t.reply}
                  />
                  <select
                    name="status"
                    defaultValue={t.status}
                    className={inputClass}
                  >
                    {["Open", "In progress", "Resolved"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <Button type="submit" disabled={busy}>
                    Update ticket
                  </Button>
                </form>
              ))
          )}
        </Panel>
      ) : null}
      {tab === "Coupons" ? (
        <Panel title="Offers & coupons">
          <div className="mb-5 space-y-2">
            {data.coupons.map((c) => (
              <p key={c.code}>
                {c.code} · {c.kind} {c.value} ·{" "}
                {c.active ? "Active" : "Inactive"}
              </p>
            ))}
          </div>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => submit(e, "coupon")}
          >
            <Field name="code" label="Code (existing code updates it)" />
            <label>
              Discount type
              <select name="kind" className={inputClass}>
                {["flat", "percent", "delivery"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <Field
              name="value"
              label="Discount value"
              type="number"
              value={0}
            />
            <Field
              name="minimum"
              label="Minimum subtotal (₹)"
              type="number"
              value={0}
            />
            <Field
              name="maximum"
              label="Maximum discount (₹)"
              type="number"
              value={100}
            />
            <Field name="expires_at" label="Expiry" type="datetime-local" />
            <label>
              <input name="first_order" type="checkbox" /> First order only
            </label>
            <label>
              <input name="active" type="checkbox" defaultChecked /> Active
            </label>
            <Button type="submit" disabled={busy}>
              Save coupon
            </Button>
          </form>
        </Panel>
      ) : null}
      {tab === "Finance" ? (
        <>
          <Panel title="Recorded earnings">
            <a
              href={`/api/admin/platform?export=earnings&page=${page}`}
              className="text-brand underline"
            >
              Export current page as CSV
            </a>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Restaurant</th>
                    <th>Rider</th>
                    <th>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.earnings.map((e) => (
                    <tr key={e.order_id}>
                      <td className="py-3">{e.order_id}</td>
                      <td>₹{e.restaurant_amount}</td>
                      <td>₹{e.rider_amount}</td>
                      <td>₹{e.commission}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Refund requests">
            <Notice error={refundError} />
            <form
              className="mb-5 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void refundAction(formValues(e.currentTarget));
              }}
            >
              <Field name="orderId" label="Paid order number" />
              <Field name="amount" label="Refund amount (₹)" type="number" />
              <Field name="reason" label="Refund reason" />
              <Button type="submit" disabled={refundBusy}>
                Create refund request
              </Button>
            </form>
            {data.refunds.length ? (
              data.refunds.map((r) => (
                <div className="py-3 text-sm" key={r.id}>
                  <p>
                    {r.order_id} · ₹{r.amount} · {r.status} · {r.reason}
                  </p>
                  {r.status === "requested" ? (
                    <Button
                      disabled={refundBusy}
                      onClick={() => {
                        if (
                          confirm(
                            `Submit ₹${r.amount} refund to the payment provider?`,
                          )
                        )
                          void refundAction({ action: "process", id: r.id });
                      }}
                    >
                      Submit online refund
                    </Button>
                  ) : r.status === "processing" ? (
                    <Button
                      disabled={refundBusy}
                      onClick={() =>
                        void refundAction({ action: "reconcile", id: r.id })
                      }
                    >
                      Refresh provider status
                    </Button>
                  ) : null}
                </div>
              ))
            ) : (
              <p>No refund requests.</p>
            )}
          </Panel>
        </>
      ) : null}
      {tab === "Audit" ? (
        <Panel title="Audit history">
          {data.audit.map((a) => (
            <p className="border-b border-black/5 py-3 text-sm" key={a.id}>
              {new Date(a.created_at).toLocaleString()} · {a.actor} · {a.action}{" "}
              · {a.target}
            </p>
          ))}
        </Panel>
      ) : null}
      <Panel title="Order maintenance">
        <p className="mb-3 text-sm text-gray-500">
          Cancel orders left unaccepted for more than 45 minutes, restore stock,
          and queue refunds where needed.
        </p>
        <Button
          disabled={busy}
          onClick={async () => {
            if (
              !confirm(
                "Expire orders that have been waiting for restaurant acceptance for over 45 minutes?",
              )
            )
              return;
            try {
              const result = await requestApi("/api/admin/maintenance", {});
              setSaved(
                `Checked ${result.processed} expired orders. See audit history for completed cancellations.`,
              );
              await refresh();
            } catch (e) {
              setSaved((e as Error).message);
            }
          }}
        >
          Process timed-out orders
        </Button>
      </Panel>
      <div className="flex items-center gap-3">
        <Button disabled={!page} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <span>Page {page + 1} · Up to 100 records per section</span>
        <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
        <Button onClick={() => void refresh()}>Refresh</Button>
      </div>
    </div>
  );
}
