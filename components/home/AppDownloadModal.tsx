"use client";

import { useCallback, useEffect, useState } from "react";
import { APP_STORES } from "@/data/site";

// Show the "get the app" greeting once per browsing session, so it appears when
// a visitor opens the site but doesn't nag on every internal navigation. Switch
// sessionStorage -> localStorage below to only ever show it once per browser.
const STORAGE_KEY = "rk-app-modal-v1";

export default function AppDownloadModal() {
  const [open, setOpen] = useState(false);
  const { playStore, appStore } = APP_STORES;
  const hasLinks = Boolean(playStore || appStore);

  const remember = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // Storage blocked (private mode) — worst case it shows again next visit.
    }
  }, []);

  const close = useCallback(() => {
    remember();
    setOpen(false);
  }, [remember]);

  // Decide once, on load, whether to open. A short delay lets the page paint
  // first so the modal feels like a greeting rather than a load blocker.
  useEffect(() => {
    if (!hasLinks) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) != null;
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [hasLinks]);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
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
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Get the Odia Kitchen app"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={close} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white text-gray-800 shadow-xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-cream/80 hover:text-white"
        >
          ✕
        </button>

        {/* Header band */}
        <div className="bg-brand px-6 pb-7 pt-7 text-center text-cream">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            🍛
          </div>
          <p className="mt-3 text-[0.65rem] font-semibold tracking-[0.25em] text-cream/80">
            NOW ON MOBILE
          </p>
          <h2 className="mt-1 font-serif text-2xl">Get the Odia Kitchen app</h2>
          <p className="mt-2 text-sm text-cream/90">
            Order faster, track deliveries live, and never miss a festival special.
          </p>
        </div>

        {/* Badges */}
        <div className="px-6 pb-6 pt-5">
          <div className="flex flex-col gap-3">
            {appStore ? (
              <a
                href={appStore}
                target="_blank"
                rel="noopener noreferrer"
                onClick={remember}
                aria-label="Download on the App Store"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-black px-5 py-3 text-white transition hover:bg-black/85"
              >
                <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.5 12.7c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.7 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.1 1.4-.6 2.6-.6s1.6.6 2.7.6 1.8-1 2.4-2c.8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.2ZM14.6 6.4c.6-.7 1-1.6.9-2.5-.8 0-1.8.5-2.4 1.2-.5.6-1 1.5-.9 2.4.9.1 1.8-.4 2.4-1.1Z" />
                </svg>
                <span className="text-left leading-none">
                  <span className="block text-[10px] tracking-wide text-white/70">Download on the</span>
                  <span className="block text-lg font-semibold">App Store</span>
                </span>
              </a>
            ) : null}

            {playStore ? (
              <a
                href={playStore}
                target="_blank"
                rel="noopener noreferrer"
                onClick={remember}
                aria-label="Get it on Google Play"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-black px-5 py-3 text-white transition hover:bg-black/85"
              >
                <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.6 2.3c-.3.3-.5.7-.5 1.3v16.8c0 .6.2 1 .5 1.3l.1.1L13 12.6v-.2L3.7 2.2l-.1.1Z" fill="#00D0FF" />
                  <path d="m16.3 15.8-3.3-3.2v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-4 2.1Z" fill="#FFC800" />
                  <path d="m16.4 15.7-3.4-3.4L3.6 21.7c.4.4 1 .4 1.7 0l11.1-6" fill="#FF3D44" />
                  <path d="M5.3 2.3c-.7-.4-1.3-.4-1.7 0L13 12l3.4-3.4L5.3 2.3Z" fill="#00F076" />
                </svg>
                <span className="text-left leading-none">
                  <span className="block text-[10px] tracking-wide text-white/70">GET IT ON</span>
                  <span className="block text-lg font-semibold">Google Play</span>
                </span>
              </a>
            ) : null}
          </div>

          <button
            type="button"
            onClick={close}
            className="mt-4 w-full py-2 text-xs font-semibold tracking-widest text-gray-500 transition hover:text-brand"
          >
            MAYBE LATER
          </button>
        </div>
      </div>
    </div>
  );
}
