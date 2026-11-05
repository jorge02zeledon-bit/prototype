import { cookies } from "next/headers";
import { ADMIN_COOKIE, filterRows, sortRows, toCsv, toRows, verifySession } from "@/lib/admin";
import { GRADES } from "@/lib/menu";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /admin/orders.csv?friday=&grade=&q=&days= : the filtered table as a spreadsheet. */
export async function GET(request: Request) {
  const jar = await cookies();
  if (!verifySession(jar.get(ADMIN_COOKIE)?.value)) return new Response("Sign in first.", { status: 401 });
  const p = new URL(request.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(p.get("days")) || 90));
  const orders = await getPaymentProvider().listPaidOrders({ sinceDays: days });
  const rows = sortRows(filterRows(toRows(orders), { friday: p.get("friday") || undefined, grade: p.get("grade") || undefined, q: p.get("q") || undefined }), GRADES);
  const name = `crayons-orders${p.get("friday") ? `-${p.get("friday")}` : ""}.csv`;
  return new Response(toCsv(rows), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` },
  });
}
