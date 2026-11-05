import { NextResponse } from "next/server";
import { cartLines, cartTotals, hasSubscription, sanitizeCart } from "@/lib/cart";
import { isSelectableFriday, todayInZone } from "@/lib/fridays";
import { GRADES, STORE } from "@/lib/menu";
import { getPaymentProvider } from "@/lib/payments";
import type { CheckoutRequest } from "@/lib/payments";
import { siteOrigin } from "@/lib/site";

export const runtime = "nodejs";

type Body = {
  cart?: unknown;
  customer?: { name?: unknown; student?: unknown; grade?: unknown; classroom?: unknown; phone?: unknown; email?: unknown };
  pickupDate?: unknown;
  note?: unknown;
};

/**
 * POST /api/checkout
 * Body: { cart: {cheese: 2, "friday-club": 1}, customer: {name, student, grade, classroom, phone, email?}, pickupDate: "YYYY-MM-DD", note? }
 * Returns: { url } to redirect the browser to, or { errors } with field messages.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ errors: { form: "Request body must be JSON." } }, { status: 400 });
  }

  const cart = sanitizeCart(body.cart);
  const lines = cartLines(cart);
  const name = String(body.customer?.name ?? "").trim();
  const student = String(body.customer?.student ?? "").trim().slice(0, 80);
  const grade = String(body.customer?.grade ?? "").trim();
  const classroom = String(body.customer?.classroom ?? "").trim().slice(0, 60);
  const phone = String(body.customer?.phone ?? "").trim();
  const email = String(body.customer?.email ?? "").trim();
  const note = String(body.note ?? "").trim().slice(0, 300);
  const pickupDate = body.pickupDate;
  const today = todayInZone(STORE.timeZone);

  const errors: Record<string, string> = {};
  if (lines.length === 0) errors.cart = "Add a slice or a subscription first.";
  if (name.length < 2) errors.name = "Enter your name.";
  if (student.length < 2) errors.student = "Enter the student's name.";
  if (!(GRADES as readonly string[]).includes(grade)) errors.grade = "Choose the student's grade.";
  if (classroom.length < 1) errors.classroom = "Enter the teacher or room.";
  if (phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a 10-digit phone number.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email address does not look right.";
  if (!isSelectableFriday(pickupDate, today, STORE.maxWeeksAhead)) errors.pickupDate = "Choose a Friday on the calendar.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

  const origin = siteOrigin(request.url);
  const req: CheckoutRequest = {
    lines,
    mode: hasSubscription(cart) ? "subscription" : "payment",
    totalCents: cartTotals(cart).totalCents,
    currency: "usd",
    customer: { name, student, grade, classroom, phone, email: email || undefined },
    pickupDate: pickupDate as string,
    note: note || undefined,
    successUrl: `${origin}/order/success`,
    cancelUrl: `${origin}/order/cancelled`,
  };

  try {
    const session = await getPaymentProvider().createCheckout(req);
    return NextResponse.json({ url: session.url, sessionId: session.sessionId });
  } catch (err) {
    console.error("checkout failed", err);
    const message = err instanceof Error ? err.message : "Payment could not be started.";
    return NextResponse.json({ errors: { form: message } }, { status: 502 });
  }
}
