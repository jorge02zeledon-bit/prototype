import test from "node:test";
import assert from "node:assert/strict";
import { createMockProvider } from "../lib/payments/mock.ts";

const req = {
  lines: [
    { id: "cheese", kind: "one-off", name: "One Friday", qty: 2, unitCents: 600, lineCents: 1200 },
    { id: "friday-club", kind: "subscription", name: "Every Friday", qty: 1, unitCents: 2400, lineCents: 2400, billing: { interval: "week", intervalCount: 4, label: "every 4 weeks" } },
  ],
  mode: "subscription",
  totalCents: 3600,
  currency: "usd",
  customer: { name: "Ana", student: "Leo", phone: "5551234567" },
  pickupDate: "2026-11-13",
  successUrl: "https://example.test/order/success",
  cancelUrl: "https://example.test/order/cancelled",
};

test("mock provider round-trips a signed order with date and recurring lines", async () => {
  const p = createMockProvider("secret-a");
  const session = await p.createCheckout(req);
  const url = new URL(session.url);
  assert.equal(url.pathname, "/checkout/mock");
  const unpaid = await p.getOrder(url.searchParams.get("token"));
  assert.equal(unpaid.status, "unpaid");
  assert.equal(unpaid.mode, "subscription");
  assert.equal(unpaid.pickupDate, "2026-11-13");
  assert.equal(unpaid.lines[1].recurring, "every 4 weeks");
  assert.equal(unpaid.customer.student, "Leo");
  assert.equal(unpaid.lines[0].recurring, undefined);
  const paid = await p.getOrder(new URL(url.searchParams.get("success")).searchParams.get("session_id"));
  assert.equal(paid.status, "paid");
  assert.equal(paid.totalCents, 3600);
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
