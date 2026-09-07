"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginModal({
  onClose,
  mode,
  setMode,
}: {
  onClose: () => void;
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
  };

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fd = new FormData(event.currentTarget);
    if (mode === "register" && fd.get("password") !== fd.get("confirm")) {
      return setError("Those passwords don't match.");
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      // The session cookie is set; re-render server components so the header
      // and account page pick it up.
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Login" : "Create account"}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose()} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 text-gray-800 shadow-xl">
        <button
          type="button"
          onClick={() => onClose()}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 hover:text-brand"
        >
          ✕
        </button>

        <h2 className="font-serif text-2xl text-brand">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {mode === "login"
            ? "Log in to see your orders and check out faster."
            : "Track orders, reorder favourites and skip the address form next time."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "register" ? (
            <>
              <Field label="Full name" name="name" type="text" placeholder="Rosy Sahoo" autoComplete="name" />
              <Field label="Phone" name="phone" type="tel" placeholder="6370649364" autoComplete="tel" />
            </>
          ) : null}
          <Field label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : undefined}
          />
          {mode === "register" ? (
            <Field label="Confirm password" name="confirm" type="password" placeholder="••••••••" autoComplete="new-password" />
          ) : null}

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "PLEASE WAIT…" : mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" onClick={() => switchMode("register")} className="font-semibold text-brand hover:text-brand-light">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("login")} className="font-semibold text-brand hover:text-brand-light">
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </label>
  );
}
