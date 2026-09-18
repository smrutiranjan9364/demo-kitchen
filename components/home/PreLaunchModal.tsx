"use client";

import { useCallback, useEffect, useState } from "react";

// One visit per browser is enough — once a visitor signs up or dismisses the
// teaser, we remember it here so we never nag them again.
const STORAGE_KEY = "rk-prelaunch-v1";

type Phase = "hidden" | "form" | "done";

export default function PreLaunchModal() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const remember = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // Storage blocked (private mode) — worst case the teaser shows next visit.
    }
  }, []);

  const close = useCallback(() => {
    remember();
    setPhase("hidden");
  }, [remember]);

  // Decide once, on load, whether to open. A short delay lets the page paint
  // first so the teaser feels like it greets you, rather than blocking the load.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) != null;
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = setTimeout(() => setPhase("form"), 700);
    return () => clearTimeout(timer);
  }, []);

  // Fetch the running interest count once the teaser is on screen.
  useEffect(() => {
    if (phase === "hidden") return;
    let active = true;
    fetch("/api/interest")
      .then((r) => r.json())
      .then((d: { count?: number }) => {
        if (active && typeof d.count === "number") setCount(d.count);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [phase]);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (phase === "hidden") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [phase, close]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fd = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), name: fd.get("name") }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; count?: number };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (typeof data.count === "number") setCount(data.count);
      remember();
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "hidden") return null;

  const interested =
    count === null ? null : count === 1 ? "1 person is" : `${count.toLocaleString("en-IN")} people are`;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Launching soon"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={close} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white text-gray-800 shadow-xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-white/80 hover:text-white"
        >
          ✕
        </button>

        {/* Header band */}
        <div className="bg-brand px-6 pb-6 pt-7 text-center text-cream">
          <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-cream/80">COMING SOON</p>
          <h2 className="mt-1 font-serif text-2xl">We&rsquo;re about to launch 🎉</h2>
          <p className="mt-2 text-sm text-cream/90">
            Homemade Odia food, delivered fresh. Be first in line when we open.
          </p>
        </div>

        <div className="px-6 pb-6 pt-5">
          {phase === "form" ? (
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Name (optional)</span>
                <input
                  name="name"
                  type="text"
                  placeholder="Rosy Sahoo"
                  autoComplete="name"
                  className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </label>

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
                {busy ? "PLEASE WAIT…" : "COUNT ME IN"}
              </button>

              <p className="text-center text-sm text-gray-500" aria-live="polite">
                {interested ? (
                  <>
                    <span className="font-semibold text-brand">{interested}</span> waiting for the launch.
                  </>
                ) : (
                  "Join the people waiting for our launch."
                )}
              </p>
            </form>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-2xl">
                🙌
              </div>
              <h3 className="mt-3 font-serif text-xl text-brand">You&rsquo;re on the list!</h3>
              <p className="mt-1 text-sm text-gray-500" aria-live="polite">
                {interested ? (
                  <>
                    You&rsquo;ve joined <span className="font-semibold text-brand">{interested}</span> waiting for us to
                    open. We&rsquo;ll email you the moment we launch.
                  </>
                ) : (
                  "We'll email you the moment we launch."
                )}
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-5 w-full bg-brand py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
              >
                DONE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
