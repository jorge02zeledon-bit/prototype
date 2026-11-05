import Stripe from "stripe";
import type { CheckoutRequest, CheckoutSession, PaidOrder, PaymentProvider, WebhookResult } from "./types.ts";

/**
 * Stripe Checkout (hosted page). Needs:
 *   STRIPE_SECRET_KEY       sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET   whsec_... from the webhook endpoint you create in the Stripe dashboard
 * Webhook endpoint to register: https://<your-domain>/api/webhooks/stripe
 * Events to subscribe to:       checkout.session.completed, invoice.paid
 *
 * One-off slices are one-time line items. The Friday subscription is a
 * recurring price; when the cart has one, the session runs in subscription
 * mode and any one-off slices are charged once on the same checkout.
 */
export function createStripeProvider(
  secretKey: string,
  webhookSecret?: string,
  config: Stripe.StripeConfig = {},
): PaymentProvider {
  const stripe = new Stripe(secretKey, config);

  return {
    name: "stripe",

    async createCheckout(req: CheckoutRequest): Promise<CheckoutSession> {
      const metadata = {
        customer_name: req.customer.name,
        student_name: req.customer.student,
        customer_phone: req.customer.phone,
        pickup_date: req.pickupDate,
        note: req.note ?? "",
      };
      const session = await stripe.checkout.sessions.create({
        mode: req.mode,
        line_items: req.lines.map((l) => ({
          quantity: l.qty,
          price_data: {
            currency: req.currency,
            unit_amount: l.unitCents,
            product_data: { name: l.kind === "subscription" ? `${l.name}: cheese slice every Friday` : `${l.name}: cheese slice` },
            ...(l.billing ? { recurring: { interval: l.billing.interval, interval_count: l.billing.intervalCount } } : {}),
          },
        })),
        customer_email: req.customer.email || undefined,
        metadata,
        ...(req.mode === "subscription" ? { subscription_data: { metadata } } : {}),
        success_url: `${req.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: req.cancelUrl,
      });
      if (!session.url) throw new Error("Stripe did not return a checkout URL");
      return { url: session.url, sessionId: session.id };
    },

    async getOrder(sessionId: string): Promise<PaidOrder | null> {
      try {
        const s = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items", "line_items.data.price"] });
        return toPaidOrder(s);
      } catch {
        return null;
      }
    },

    async handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult> {
      if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
      const signature = headers.get("stripe-signature");
      if (!signature) throw new Error("Missing stripe-signature header");
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      if (event.type !== "checkout.session.completed") {
        return { kind: "ignored", reason: `event ${event.type}` };
      }
      const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
        expand: ["line_items", "line_items.data.price"],
      });
      return { kind: "order.paid", order: toPaidOrder(session) };
    },
  };
}

function toPaidOrder(s: Stripe.Checkout.Session): PaidOrder {
  const items = s.line_items?.data ?? [];
  return {
    provider: "stripe",
    sessionId: s.id,
    status: s.payment_status === "paid" ? "paid" : s.payment_status === "unpaid" ? "unpaid" : "unknown",
    mode: s.mode === "subscription" ? "subscription" : "payment",
    totalCents: s.amount_total ?? 0,
    currency: s.currency ?? "usd",
    customer: {
      name: s.metadata?.customer_name || s.customer_details?.name || undefined,
      student: s.metadata?.student_name || undefined,
      email: s.customer_details?.email || undefined,
      phone: s.metadata?.customer_phone || s.customer_details?.phone || undefined,
    },
    pickupDate: s.metadata?.pickup_date || undefined,
    note: s.metadata?.note || undefined,
    lines: items.map((li) => {
      const rec = li.price?.recurring;
      return {
        name: (li.description ?? "Item").split(":")[0],
        qty: li.quantity ?? 1,
        unitCents: li.price?.unit_amount ?? Math.round((li.amount_total ?? 0) / (li.quantity || 1)),
        ...(rec ? { recurring: rec.interval_count > 1 ? `every ${rec.interval_count} ${rec.interval}s` : `every ${rec.interval}` } : {}),
      };
    }),
  };
}
