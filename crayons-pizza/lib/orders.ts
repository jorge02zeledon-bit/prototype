import type { PaidOrder } from "./payments/types.ts";

/**
 * Where paid orders go. Right now that is the server log, which is enough to
 * confirm the webhook fires. Swap the body of `recordPaidOrder` for a database
 * insert (Vercel Postgres, Supabase, PlanetScale, ...) and a notification to the
 * kitchen (email, SMS, printer) when you are ready. For subscriptions, the
 * kitchen needs the pickup date and then every Friday after it.
 */
export async function recordPaidOrder(order: PaidOrder): Promise<void> {
  console.log(
    JSON.stringify({
      event: "order.paid",
      provider: order.provider,
      sessionId: order.sessionId,
      mode: order.mode,
      total: order.totalCents,
      customer: order.customer.name,
      phone: order.customer.phone,
      pickupDate: order.pickupDate,
      lines: order.lines,
    }),
  );
}
