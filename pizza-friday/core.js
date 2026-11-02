/*
 * core.js — Pizza Friday pure logic: menu, cart math, order validation.
 * No DOM access here, so it runs in the browser and in node tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PizzaCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SLICE_PRICE_CENTS = 600; // $6 per slice, every flavor
  const MAX_PER_ITEM = 50;

  const MENU = [
    {
      id: 'cheese',
      name: 'Cheese',
      description: 'Hand-stretched dough, house tomato sauce, whole-milk mozzarella. The classic.',
      priceCents: SLICE_PRICE_CENTS,
      tags: ['Vegetarian'],
    },
    {
      id: 'pepperoni',
      name: 'Pepperoni',
      description: 'Our cheese slice topped with crisp-edged, cup-and-char pepperoni.',
      priceCents: SLICE_PRICE_CENTS,
      tags: ['Most popular'],
    },
  ];

  function menuItem(id) {
    return MENU.find((m) => m.id === id) || null;
  }

  function formatMoney(cents) {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(Math.round(cents));
    return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
  }

  // cart: { [itemId]: qty }
  function emptyCart() {
    return {};
  }

  function setQty(cart, id, qty) {
    if (!menuItem(id)) return { ...cart };
    const n = Math.max(0, Math.min(MAX_PER_ITEM, Math.floor(Number(qty) || 0)));
    const next = { ...cart };
    if (n === 0) delete next[id];
    else next[id] = n;
    return next;
  }

  function addToCart(cart, id, delta = 1) {
    return setQty(cart, id, (cart[id] || 0) + delta);
  }

  function cartLines(cart) {
    return MENU.filter((m) => cart[m.id] > 0).map((m) => ({
      id: m.id,
      name: m.name,
      qty: cart[m.id],
      unitCents: m.priceCents,
      lineCents: m.priceCents * cart[m.id],
    }));
  }

  function cartCount(cart) {
    return cartLines(cart).reduce((n, l) => n + l.qty, 0);
  }

  function cartTotals(cart) {
    const subtotalCents = cartLines(cart).reduce((n, l) => n + l.lineCents, 0);
    // Pizza Friday is a flat-price pop-up: price shown is price paid. No tax or fees added.
    return { subtotalCents, totalCents: subtotalCents };
  }

  function sanitizeCart(raw) {
    const cart = emptyCart();
    if (!raw || typeof raw !== 'object') return cart;
    return Object.keys(raw).reduce((c, id) => setQty(c, id, raw[id]), cart);
  }

  const PICKUP_SLOTS = ['11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'];

  function validateOrder(details, cart) {
    const errors = {};
    const name = String(details.name || '').trim();
    const phone = String(details.phone || '').trim();
    const slot = String(details.slot || '');
    if (cartCount(cart) === 0) errors.cart = 'Add at least one slice first.';
    if (name.length < 2) errors.name = 'Enter the name for the order.';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) errors.phone = 'Enter a 10-digit phone number so we can text you when it is ready.';
    if (!PICKUP_SLOTS.includes(slot)) errors.slot = 'Pick a pickup time.';
    return { ok: Object.keys(errors).length === 0, errors };
  }

  function orderNumber(seed) {
    // Short, human-readable: PF-XXXX. Deterministic when a seed is given (tests).
    const n = seed == null ? Math.floor(Math.random() * 9000) + 1000 : (Math.abs(seed) % 9000) + 1000;
    return `PF-${n}`;
  }

  function buildOrder(details, cart, opts = {}) {
    const v = validateOrder(details, cart);
    if (!v.ok) return { ok: false, errors: v.errors };
    const totals = cartTotals(cart);
    return {
      ok: true,
      order: {
        number: orderNumber(opts.seed),
        placedAt: opts.now || new Date().toISOString(),
        name: String(details.name).trim(),
        phone: String(details.phone).trim(),
        slot: details.slot,
        note: String(details.note || '').trim(),
        lines: cartLines(cart),
        ...totals,
      },
    };
  }

  return {
    SLICE_PRICE_CENTS,
    MAX_PER_ITEM,
    MENU,
    PICKUP_SLOTS,
    menuItem,
    formatMoney,
    emptyCart,
    setQty,
    addToCart,
    cartLines,
    cartCount,
    cartTotals,
    sanitizeCart,
    validateOrder,
    orderNumber,
    buildOrder,
  };
});
