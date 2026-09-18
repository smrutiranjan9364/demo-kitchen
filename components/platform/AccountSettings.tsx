"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@/lib/orders";
import {
  Button,
  Field,
  Notice,
  Panel,
  formValues,
  inputClass,
  useRemote,
} from "./UI";
import EmailChallenge from "./EmailChallenge";
type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
};
type Data = {
  profile: {
    name: string;
    email: string;
    phone: string;
    verified_at: string | null;
  };
  addresses: Address[];
  favorites: { id: string; name: string; price: number }[];
  notifications: {
    id: string;
    title: string;
    href: string;
    read_at: string | null;
  }[];
  tickets: { id: string; subject: string; status: string; reply: string }[];
  coupons: {
    code: string;
    minimum: number;
    kind: string;
    value: number;
    used: boolean;
  }[];
};
export default function AccountSettings() {
  const router = useRouter();
  const { data, error, busy, act, refresh } = useRemote<Data>(
    "/api/account/manage",
  );
  const [edit, setEdit] = useState<Address | null>(null),
    [saved, setSaved] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setSaved("");
    if (await act({ ...formValues(e.currentTarget), action })) {
      setSaved("Saved successfully.");
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
  return (
    <div className="space-y-6">
      <Notice error={error} />
      {saved ? (
        <p role="status" className="text-rating">
          {saved}
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Your profile">
          <form onSubmit={(e) => submit(e, "profile")} className="space-y-3">
            <Field name="name" label="Name" value={data.profile.name} />
            <Field name="phone" label="Phone" value={data.profile.phone} />
            <p className="text-sm text-gray-500">{data.profile.email}</p>
            <Button type="submit" disabled={busy}>
              Save profile
            </Button>
          </form>
        </Panel>
        <Panel title="Email verification">
          {data.profile.verified_at ? (
            <p className="text-rating">Your email is verified.</p>
          ) : (
            <EmailChallenge purpose="verify" email={data.profile.email} />
          )}
          <Link
            href="/account/recovery"
            className="mt-4 block text-sm text-brand underline"
          >
            Change or reset password
          </Link>
        </Panel>
      </div>
      <Panel title="Saved addresses">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {data.addresses.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-black/10 p-3 text-sm"
            >
              <strong>
                {a.label} · {a.name}
              </strong>
              <p>
                {a.address}, {a.city}, {a.state} {a.pincode}
              </p>
              <p>{a.landmark}</p>
              <div className="mt-2 flex gap-3">
                <button
                  className="text-brand underline"
                  onClick={() => setEdit(a)}
                >
                  Edit
                </button>
                <button
                  className="text-red-700 underline"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Delete this saved address?"))
                      void act({ action: "delete-address", id: a.id });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <form
          key={edit?.id ?? "new"}
          onSubmit={(e) => submit(e, "address")}
          className="grid gap-3 sm:grid-cols-2"
        >
          {edit ? <input type="hidden" name="id" value={edit.id} /> : null}
          <label className="text-sm">
            Label
            <select
              name="label"
              defaultValue={edit?.label ?? "Home"}
              className={inputClass}
            >
              {["Home", "Work", "Other"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {(
            ["name", "phone", "address", "city", "pincode", "landmark"] as const
          ).map((n) => (
            <Field
              key={n}
              name={n}
              label={n.charAt(0).toUpperCase() + n.slice(1)}
              value={
                edit?.[n] ??
                (n === "name"
                  ? data.profile.name
                  : n === "phone"
                    ? data.profile.phone
                    : "")
              }
              required={n !== "landmark"}
            />
          ))}
          <label className="text-sm">
            State
            <select
              className={inputClass}
              name="state"
              defaultValue={edit?.state ?? "Odisha"}
            >
              {INDIAN_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={busy}>
            {edit ? "Update address" : "Add address"}
          </Button>
          {edit ? (
            <Button onClick={() => setEdit(null)}>Cancel edit</Button>
          ) : null}
        </form>
      </Panel>
      <Panel title="Favorites">
        {data.favorites.length ? (
          data.favorites.map((p) => (
            <div
              className="flex items-center justify-between border-b border-black/5 py-3"
              key={p.id}
            >
              <Link className="text-brand" href={`/product/${p.id}`}>
                {p.name} · ₹{p.price}
              </Link>
              <button
                disabled={busy}
                onClick={() =>
                  void act({
                    action: "favorite",
                    productId: p.id,
                    remove: true,
                  })
                }
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            Save a food item from its product page to find it here.
          </p>
        )}
      </Panel>
      <Panel title="Your offers">
        {data.coupons.length ? (
          data.coupons.map((c) => (
            <p key={c.code} className="py-2 text-sm">
              <strong>{c.code}</strong> ·{" "}
              {c.kind === "delivery"
                ? "Free delivery"
                : c.kind === "percent"
                  ? `${c.value}% off`
                  : `₹${c.value} off`}{" "}
              · Minimum ₹{c.minimum}
              {c.used ? " · Already used" : ""}
            </p>
          ))
        ) : (
          <p className="text-sm text-gray-500">No active offers right now.</p>
        )}
      </Panel>
      <Panel title="Notifications">
        <Button
          disabled={busy}
          onClick={() => void act({ action: "read-notifications" })}
        >
          Mark all as read
        </Button>
        {data.notifications.length ? (
          data.notifications.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`block border-b border-black/5 py-3 text-sm ${n.read_at ? "text-gray-500" : "font-semibold text-brand"}`}
            >
              {n.title}
            </Link>
          ))
        ) : (
          <p className="mt-3 text-sm text-gray-500">You are all caught up.</p>
        )}
      </Panel>
      <Panel title="Help & support">
        <form onSubmit={(e) => submit(e, "ticket")} className="space-y-3">
          <Field
            name="orderId"
            label="Order number (optional)"
            required={false}
          />
          <Field
            name="subject"
            label="Issue (payment, missing item, delivery, refund…)"
          />
          <label className="block text-sm">
            Tell us what happened
            <textarea
              className={inputClass}
              name="message"
              required
              maxLength={3000}
              rows={4}
            />
          </label>
          <Button type="submit" disabled={busy}>
            Create support ticket
          </Button>
        </form>
        <div className="mt-5 space-y-3">
          {data.tickets.map((t) => (
            <div key={t.id} className="rounded-lg bg-cream-soft p-3 text-sm">
              <strong>{t.subject}</strong>
              <p>
                {t.status} · Reference {t.id}
              </p>
              {t.reply ? <p className="mt-2">Support: {t.reply}</p> : null}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Partner with us">
        <div className="flex flex-wrap gap-4 text-brand underline">
          <Link href="/partner/restaurant">Restaurant dashboard / Apply</Link>
          <Link href="/partner/rider">Delivery partner dashboard / Apply</Link>
        </div>
      </Panel>
      <Panel title="Close account">
        <p className="mb-3 text-sm text-gray-500">
          Closes access and removes your saved addresses and favorites. Order
          and financial records remain for business recordkeeping.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              confirm(
                "Close your account? You will be signed out and lose access.",
              )
            ) {
              if (
                await act({
                  action: "delete-account",
                  ...formValues(e.currentTarget),
                })
              ) {
                router.push("/");
                router.refresh();
              }
            }
          }}
          className="space-y-3"
        >
          <Field name="password" label="Confirm password" type="password" />
          <Button type="submit" disabled={busy}>
            Close account
          </Button>
        </form>
      </Panel>
    </div>
  );
}
