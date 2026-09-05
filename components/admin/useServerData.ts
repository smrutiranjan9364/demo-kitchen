"use client";

import { useEffect, useState } from "react";

/**
 * Client-side list state that stays in sync with its server-rendered prop.
 *
 * Admin pages are server components that re-run on `router.refresh()` (see
 * AutoRefresh — every 15s and on tab focus) and pass fresh rows down. A plain
 * `useState(initial)` reads the prop only on first mount, so the table would
 * show stale data forever. This hook reconciles state whenever the server prop
 * changes, while still exposing a setter for optimistic add/edit/delete.
 */
export function useServerData<T>(serverData: T) {
  const [data, setData] = useState<T>(serverData);

  // `serverData` is a new reference each time the server component re-renders;
  // client-only re-renders (filters, pagination) keep the same reference, so
  // this only fires on an actual server refresh.
  useEffect(() => {
    setData(serverData);
  }, [serverData]);

  return [data, setData] as const;
}
