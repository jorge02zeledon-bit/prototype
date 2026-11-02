const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');

test('menu is cheese and pepperoni at $6 a slice', () => {
  assert.deepEqual(C.MENU.map((m) => m.name), ['Cheese', 'Pepperoni']);
  for (const m of C.MENU) assert.equal(m.priceCents, 600);
  assert.equal(C.formatMoney(600), '$6.00');
});

test('add, set and remove quantities', () => {
  let cart = C.emptyCart();
  cart = C.addToCart(cart, 'cheese');
  cart = C.addToCart(cart, 'cheese');
  cart = C.addToCart(cart, 'pepperoni', 3);
  assert.deepEqual(cart, { cheese: 2, pepperoni: 3 });
  assert.equal(C.cartCount(cart), 5);
  cart = C.addToCart(cart, 'cheese', -2);
  assert.deepEqual(cart, { pepperoni: 3 });
  cart = C.setQty(cart, 'pepperoni', 0);
  assert.deepEqual(cart, {});
});

test('ignores unknown items, clamps to limits, floors fractions', () => {
  let cart = C.addToCart(C.emptyCart(), 'anchovy');
  assert.deepEqual(cart, {});
  cart = C.setQty(cart, 'cheese', 999);
  assert.equal(cart.cheese, C.MAX_PER_ITEM);
  cart = C.setQty(cart, 'cheese', 2.9);
  assert.equal(cart.cheese, 2);
  cart = C.setQty(cart, 'cheese', -4);
  assert.deepEqual(cart, {});
});

test('totals are qty times $6 with nothing added on', () => {
  const cart = { cheese: 2, pepperoni: 3 };
  const t = C.cartTotals(cart);
  assert.equal(t.subtotalCents, 3000);
  assert.equal(t.totalCents, 3000);
  assert.equal(C.formatMoney(t.totalCents), '$30.00');
  assert.deepEqual(C.cartTotals({}), { subtotalCents: 0, totalCents: 0 });
});

test('sanitizeCart repairs stored junk', () => {
  assert.deepEqual(C.sanitizeCart(null), {});
  assert.deepEqual(C.sanitizeCart('x'), {});
  assert.deepEqual(C.sanitizeCart({ cheese: '3', pepperoni: -1, soda: 2 }), { cheese: 3 });
});

test('validateOrder reports each problem', () => {
  const bad = C.validateOrder({ name: 'A', phone: '555', slot: 'noon' }, {});
  assert.equal(bad.ok, false);
  assert.deepEqual(Object.keys(bad.errors).sort(), ['cart', 'name', 'phone', 'slot']);
  const good = C.validateOrder({ name: 'Ana', phone: '(555) 123-4567', slot: C.PICKUP_SLOTS[0] }, { cheese: 1 });
  assert.equal(good.ok, true);
});

test('buildOrder snapshots lines and totals', () => {
  const r = C.buildOrder(
    { name: ' Ana ', phone: '5551234567', slot: '12:00 PM', note: 'extra napkins' },
    { cheese: 1, pepperoni: 2 },
    { seed: 42, now: '2026-11-06T18:00:00.000Z' }
  );
  assert.equal(r.ok, true);
  assert.equal(r.order.number, 'PF-1042');
  assert.equal(r.order.name, 'Ana');
  assert.equal(r.order.totalCents, 1800);
  assert.deepEqual(r.order.lines.map((l) => [l.name, l.qty]), [['Cheese', 1], ['Pepperoni', 2]]);
});
