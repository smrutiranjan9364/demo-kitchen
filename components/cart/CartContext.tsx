"use client";
import { createContext, useContext, useCallback, useMemo } from "react";
import { MAX_QTY } from "@/lib/orders";
import { cartKey } from "@/lib/menu";
import { isSoldOut, type Product } from "@/data/products";
import { useLocalStorageState } from "@/components/useLocalStorageState";
export type CartLine = Product & { qty: number };
type CartContextValue = {
  lines: CartLine[];
  count: number;
  qtyOf: (id: string) => number;
  add: (product: Product) => boolean;
  setQty: (product: Product, qty: number) => boolean;
  addMany: (entries: { product: Product; qty: number }[]) => boolean;
  remove: (key: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const EMPTY_CART: CartLine[] = [];
function selection(product: Product): Product {
  const variant = product.variants?.find(
    (v) => v.id === (product.variantId ?? product.variants?.[0]?.id),
  );
  const extras = (product.addons ?? []).filter((a) =>
    product.addonIds?.includes(a.id),
  );
  const basePrice = product.basePrice ?? product.price;
  return {
    ...product,
    basePrice,
    variantId: variant?.id,
    addonIds: extras.map((a) => a.id).sort(),
    price:
      basePrice +
      (variant?.price ?? 0) +
      extras.reduce((n, a) => n + a.price, 0),
  };
}
function update(prev: CartLine[], product: Product, qty: number) {
  const key = cartKey(product),
    other = prev.filter((l) => cartKey(l) !== key);
  const used = other
    .filter((l) => l.id === product.id)
    .reduce((n, l) => n + l.qty, 0);
  const allowed = isSoldOut(product)
    ? 0
    : Math.max(0, Math.min(MAX_QTY, product.stock ?? MAX_QTY) - used);
  const nextQty = Math.max(0, Math.min(Math.floor(qty), allowed));
  return nextQty ? [...other, { ...product, qty: nextQty }] : other;
}
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useLocalStorageState("rk_cart", EMPTY_CART);
  const switchRestaurant = useCallback(
    (product: Product) =>
      lines.some(
        (l) =>
          (l.restaurantId ?? "odia-kitchen") !==
          (product.restaurantId ?? "odia-kitchen"),
      ),
    [lines],
  );
  const setQty = useCallback(
    (raw: Product, qty: number) => {
      const product = selection(raw),
        replace = qty > 0 && switchRestaurant(product);
      if (
        replace &&
        !window.confirm(
          "Your cart contains another restaurant. Clear it and add this food?",
        )
      )
        return false;
      setLines((prev) => update(replace ? [] : prev, product, qty));
      return true;
    },
    [setLines, switchRestaurant],
  );
  const add = useCallback(
    (raw: Product) => {
      const product = selection(raw),
        replace = switchRestaurant(product);
      if (
        replace &&
        !window.confirm(
          "Your cart contains another restaurant. Clear it and add this food?",
        )
      )
        return false;
      setLines((prev) => {
        const current = replace ? [] : prev;
        return update(
          current,
          product,
          (current.find((l) => cartKey(l) === cartKey(product))?.qty ?? 0) + 1,
        );
      });
      return true;
    },
    [setLines, switchRestaurant],
  );
  const addMany = useCallback(
    (entries: { product: Product; qty: number }[]) => {
      if (!entries.length) return false;
      const replace = switchRestaurant(entries[0].product);
      if (
        replace &&
        !window.confirm("Replace your cart with this restaurant’s food?")
      )
        return false;
      setLines((prev) =>
        entries.reduce(
          (current, e) => {
            const p = selection(e.product);
            return update(
              current,
              p,
              (current.find((l) => cartKey(l) === cartKey(p))?.qty ?? 0) +
                e.qty,
            );
          },
          replace ? [] : prev,
        ),
      );
      return true;
    },
    [setLines, switchRestaurant],
  );
  const remove = useCallback(
    (key: string) => setLines((prev) => prev.filter((l) => cartKey(l) !== key)),
    [setLines],
  );
  const clear = useCallback(() => setLines(EMPTY_CART), [setLines]);
  const qtyOf = useCallback(
    (id: string) =>
      lines.filter((l) => l.id === id).reduce((n, l) => n + l.qty, 0),
    [lines],
  );
  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const value = useMemo(
    () => ({ lines, count, qtyOf, add, setQty, addMany, remove, clear }),
    [lines, count, qtyOf, add, setQty, addMany, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be inside CartProvider");
  return value;
}
