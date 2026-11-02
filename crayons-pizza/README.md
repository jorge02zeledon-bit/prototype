# Crayons Pizza

Online ordering for a pizza shop in Davie, Florida with one slice on the menu, Cheese, at $6.00. Customers pick quantities, enter pickup details, pay on a hosted checkout page, and get an order confirmation. Built with Next.js so it deploys to Vercel as is.

Payments go through a small provider interface. **Stripe Checkout is implemented**, a **mock provider** lets you run the whole flow with no keys, and a **Chase stub** marks where that integration goes.

## Run it locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. With no Stripe key set, the site uses the mock provider: "Pay" sends you to a pretend payment page on this site, and nothing is charged.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New Project**, import the repository. Framework preset: Next.js. If the app lives in a subfolder of the repository, set **Root Directory** to that folder.
3. Add environment variables (Settings > Environment Variables):
   - `STRIPE_SECRET_KEY` from https://dashboard.stripe.com/apikeys (use the test key first).
   - `STRIPE_WEBHOOK_SECRET` after step 5.
4. Deploy.
5. In Stripe, **Developers > Webhooks > Add endpoint**, URL `https://<your-vercel-domain>/api/webhooks/stripe`, event `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

For a demo deploy with no Stripe account, set `ALLOW_MOCK_PAYMENTS=true` instead. Production refuses to start checkout without either a real provider or that flag.

See `.env.example` for every variable.

## Where things are

| Path | What it does |
| --- | --- |
| `lib/menu.ts` | The menu, prices, store details, pickup slots. Prices here are the only prices used; the server never trusts amounts from the browser. |
| `lib/cart.ts` | Cart math and validation, shared by the browser and the API. |
| `lib/payments/types.ts` | The `PaymentProvider` interface: `createCheckout`, `getOrder`, `handleWebhook`. |
| `lib/payments/stripe.ts` | Stripe Checkout implementation. |
| `lib/payments/chase.ts` | Placeholder for Chase Payment Solutions with notes on what to fill in. |
| `lib/payments/mock.ts` | Fake provider for local work and previews. |
| `lib/payments/index.ts` | Picks the provider from `PAYMENT_PROVIDER` and the keys present. |
| `lib/orders.ts` | `recordPaidOrder`: where a paid order goes. Logs today; replace with a database insert and a kitchen notification. |
| `app/api/checkout/route.ts` | `POST /api/checkout`: validates the order, prices it from the menu, starts a provider checkout, returns the URL. |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook receiver. Verifies the signature, records paid orders. |
| `app/order/success` | Confirmation page. Reads the session id the provider sends back. |
| `app/checkout/mock` | The pretend payment page used by the mock provider only. |
| `components/` | Cart state (localStorage), header, menu, cart drawer with the pickup form. |

## Adding Chase, Square, or another provider

Write one file in `lib/payments/` that returns a `PaymentProvider`, register it in `lib/payments/index.ts`, and set `PAYMENT_PROVIDER` to its name. Nothing in the pages or API needs to change.

## Checks

```bash
npm test
```

Unit tests for cart math and the mock provider's signed tokens.

```bash
npm run typecheck && npm run build
```

## Changing the menu

Edit `MENU`, `SLICE_PRICE_CENTS`, and `STORE` in `lib/menu.ts`. Item images live in `public/images/`; swap the SVGs for photos (same filenames or update the `image` field).
