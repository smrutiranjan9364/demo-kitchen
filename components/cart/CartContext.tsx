"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Product } from "@/data/products";

export type CartLine = Product & { qty: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  qtyOf: (id: string) => number;
  add: (product: Product) => void;
  setQty: (product: Product, qty: number) => void;
  remove: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rk_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const setQty = useCallback((product: Product, qty: number) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== product.id);
      if (qty > 0) next.push({ ...product, qty });
      return next;
    });
  }, []);

  const add = useCallback((product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const qtyOf = useCallback(
    (id: string) => lines.find((l) => l.id === id)?.qty ?? 0,
    [lines],
  );

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const value = useMemo(
    () => ({ lines, count, qtyOf, add, setQty, remove }),
    [lines, count, qtyOf, add, setQty, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
