"use client";
import { useCallback, useEffect, useState } from "react";
export async function requestApi(
  url: string,
  input?: Record<string, unknown>,
  method = "POST",
) {
  const res = await fetch(
    url,
    input
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }
      : { cache: "no-store" },
  );
  const data = await res
    .json()
    .catch(() => ({ error: "Invalid server response. Please try again." }));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
export function useRemote<T>(url: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const next = await requestApi(url);
      setData(next);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [url]);
  useEffect(() => {
    const controller = { active: true };
    void requestApi(url)
      .then((d) => {
        if (controller.active) setData(d);
      })
      .catch((e) => {
        if (controller.active) setError(e.message);
      });
    return () => {
      controller.active = false;
    };
  }, [url]);
  const act = async (input: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      await requestApi(url, input);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { data, error, busy, refresh, act };
}
export const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30";
export function Field({
  name,
  label,
  value,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-600">{label}</span>
      <input
        className={inputClass}
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={type === "password" ? 128 : 2000}
      />
    </label>
  );
}
export function Button({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-cream hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
export function Notice({
  error,
  loading,
}: {
  error?: string;
  loading?: boolean;
}) {
  if (error)
    return (
      <p
        role="alert"
        className="my-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
      >
        {error}
      </p>
    );
  if (loading)
    return (
      <p role="status" className="animate-pulse py-6 text-gray-500">
        Loading…
      </p>
    );
  return null;
}
export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-serif text-xl text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
export function formValues(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}
