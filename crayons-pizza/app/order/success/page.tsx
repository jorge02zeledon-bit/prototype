import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { formatMoney } from "@/lib/cart";
import { formatFriday, isISODate } from "@/lib/fridays";
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
  const sub = order.mode === "subscription";
  const ref = order.sessionId.slice(-6).toUpperCase();
  const when = order.pickupDate && isISODate(order.pickupDate) ? formatFriday(order.pickupDate) : null;
  return (
    <main className="page narrow">
      <ClearCart />
      <p className="kicker">{paid ? (sub ? "Subscribed" : "Paid") : "Payment pending"}</p>
      <h1 className="h2">
        {!paid ? "We are waiting on the payment." : sub ? "Your Fridays are set." : "Your slice is on the books."}
      </h1>
      <p>
        {order.customer.name ? `Thanks, ${order.customer.name}. ` : ""}
        {order.customer.student ? `The slice is set aside for ${order.customer.student}. ` : ""}
        {when ? (sub ? `First slice ${when}, then every Friday after. ` : `Pick up ${when}. `) : ""}
        {STORE.fridayPickup.open} to {STORE.fridayPickup.close} at {STORE.address}. Give the student's name at the counter.
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
                {l.qty} × {l.name}
                {l.recurring ? ` (${l.recurring})` : ""}
              </span>
              <span>{formatMoney(l.unitCents * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="receipt-total">
          <span>{paid ? (sub ? "Paid today" : "Paid") : "Total"}</span>
          <span>{formatMoney(order.totalCents)}</span>
        </div>
        {sub ? <p className="receipt-note">Renews every 4 weeks. Cancel any time by calling {STORE.phone}.</p> : null}
        {order.note ? <p className="receipt-note">Note: {order.note}</p> : null}
        {order.customer.email ? <p className="receipt-note">A receipt is on its way to {order.customer.email}.</p> : null}
      </div>
      <Link className="btn btn-ghost" href="/">Back to the menu</Link>
    </main>
  );
}
