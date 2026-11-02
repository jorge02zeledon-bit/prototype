# Pizza Friday (storefront prototype)

A small ecommerce site for a Friday-only pizza pop-up. Two slices on the menu, **Cheese** and **Pepperoni**, both **$6.00 a slice**. Customers pick quantities, check out with a name, phone number and pickup time, and get an order number.

- Static site, no build step: `index.html` + `styles.css` + `core.js` (menu, cart math, validation) + `app.js` (UI).
- The cart is kept in the browser's localStorage so it survives a refresh. There is no server: orders are confirmed on screen only and no payment is collected. The code is split so a backend can be added behind `buildOrder`.

## Run it

```bash
npm start
```

Then open http://localhost:5174. Or just open `index.html` in a browser.

## Test it

```bash
npm test
```

Unit tests cover the pure logic in `core.js`: pricing, quantity limits, cart totals, stored-cart repair, order validation.

```bash
npm run qa
```

Runs a Playwright click-through at phone and desktop widths (add slices, open the cart, fail validation, place an order, reload) and writes screenshots to `dist/qa/`.

## What is on the page

1. **Hero** with hours, pickup location and the $6 promise.
2. **Menu**: one card per slice with price, description and a quantity stepper (up to 50 of each).
3. **How it works** and a short **FAQ**.
4. **Cart drawer** (top-right button): line items with steppers, remove links, total. No tax or fees are added, the menu price is the price paid.
5. **Checkout** inside the drawer: name, mobile number, pickup slot (lunch and dinner windows every 30 minutes), optional note. Inline validation.
6. **Confirmation** with an order number in the form `PF-1234`, the line items and the amount due at pickup.

## Changing the menu or price

Edit `MENU` and `SLICE_PRICE_CENTS` at the top of `core.js`. Everything else (cards, totals, confirmation) reads from there. Pickup times are `PICKUP_SLOTS` in the same file.
