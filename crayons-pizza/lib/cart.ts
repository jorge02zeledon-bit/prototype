import { MAX_QTY_PER_ITEM, MENU, findMenuItem } from "./menu.ts";

/** Cart shape stored in the browser: item id -> quantity. */
export type Cart = Record<string, number>;

export type CartLine = {
  id: string;
  name: string;
  qty: number;
  unitCents: number;
  lineCents: number;
};

export function emptyCart(): Cart {
  return {};
}

export function setQty(cart: Cart, id: string, qty: number): Cart {
  if (!findMenuItem(id)) return { ...cart };
  const n = Math.max(0, Math.min(MAX_QTY_PER_ITEM, Math.floor(Number(qty) || 0)));
  const next = { ...cart };
  if (n === 0) delete next[id];
  else next[id] = n;
  return next;
}

export function addToCart(cart: Cart, id: string, delta = 1): Cart {
  return setQty(cart, id, (cart[id] ?? 0) + delta);
}

/** Drops unknown ids and bad quantities. Used on anything read from storage or a request body. */
export function sanitizeCart(raw: unknown): Cart {
  if (!raw || typeof raw !== "object") return emptyCart();
  return Object.entries(raw as Record<string, unknown>).reduce(
    (c, [id, qty]) => setQty(c, id, Number(qty)),
    emptyCart(),
  );
}

export function cartLines(cart: Cart): CartLine[] {
  return MENU.filter((m) => (cart[m.id] ?? 0) > 0).map((m) => ({
    id: m.id,
    name: m.name,
    qty: cart[m.id],
    unitCents: m.priceCents,
    lineCents: m.priceCents * cart[m.id],
  }));
}

export function cartCount(cart: Cart): number {
  return cartLines(cart).reduce((n, l) => n + l.qty, 0);
}

/** Menu price is the price paid: no fees. Sales tax is left to the payment provider's tax settings. */
export function cartTotals(cart: Cart) {
  const subtotalCents = cartLines(cart).reduce((n, l) => n + l.lineCents, 0);
  return { subtotalCents, totalCents: subtotalCents };
}

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
