"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps backend (server-rendered) pages live without a manual reload.
 *
 * Calls router.refresh() — which re-runs the server components and re-queries
 * Postgres — on a polling interval and whenever the tab regains focus. It does
 * NOT do a full page reload, so scroll position, open menus and form inputs are
 * preserved. Polling is paused while the tab is hidden to avoid needless load.
 *
 * Drop one instance in the dashboard layout so every backend page benefits.
 */
export default function AutoRefresh({
  intervalMs = 15000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  // Guard against overlapping refreshes if one is still in flight.
  const refreshing = useRef(false);

  useEffect(() => {
    const refresh = () => {
      if (refreshing.current || document.visibilityState !== "visible") return;
      refreshing.current = true;
      router.refresh();
      // router.refresh() has no completion promise; release the guard shortly
      // after so the next tick can fire.
      window.setTimeout(() => {
        refreshing.current = false;
      }, 1000);
    };

    const id = window.setInterval(refresh, intervalMs);

    // Refresh immediately when the admin returns to the tab.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [router, intervalMs]);

  return null;
}
