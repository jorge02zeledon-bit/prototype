import type { CheckoutRequest, CheckoutSession, PaidOrder, PaymentProvider, WebhookResult } from "./types.ts";

/**
 * Placeholder for J.P. Morgan / Chase Payment Solutions.
 *
 * Chase offers a hosted checkout ("Hosted Pay Page" on the Orbital gateway) and
 * a REST API on the J.P. Morgan Commerce platform. Either fits this interface:
 *   - createCheckout: create a hosted payment session with the order amount and
 *     line items, return its redirect URL and transaction id.
 *   - getOrder:       fetch the transaction by id to confirm it was approved.
 *   - handleWebhook:  verify the notification signature and map an approved
 *     transaction to an order.paid result.
 *
 * Fill in the three methods below with the Chase SDK or fetch() calls once you
 * have merchant credentials, then set PAYMENT_PROVIDER=chase in the environment.
 */
export function createChaseProvider(_config: { merchantId?: string; apiKey?: string }): PaymentProvider {
  const notReady = () =>
    new Error("Chase payments are not configured yet. See lib/payments/chase.ts for what to implement.");
  return {
    name: "chase",
    async createCheckout(_req: CheckoutRequest): Promise<CheckoutSession> {
      throw notReady();
    },
    async getOrder(_sessionId: string): Promise<PaidOrder | null> {
      throw notReady();
    },
    async handleWebhook(_rawBody: string, _headers: Headers): Promise<WebhookResult> {
      throw notReady();
    },
  };
}
