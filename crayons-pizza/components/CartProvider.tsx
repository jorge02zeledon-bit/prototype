"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Cart, addToCart, cartCount, cartLines, cartTotals, emptyCart, sanitizeCart, setQty } from "@/lib/cart";

const STORAGE_KEY = "crayons-pizza:cart";

type CartContextValue = {
  cart: Cart;
  count: number;
  lines: ReturnType<typeof cartLines>;
  totals: ReturnType<typeof cartTotals>;
  add: (id: string, delta?: number) => void;
  set: (id: string, qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCart(sanitizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")));
    } catch {
      /* storage unavailable: cart lives in memory */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart, hydrated]);

  const add = useCallback((id: string, delta = 1) => setCart((c) => addToCart(c, id, delta)), []);
  const set = useCallback((id: string, qty: number) => setCart((c) => setQty(c, id, qty)), []);
  const clear = useCallback(() => setCart(emptyCart()), []);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      count: cartCount(cart),
      lines: cartLines(cart),
      totals: cartTotals(cart),
      add,
      set,
      clear,
      isOpen,
      open,
      close,
      hydrated,
    }),
    [cart, add, set, clear, isOpen, open, close, hydrated],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
