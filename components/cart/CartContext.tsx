"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import type { Product } from "@/data/products";
import { useLocalStorageState } from "@/components/useLocalStorageState";

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
const EMPTY_CART: CartLine[] = [];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useLocalStorageState(STORAGE_KEY, EMPTY_CART);

  const setQty = useCallback((product: Product, qty: number) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== product.id);
      if (qty > 0) next.push({ ...product, qty });
      return next;
    });
  }, [setLines]);

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
  }, [setLines]);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, [setLines]);

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
