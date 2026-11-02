import test from "node:test";
import assert from "node:assert/strict";
import { createMockProvider } from "../lib/payments/mock.ts";

const req = {
  lines: [{ id: "cheese", name: "Cheese", qty: 2, unitCents: 600, lineCents: 1200 }],
  totalCents: 1200,
  currency: "usd",
  customer: { name: "Ana", phone: "5551234567" },
  pickupInMinutes: 30,
  successUrl: "https://example.test/order/success",
  cancelUrl: "https://example.test/order/cancelled",
};

test("mock provider round-trips a signed order", async () => {
  const p = createMockProvider("secret-a");
  const session = await p.createCheckout(req);
  const url = new URL(session.url);
  assert.equal(url.pathname, "/checkout/mock");
  const unpaid = await p.getOrder(url.searchParams.get("token"));
  assert.equal(unpaid.status, "unpaid");
  assert.equal(unpaid.totalCents, 1200);
  const successUrl = new URL(url.searchParams.get("success"));
  const paid = await p.getOrder(successUrl.searchParams.get("session_id"));
  assert.equal(paid.status, "paid");
  assert.equal(paid.customer.name, "Ana");
});

test("mock provider rejects a token signed with another secret or tampered", async () => {
  const a = createMockProvider("secret-a");
  const b = createMockProvider("secret-b");
  const session = await a.createCheckout(req);
  const token = new URL(session.url).searchParams.get("token");
  assert.equal(await b.getOrder(token), null);
  const [payload, sig] = token.split(".");
  assert.equal(await a.getOrder(`${payload}x.${sig}`), null);
  assert.equal(await a.getOrder("garbage"), null);
});
