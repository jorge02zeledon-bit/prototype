import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CheckoutRequest, CheckoutSession, PaidOrder, PaymentProvider, WebhookResult } from "./types.ts";

/**
 * A fake provider for local development and previews with no Stripe keys.
 * It sends the customer to /checkout/mock, a page on this site that shows the
 * order and a "Pay" button. The order details travel inside a signed token so
 * the success page can show them without a database.
 *
 * Never enable this in production: it marks everything as paid.
 */
export function createMockProvider(signingSecret: string): PaymentProvider {
  const sign = (payload: string) => createHmac("sha256", signingSecret).update(payload).digest("base64url");
  const encode = (order: PaidOrder) => {
    const payload = Buffer.from(JSON.stringify(order)).toString("base64url");
    return `${payload}.${sign(payload)}`;
  };
  const decode = (token: string): PaidOrder | null => {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    try {
      return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PaidOrder;
    } catch {
      return null;
    }
  };

  return {
    name: "mock",

    async createCheckout(req: CheckoutRequest): Promise<CheckoutSession> {
      const sessionId = `mock_${randomBytes(6).toString("hex")}`;
      const order: PaidOrder = {
        provider: "mock",
        sessionId,
        status: "unpaid",
        mode: req.mode,
        totalCents: req.totalCents,
        currency: req.currency,
        customer: req.customer,
        pickupDate: req.pickupDate,
        note: req.note,
        createdAt: new Date().toISOString(),
        lines: req.lines.map((l) => ({
          name: l.name,
          qty: l.qty,
          unitCents: l.unitCents,
          ...(l.billing ? { recurring: l.billing.label } : {}),
        })),
      };
      const token = encode(order);
      const paidToken = encode({ ...order, status: "paid" });
      const url = new URL("/checkout/mock", req.successUrl);
      url.searchParams.set("token", token);
      url.searchParams.set("success", `${req.successUrl}?session_id=${encodeURIComponent(paidToken)}`);
      url.searchParams.set("cancel", req.cancelUrl);
      return { url: url.toString(), sessionId };
    },

    async getOrder(sessionId: string): Promise<PaidOrder | null> {
      return decode(sessionId);
    },

    async handleWebhook(): Promise<WebhookResult> {
      return { kind: "ignored", reason: "mock provider has no webhooks" };
    },

    async listPaidOrders(): Promise<PaidOrder[]> {
      return [];
    },
  };
}
