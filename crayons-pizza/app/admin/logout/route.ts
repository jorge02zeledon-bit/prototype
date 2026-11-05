import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/admin/orders", request.url), 303);
  res.cookies.set(ADMIN_COOKIE, "", { path: "/admin", maxAge: 0 });
  return res;
}
