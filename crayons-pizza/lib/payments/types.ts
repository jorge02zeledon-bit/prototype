import type { CartLine } from "../cart.ts";

/**
 * Everything a payment provider needs to know to take money for an order.
 * Built on the server from the validated cart; never trusted from the client.
 */
export type CheckoutRequest = {
  lines: CartLine[];
  /** "subscription" when any line recurs; one-off lines ride along as one-time charges. */
  mode: "payment" | "subscription";
  totalCents: number;
  currency: "usd";
  customer: {
    name: string;
    /** The student the slice is for. */
    student: string;
    grade: string;
    classroom: string;
    email?: string;
    phone: string;
  };
  /** YYYY-MM-DD. Pickup Friday for one-off lines, first Friday for subscriptions. */
  pickupDate: string;
  note?: string;
  /** Absolute URLs the provider sends the customer back to. */
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSession = {
  /** Where to send the customer's browser to pay. */
  url: string;
  /** Provider-side id, stored so the webhook and the success page can find the order. */
  sessionId: string;
};

export type PaidOrder = {
  provider: string;
  sessionId: string;
  status: "paid" | "unpaid" | "unknown";
  mode: "payment" | "subscription";
  totalCents: number;
  currency: string;
  customer: { name?: string; student?: string; grade?: string; classroom?: string; email?: string; phone?: string };
  pickupDate?: string;
  /** ISO timestamp of when the order was placed. */
  createdAt?: string;
  /** For subscription orders: the live state of the subscription. */
  subscription?: { id: string; status: string; canceledAt?: string };
  /** Link to the order in the provider's dashboard, if any. */
  dashboardUrl?: string;
  note?: string;
  lines: { name: string; qty: number; unitCents: number; recurring?: string }[];
};

export type WebhookResult =
  | { kind: "order.paid"; order: PaidOrder }
  | { kind: "ignored"; reason: string };

/**
 * The contract every provider implements. Adding Chase, Square or anything
 * else means writing one file that satisfies this and registering it in index.ts.
 */
export interface PaymentProvider {
  readonly name: string;
  /** Create a hosted checkout and return where to send the customer. */
  createCheckout(req: CheckoutRequest): Promise<CheckoutSession>;
  /** Look up an order after the customer comes back, for the confirmation page. */
  getOrder(sessionId: string): Promise<PaidOrder | null>;
  /**
   * Verify and interpret an incoming webhook. `rawBody` is the exact request
   * body as a string because signatures are computed over the bytes.
   */
  handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;
  /** Every paid order the provider knows about, newest first. Used by the orders page. */
  listPaidOrders(opts: { sinceDays: number }): Promise<PaidOrder[]>;
}
