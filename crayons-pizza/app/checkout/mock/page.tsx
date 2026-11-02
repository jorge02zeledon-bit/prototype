import type { Metadata } from "next";
import { formatMoney } from "@/lib/cart";
import { getPaymentProvider } from "@/lib/payments";
import { siteOrigin } from "@/lib/site";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Test checkout" };
export const dynamic = "force-dynamic";

/**
 * Stand-in for the payment provider's hosted page. Only reachable when the
 * mock provider is active (no Stripe keys). Lets you walk the whole order flow
 * locally and on preview deploys without charging anyone.
 */
export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; success?: string; cancel?: string }>;
}) {
  const { token, success, cancel } = await searchParams;
  const provider = getPaymentProvider();
  const order = provider.name === "mock" && token ? await provider.getOrder(token) : null;
  const h = await headers();
  const origin = siteOrigin(`${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost"}`);
  const sameOrigin = (u?: string) => !!u && u.startsWith(origin + "/");

  if (!order || !sameOrigin(success) || !sameOrigin(cancel)) {
    return (
      <main className="page narrow">
        <h1 className="h2">This test checkout link is not valid.</h1>
        <a className="btn btn-primary" href="/">Back to the menu</a>
      </main>
    );
  }

  return (
    <main className="page narrow mock">
      <p className="kicker">Test mode</p>
      <h1 className="h2">Pretend payment page</h1>
      <p>
        This stands in for Stripe&apos;s hosted checkout. Nothing is charged. Set a Stripe key and this page is
        never shown.
      </p>
      <div className="receipt">
        <ul>
          {order.lines.map((l, i) => (
            <li key={i}>
              <span>
                {l.qty} × {l.name} slice
              </span>
              <span>{formatMoney(l.unitCents * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="receipt-total">
          <span>Total</span>
          <span>{formatMoney(order.totalCents)}</span>
        </div>
        <p className="receipt-note">
          {order.customer.name}, {order.customer.phone}, pickup in {order.pickupInMinutes} min
        </p>
      </div>
      <div className="row">
        <a className="btn btn-primary" href={success}>
          Pay {formatMoney(order.totalCents)} (test)
        </a>
        <a className="btn btn-ghost" href={cancel}>
          Cancel
        </a>
      </div>
    </main>
  );
}
