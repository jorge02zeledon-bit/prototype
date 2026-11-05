import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminConfigured, checkPassword, issueSession } from "@/lib/admin";

export const runtime = "nodejs";

/** POST /admin/login (form): sets the signed session cookie and returns to the orders page. */
export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin/orders");
  const back = new URL(next.startsWith("/admin") ? next : "/admin/orders", request.url);
  if (!adminConfigured() || !checkPassword(password)) {
    back.searchParams.set("error", "1");
    return NextResponse.redirect(back, 303);
  }
  const session = issueSession();
  const res = NextResponse.redirect(back, 303);
  res.cookies.set(ADMIN_COOKIE, session.value, { httpOnly: true, sameSite: "lax", secure: back.protocol === "https:", path: "/admin", maxAge: session.maxAge });
  return res;
}
