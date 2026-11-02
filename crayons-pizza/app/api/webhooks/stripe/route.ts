import { NextResponse } from "next/server";
import { recordPaidOrder } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe
 * Register this URL in the Stripe dashboard (Developers > Webhooks) for the
 * event `checkout.session.completed`, and put the signing secret in
 * STRIPE_WEBHOOK_SECRET. Stripe retries on any non-2xx response.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    const result = await getPaymentProvider().handleWebhook(rawBody, request.headers);
    if (result.kind === "order.paid") {
      await recordPaidOrder(result.order);
    }
    return NextResponse.json({ received: true, handled: result.kind });
  } catch (err) {
    console.error("webhook rejected", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Webhook rejected" }, { status: 400 });
  }
}
