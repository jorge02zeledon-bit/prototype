import { MAX_QTY_PER_ITEM, MENU, findProduct, type ProductKind } from "./menu.ts";

/** Cart shape stored in the browser: product id -> quantity. */
export type Cart = Record<string, number>;

export type CartLine = {
  id: string;
  kind: ProductKind;
  name: string;
  qty: number;
  unitCents: number;
  lineCents: number;
  /** Present on subscription lines. */
  billing?: { interval: "week" | "month"; intervalCount: number; label: string };
};

export function emptyCart(): Cart {
  return {};
}

export function setQty(cart: Cart, id: string, qty: number): Cart {
  if (!findProduct(id)) return { ...cart };
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
    kind: m.kind,
    name: m.name,
    qty: cart[m.id],
    unitCents: m.priceCents,
    lineCents: m.priceCents * cart[m.id],
    ...(m.billing ? { billing: m.billing } : {}),
  }));
}

export function cartCount(cart: Cart): number {
  return cartLines(cart).reduce((n, l) => n + l.qty, 0);
}

export function hasSubscription(cart: Cart): boolean {
  return cartLines(cart).some((l) => l.kind === "subscription");
}

/**
 * Menu price is the price paid: no fees. `totalCents` is what is charged
 * today; `recurringCents` is what a subscription charges every cycle.
 */
export function cartTotals(cart: Cart) {
  const lines = cartLines(cart);
  const oneOffCents = lines.filter((l) => l.kind === "one-off").reduce((n, l) => n + l.lineCents, 0);
  const recurringCents = lines.filter((l) => l.kind === "subscription").reduce((n, l) => n + l.lineCents, 0);
  return { oneOffCents, recurringCents, subtotalCents: oneOffCents + recurringCents, totalCents: oneOffCents + recurringCents };
}

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
