"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function getInstallState() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const ios = /ipad|iphone|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
    !("MSStream" in window);
  let dismissed = false;
  try {
    dismissed = localStorage.getItem("pwa-install-dismissed") === "1";
  } catch {
    // The prompt also keeps dismissal state in memory.
  }
  return (standalone ? 1 : 0) | (ios ? 2 : 0) | (dismissed ? 4 : 0);
}

function subscribeInstallState(notify: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", notify);
  window.addEventListener("storage", notify);
  window.addEventListener("appinstalled", notify);
  return () => {
    displayMode.removeEventListener("change", notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("appinstalled", notify);
  };
}

const serverInstallState = () => 0;

export default function PWA() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const installState = useSyncExternalStore(subscribeInstallState, getInstallState, serverInstallState);
  const isStandalone = Boolean(installState & 1);
  const isIOS = Boolean(installState & 2);
  const [dismissed, setDismissed] = useState(false);

  // Register the service worker.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("SW registration failed:", err));
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Detect install state and capture the install prompt.
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("pwa-install-dismissed", "1");
    } catch {}
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  // Nothing to show if already installed, dismissed, or no prompt available.
  if (isStandalone || dismissed || Boolean(installState & 4)) return null;
  if (!installEvent && !isIOS) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-[#6d2440]/15 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <Image
          src="/icon-192.png"
          alt="Rosy's Kitchen"
          width={44}
          height={44}
          className="h-11 w-11 flex-shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#4f1a2e]">
            Install Rosy&apos;s Kitchen
          </p>
          {isIOS && !installEvent ? (
            <p className="mt-0.5 text-xs leading-snug text-neutral-600">
              Tap the Share icon, then{" "}
              <span className="font-medium">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-snug text-neutral-600">
              Add our app to your home screen for a faster, app-like experience.
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={dismiss}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
        >
          Not now
        </button>
        {installEvent && (
          <button
            onClick={install}
            className="rounded-lg bg-[#6d2440] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4f1a2e]"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
