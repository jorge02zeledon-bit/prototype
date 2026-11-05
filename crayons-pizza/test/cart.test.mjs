import test from "node:test";
import assert from "node:assert/strict";
import { addToCart, cartCount, cartLines, cartTotals, emptyCart, formatMoney, hasSubscription, sanitizeCart, setQty } from "../lib/cart.ts";
import { MENU, MAX_QTY_PER_ITEM, SLICE_PRICE_CENTS, SUBSCRIPTION_PRICE_CENTS } from "../lib/menu.ts";

test("two products: one-off $6 and subscription $24", () => {
  assert.deepEqual(MENU.map((m) => [m.id, m.kind]), [["cheese", "one-off"], ["friday-club", "subscription"]]);
  assert.equal(SLICE_PRICE_CENTS, 600);
  assert.equal(SUBSCRIPTION_PRICE_CENTS, 2400);
  assert.equal(formatMoney(2400), "$24.00");
});

test("add, set, remove", () => {
  let cart = emptyCart();
  cart = addToCart(cart, "cheese");
  cart = addToCart(cart, "cheese", 3);
  cart = addToCart(cart, "friday-club");
  assert.deepEqual(cart, { cheese: 4, "friday-club": 1 });
  assert.equal(cartCount(cart), 5);
  assert.equal(hasSubscription(cart), true);
  cart = addToCart(cart, "cheese", -4);
  assert.deepEqual(cart, { "friday-club": 1 });
  assert.deepEqual(setQty(cart, "friday-club", 0), {});
  assert.equal(hasSubscription({}), false);
});

test("unknown items are dropped and quantities are clamped", () => {
  assert.deepEqual(addToCart(emptyCart(), "anchovy"), {});
  assert.equal(setQty(emptyCart(), "cheese", 999).cheese, MAX_QTY_PER_ITEM);
  assert.equal(setQty(emptyCart(), "cheese", 2.9).cheese, 2);
  assert.deepEqual(setQty(emptyCart(), "cheese", -1), {});
  assert.deepEqual(sanitizeCart({ cheese: "3", pepperoni: 2, soda: 2, __proto__: { x: 1 } }), { cheese: 3 });
  assert.deepEqual(sanitizeCart("junk"), {});
});

test("totals split one-off from recurring", () => {
  const cart = { cheese: 2, "friday-club": 1 };
  assert.deepEqual(cartTotals(cart), { oneOffCents: 1200, recurringCents: 2400, subtotalCents: 3600, totalCents: 3600 });
  const lines = cartLines(cart);
  assert.deepEqual(lines.map((l) => [l.kind, l.qty, l.lineCents]), [["one-off", 2, 1200], ["subscription", 1, 2400]]);
  assert.equal(lines[1].billing.label, "every 4 weeks");
  assert.equal(lines[0].billing, undefined);
});
