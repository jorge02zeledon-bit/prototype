import test from "node:test";
import assert from "node:assert/strict";
import { addToCart, cartCount, cartLines, cartTotals, emptyCart, formatMoney, sanitizeCart, setQty } from "../lib/cart.ts";
import { MENU, MAX_QTY_PER_ITEM, SLICE_PRICE_CENTS } from "../lib/menu.ts";

test("menu is cheese and pepperoni at $6", () => {
  assert.deepEqual(MENU.map((m) => m.id), ["cheese", "pepperoni"]);
  for (const m of MENU) assert.equal(m.priceCents, SLICE_PRICE_CENTS);
  assert.equal(formatMoney(SLICE_PRICE_CENTS), "$6.00");
});

test("add, set, remove", () => {
  let cart = emptyCart();
  cart = addToCart(cart, "cheese");
  cart = addToCart(cart, "cheese");
  cart = addToCart(cart, "pepperoni", 3);
  assert.deepEqual(cart, { cheese: 2, pepperoni: 3 });
  assert.equal(cartCount(cart), 5);
  cart = addToCart(cart, "cheese", -2);
  assert.deepEqual(cart, { pepperoni: 3 });
  assert.deepEqual(setQty(cart, "pepperoni", 0), {});
});

test("unknown items are dropped and quantities are clamped", () => {
  assert.deepEqual(addToCart(emptyCart(), "anchovy"), {});
  assert.equal(setQty(emptyCart(), "cheese", 999).cheese, MAX_QTY_PER_ITEM);
  assert.equal(setQty(emptyCart(), "cheese", 2.9).cheese, 2);
  assert.deepEqual(setQty(emptyCart(), "cheese", -1), {});
  assert.deepEqual(sanitizeCart({ cheese: "3", pepperoni: -1, soda: 2, __proto__: { x: 1 } }), { cheese: 3 });
  assert.deepEqual(sanitizeCart("junk"), {});
});

test("totals are qty times price with nothing added", () => {
  const cart = { cheese: 2, pepperoni: 3 };
  assert.deepEqual(cartTotals(cart), { subtotalCents: 3000, totalCents: 3000 });
  assert.deepEqual(cartLines(cart).map((l) => [l.name, l.qty, l.lineCents]), [["Cheese", 2, 1200], ["Pepperoni", 3, 1800]]);
});
