"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { SetStateAction } from "react";

const CHANGE_EVENT = "kitchen:storage-change";
// Keep updates usable when browser storage is unavailable or its quota is full.
const memory = new Map<string, string>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    // Both current consumers store arrays; ignore malformed stored values.
    if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;
    return value as T;
  } catch {
    return fallback;
  }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null) memory.clear();
    else memory.delete(event.key);
    notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

const serverSnapshot = () => null;

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const getSnapshot = useCallback(() => read(key), [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const value = useMemo(() => parse(raw, initialValue), [raw, initialValue]);

  const setValue = useCallback((update: SetStateAction<T>) => {
    const previous = parse(read(key), initialValue);
    const next = typeof update === "function"
      ? (update as (value: T) => T)(previous)
      : update;
    const serialized = JSON.stringify(next);
    memory.set(key, serialized);
    try {
      localStorage.setItem(key, serialized);
    } catch {
      // The memory snapshot still updates this tab.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [key, initialValue]);

  return [value, setValue] as const;
}
