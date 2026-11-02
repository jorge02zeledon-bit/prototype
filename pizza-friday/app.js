/* app.js — Pizza Friday UI. Depends on core.js (window.PizzaCore). */
(function () {
  'use strict';
  const C = window.PizzaCore;
  const STORAGE_KEY = 'pizza-friday:cart';
  const $ = (sel, root = document) => root.querySelector(sel);

  // ---------- state ----------
  let cart = loadCart();
  let view = 'cart'; // 'cart' | 'checkout' | 'done'
  let lastOrder = null;
  let formErrors = {};
  let formValues = { name: '', phone: '', slot: '', note: '' };
  let lastFocus = null;

  function loadCart() {
    try { return C.sanitizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); }
    catch { return C.emptyCart(); }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* storage unavailable: cart lives in memory */ }
  }
  function setCart(next, { announce } = {}) {
    cart = next;
    saveCart();
    renderMenu();
    renderCartButton(true);
    renderCart();
    if (announce) toast(announce);
  }

  // ---------- helpers ----------
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, v);
    }
    for (const ch of children.flat()) if (ch != null) node.append(ch);
    return node;
  }
  function toast(msg) {
    const region = $('#toast-region');
    const t = el('div', { class: 'toast', text: msg });
    region.append(t);
    setTimeout(() => t.remove(), 2200);
  }
  function sliceArt(id) {
    const pep = id === 'pepperoni'
      ? '<g fill="var(--pep)"><circle cx="100" cy="92" r="11"/><circle cx="76" cy="124" r="11"/><circle cx="124" cy="128" r="11"/><circle cx="100" cy="158" r="10"/></g>'
      : '';
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 10 190 190H10Z" fill="var(--crust)"/><path d="M100 28 174 180H26Z" fill="var(--sauce)"/><path d="M100 42 160 172H40Z" fill="var(--cheese)"/>${pep}</svg>`;
  }
  function stepper(id, qty, { max = C.MAX_PER_ITEM, label }) {
    const dec = el('button', { type: 'button', 'aria-label': `Remove one ${label} slice`, disabled: qty === 0, onclick: () => setCart(C.addToCart(cart, id, -1)) }, '−');
    const inc = el('button', { type: 'button', 'aria-label': `Add one ${label} slice`, disabled: qty >= max, onclick: () => setCart(C.addToCart(cart, id, 1)) }, '+');
    const input = el('input', {
      type: 'number', inputmode: 'numeric', min: '0', max: String(max), value: String(qty),
      'aria-label': `${label} slices`,
      onchange: (e) => setCart(C.setQty(cart, id, e.target.value)),
    });
    return el('div', { class: 'stepper' }, dec, input, inc);
  }

  // ---------- menu ----------
  function renderMenu() {
    const grid = $('#menu-grid');
    grid.replaceChildren(...C.MENU.map((m) => {
      const qty = cart[m.id] || 0;
      const foot = qty === 0
        ? el('button', { class: 'btn btn-primary', type: 'button', onclick: () => setCart(C.addToCart(cart, m.id, 1), { announce: `${m.name} slice added` }) }, 'Add slice')
        : el('div', { class: 'card-foot', style: 'width:100%' }, stepper(m.id, qty, { label: m.name }), el('span', { class: 'in-cart', text: `${qty} in cart · ${C.formatMoney(qty * m.priceCents)}` }));
      return el('article', { class: 'card', 'aria-labelledby': `item-${m.id}` },
        el('div', { class: 'card-art', html: sliceArt(m.id) }),
        el('div', { class: 'card-body' },
          el('div', { class: 'card-title' },
            el('h3', { id: `item-${m.id}`, text: m.name }),
            el('div', { class: 'price', html: `${C.formatMoney(m.priceCents)}<small>/ slice</small>` })),
          el('div', { class: 'tags' }, m.tags.map((t) => el('span', { class: 'tag', text: t }))),
          el('p', { text: m.description }),
          el('div', { class: 'card-foot' }, foot)));
    }));
  }

  // ---------- cart button ----------
  function renderCartButton(bump) {
    const n = C.cartCount(cart);
    const badge = $('#cart-count');
    badge.textContent = String(n);
    badge.setAttribute('aria-label', `${n} slice${n === 1 ? '' : 's'} in cart`);
    if (bump) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
  }

  // ---------- drawer ----------
  function openCart(nextView) {
    if (nextView) view = nextView;
    lastFocus = document.activeElement;
    $('#cart').hidden = false;
    $('#scrim').hidden = false;
    $('#cart-btn').setAttribute('aria-expanded', 'true');
    document.body.classList.add('cart-open');
    renderCart();
    $('#cart-close').focus();
  }
  function closeCart() {
    $('#cart').hidden = true;
    $('#scrim').hidden = true;
    $('#cart-btn').setAttribute('aria-expanded', 'false');
    document.body.classList.remove('cart-open');
    if (view === 'done') view = 'cart';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderCart() {
    const body = $('#cart-body');
    const title = $('#cart-title');
    if (view === 'done' && lastOrder) { title.textContent = 'Order placed'; body.replaceChildren(renderConfirmation()); return; }
    const lines = C.cartLines(cart);
    if (lines.length === 0) {
      view = 'cart';
      title.textContent = 'Your order';
      body.replaceChildren(el('div', { class: 'empty' },
        el('div', { html: sliceArt('pepperoni') }),
        el('p', { text: 'Nothing in the box yet.' }),
        el('button', { class: 'btn btn-primary', type: 'button', onclick: () => { closeCart(); $('#menu').scrollIntoView(); } }, 'See the menu')));
      return;
    }
    title.textContent = view === 'checkout' ? 'Checkout' : 'Your order';
    body.replaceChildren(renderLines(lines), renderTotals(), view === 'checkout' ? renderForm() : renderCartActions());
  }

  function renderLines(lines) {
    return el('ul', { class: 'lines' }, lines.map((l) =>
      el('li', { class: 'line' },
        el('div', null, el('div', { class: 'line-name', text: `${l.name} slice` }), el('div', { class: 'line-unit', text: `${C.formatMoney(l.unitCents)} each` })),
        el('div', { class: 'line-total', text: C.formatMoney(l.lineCents) }),
        stepper(l.id, l.qty, { label: l.name }),
        el('button', { class: 'btn-link', type: 'button', onclick: () => setCart(C.setQty(cart, l.id, 0), { announce: `${l.name} removed` }) }, 'Remove'))));
  }
  function renderTotals() {
    const t = C.cartTotals(cart);
    const n = C.cartCount(cart);
    return el('div', { class: 'totals' },
      el('div', null, el('span', { text: `${n} slice${n === 1 ? '' : 's'}` }), el('span', { text: C.formatMoney(t.subtotalCents) })),
      el('div', { class: 'grand' }, el('span', { text: 'Total' }), el('span', { text: C.formatMoney(t.totalCents) })),
      el('p', { class: 'note', text: 'No tax or fees added. Pay at pickup.' }));
  }
  function renderCartActions() {
    return el('div', { class: 'form-actions' },
      el('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: () => { view = 'checkout'; formErrors = {}; renderCart(); $('#f-name').focus(); } }, 'Check out'),
      el('button', { class: 'btn btn-ghost btn-block', type: 'button', onclick: closeCart }, 'Keep ordering'));
  }

  // ---------- checkout ----------
  function field(id, label, control, hint) {
    const err = formErrors[id];
    return el('div', { class: `field${err ? ' invalid' : ''}` },
      el('label', { for: `f-${id}`, text: label }),
      control,
      hint && !err ? el('div', { class: 'hint', text: hint }) : null,
      err ? el('div', { class: 'err', id: `err-${id}`, role: 'alert', text: err }) : null);
  }
  function bind(id, extra = {}) {
    return {
      id: `f-${id}`, name: id, value: formValues[id],
      'aria-invalid': formErrors[id] ? 'true' : null,
      'aria-describedby': formErrors[id] ? `err-${id}` : null,
      oninput: (e) => { formValues[id] = e.target.value; clearError(id, e.target); },
      ...extra,
    };
  }
  function clearError(id, control) {
    if (!formErrors[id]) return;
    delete formErrors[id];
    const wrap = control.closest('.field');
    if (wrap) { wrap.classList.remove('invalid'); wrap.querySelector('.err')?.remove(); }
    control.removeAttribute('aria-invalid');
    control.removeAttribute('aria-describedby');
  }
  function renderForm() {
    const slot = el('select', bind('slot', { onchange: (e) => { formValues.slot = e.target.value; clearError('slot', e.target); } }),
      el('option', { value: '', text: 'Choose a time…' }),
      ...C.PICKUP_SLOTS.map((s) => el('option', { value: s, text: s, selected: formValues.slot === s })));
    const form = el('form', { class: 'form', novalidate: true, onsubmit: onSubmit },
      el('h3', { text: 'Pickup details' }),
      field('name', 'Name for the order', el('input', bind('name', { type: 'text', autocomplete: 'name', required: true }))),
      field('phone', 'Mobile number', el('input', bind('phone', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', placeholder: '(555) 123-4567', required: true })), 'We text you when the box is ready.'),
      field('slot', 'Pickup time (this Friday)', slot),
      field('note', 'Anything else?', el('textarea', bind('note', { rows: 2, placeholder: 'Well done, extra napkins…' }))),
      el('div', { class: 'form-actions' },
        el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, `Place order · ${C.formatMoney(C.cartTotals(cart).totalCents)}`),
        el('button', { class: 'btn btn-ghost btn-block', type: 'button', onclick: () => { view = 'cart'; renderCart(); } }, 'Back to cart')));
    return form;
  }
  function onSubmit(e) {
    e.preventDefault();
    const r = C.buildOrder(formValues, cart);
    if (!r.ok) {
      formErrors = r.errors;
      renderCart();
      const first = $('.field.invalid input, .field.invalid select');
      if (first) first.focus();
      if (r.errors.cart) toast(r.errors.cart);
      return;
    }
    lastOrder = r.order;
    formErrors = {};
    try { localStorage.setItem('pizza-friday:last-order', JSON.stringify(lastOrder)); } catch { /* ignore */ }
    cart = C.emptyCart();
    saveCart();
    formValues = { name: '', phone: '', slot: '', note: '' };
    view = 'done';
    renderMenu();
    renderCartButton(true);
    renderCart();
    $('#cart-title').focus?.();
  }

  function renderConfirmation() {
    const o = lastOrder;
    return el('div', { class: 'confirm' },
      el('div', { class: 'check', html: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>' }),
      el('p', null, 'Thanks, ', el('strong', { text: o.name }), `. Your slices will be ready at `, el('strong', { text: o.slot }), ' this Friday at the side door, 118 Elm St.'),
      el('div', { class: 'big', text: o.number }),
      el('p', { class: 'hint', text: `Show this number at the window. We'll text ${o.phone} when it's ready.` }),
      el('div', { class: 'box' },
        ...o.lines.map((l) => el('div', null, el('span', { text: `${l.qty} × ${l.name} slice` }), el('span', { text: C.formatMoney(l.lineCents) }))),
        el('div', { style: 'font-weight:700' }, el('span', { text: 'Due at pickup' }), el('span', { text: C.formatMoney(o.totalCents) }))),
      o.note ? el('p', { class: 'hint', text: `Note: ${o.note}` }) : null,
      el('p', { class: 'hint', text: 'Demo storefront: this order is saved only in your browser and no payment was taken.' }),
      el('div', { class: 'form-actions' },
        el('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: () => { view = 'cart'; closeCart(); $('#menu').scrollIntoView(); } }, 'Order more')));
  }

  // ---------- wiring ----------
  $('#cart-btn').addEventListener('click', () => openCart());
  $('#cart-close').addEventListener('click', closeCart);
  $('#scrim').addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#cart').hidden) closeCart(); });
  // Keep keyboard focus inside the drawer while it is open.
  $('#cart').addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = [...$('#cart').querySelectorAll('button, input, select, textarea, [href]')].filter((n) => !n.disabled && n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  renderMenu();
  renderCartButton(false);
})();
