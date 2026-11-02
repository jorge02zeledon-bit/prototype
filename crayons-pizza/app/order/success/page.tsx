import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { formatMoney } from "@/lib/cart";
import { STORE } from "@/lib/menu";
import { getPaymentProvider } from "@/lib/payments";

export const metadata: Metadata = { title: "Order placed" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const order = session_id ? await getPaymentProvider().getOrder(session_id) : null;

  if (!order) {
    return (
      <main className="page narrow">
        <h1 className="h2">We could not find that order</h1>
        <p>The link may be old or incomplete. If you were charged, call us at {STORE.phone} and we will sort it out.</p>
        <Link className="btn btn-primary" href="/">Back to the menu</Link>
      </main>
    );
  }

  const paid = order.status === "paid";
  const ref = order.sessionId.slice(-6).toUpperCase();
  return (
    <main className="page narrow">
      <ClearCart />
      <p className="kicker">{paid ? "Paid" : "Payment pending"}</p>
      <h1 className="h2">{paid ? "Your slices are on the way to the oven." : "We are waiting on the payment."}</h1>
      <p>
        {order.customer.name ? `Thanks, ${order.customer.name}. ` : ""}
        {order.pickupInMinutes ? `Pick up in about ${order.pickupInMinutes} minutes at ${STORE.address}. ` : ""}
        Say your name at the counter.
      </p>
      <div className="receipt">
        <div className="receipt-ref">
          <span>Order</span>
          <strong>{ref}</strong>
        </div>
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
          <span>{paid ? "Paid" : "Total"}</span>
          <span>{formatMoney(order.totalCents)}</span>
        </div>
        {order.note ? <p className="receipt-note">Note: {order.note}</p> : null}
        {order.customer.email ? <p className="receipt-note">A receipt is on its way to {order.customer.email}.</p> : null}
      </div>
      <Link className="btn btn-ghost" href="/">Order more</Link>
    </main>
  );
}
