import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminConfigured, countByGrade, filterRows, sortRows, toRows, verifySession, type OrderRow } from "@/lib/admin";
import { formatFriday, isISODate, selectableFridays, todayInZone } from "@/lib/fridays";
import { GRADES, STORE } from "@/lib/menu";
import { getPaymentProvider } from "@/lib/payments";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = { friday?: string; grade?: string; q?: string; days?: string; error?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const jar = await cookies();
  const authed = verifySession(jar.get(ADMIN_COOKIE)?.value);

  if (!authed) {
    return (
      <main className="page narrow admin">
        <p className="kicker">Staff only</p>
        <h1 className="h2">Orders</h1>
        {!adminConfigured() ? (
          <p>No password is set yet. Add an <code>ADMIN_PASSWORD</code> environment variable in Vercel and redeploy.</p>
        ) : (
          <form className="form" method="post" action="/admin/login">
            <input type="hidden" name="next" value="/admin/orders" />
            <div className={`field ${sp.error ? "invalid" : ""}`}>
              <label htmlFor="f-password">Password</label>
              <input id="f-password" name="password" type="password" autoComplete="current-password" required autoFocus />
              {sp.error ? <p className="err" role="alert">That password is not right.</p> : null}
            </div>
            <button type="submit" className="btn btn-primary">Sign in</button>
          </form>
        )}
      </main>
    );
  }

  const days = Math.min(365, Math.max(1, Number(sp.days) || 90));
  const filters = { friday: isISODate(sp.friday) ? sp.friday : undefined, grade: sp.grade || undefined, q: sp.q || undefined };
  let rows: OrderRow[] = [];
  let loadError: string | null = null;
  try {
    rows = sortRows(filterRows(toRows(await getPaymentProvider().listPaidOrders({ sinceDays: days })), filters), GRADES);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load orders.";
  }
  const today = todayInZone(STORE.timeZone);
  const fridays = selectableFridays(today, STORE.maxWeeksAhead);
  const byGrade = countByGrade(rows);
  const totalSlices = rows.reduce((n, r) => n + r.slices, 0);
  const csvQuery = new URLSearchParams({ ...(filters.friday ? { friday: filters.friday } : {}), ...(filters.grade ? { grade: filters.grade } : {}), ...(filters.q ? { q: filters.q } : {}), days: String(days) });

  return (
    <main className="page admin">
      <div className="admin-head">
        <div>
          <p className="kicker">Staff only</p>
          <h1 className="h2">Orders</h1>
        </div>
        <form method="post" action="/admin/logout">
          <button type="submit" className="btn btn-ghost">Sign out</button>
        </form>
      </div>

      <form className="admin-filters" method="get">
        <div className="field">
          <label htmlFor="f-friday">Friday</label>
          <select id="f-friday" name="friday" defaultValue={filters.friday ?? ""}>
            <option value="">All orders</option>
            {fridays.map((f) => (
              <option key={f} value={f}>
                {formatFriday(f, "short")}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-grade">Grade</label>
          <select id="f-grade" name="grade" defaultValue={filters.grade ?? ""}>
            <option value="">All grades</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-q">Student, parent or room</label>
          <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Search" />
        </div>
        <input type="hidden" name="days" value={days} />
        <div className="admin-filter-actions">
          <button type="submit" className="btn btn-primary">Show</button>
          <a className="btn btn-ghost" href={`/admin/orders.csv?${csvQuery}`}>Download CSV</a>
        </div>
      </form>

      {loadError ? (
        <p className="err" role="alert">{loadError}</p>
      ) : (
        <>
          <p className="admin-summary">
            {filters.friday ? `Pickup ${formatFriday(filters.friday)}: ` : `Last ${days} days: `}
            <strong>{rows.length}</strong> {rows.length === 1 ? "order" : "orders"}, <strong>{totalSlices}</strong> {totalSlices === 1 ? "slice" : "slices"}
            {byGrade.length > 1 ? ". By grade: " + byGrade.map((g) => `${g.grade || "?"} ${g.slices}`).join(", ") : ""}.
          </p>
          {rows.length === 0 ? (
            <p>No orders match. {filters.friday ? "Try another Friday or clear the filters." : "They appear here as soon as a payment goes through."}</p>
          ) : (
            <div className="table-wrap">
              <table className="orders">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Grade</th>
                    <th>Teacher / room</th>
                    <th>Slices</th>
                    <th>Plan</th>
                    <th>Friday</th>
                    <th>Parent</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.ref + r.placedAt}>
                      <td>
                        <strong>{r.student}</strong>
                        {r.note ? <div className="muted small">{r.note}</div> : null}
                      </td>
                      <td>{r.grade}</td>
                      <td>{r.classroom}</td>
                      <td>{r.slices}</td>
                      <td>{r.kind === "subscription" ? "Every Friday" : "One Friday"}</td>
                      <td>{r.friday ? formatFriday(r.friday, "short") : ""}{r.kind === "subscription" ? " →" : ""}</td>
                      <td>{r.parent}{r.email ? <div className="muted small">{r.email}</div> : null}</td>
                      <td><a href={`tel:${r.phone.replace(/\D/g, "")}`}>{r.phone}</a></td>
                      <td><span className={`pill pill-${r.status}`}>{r.status}</span></td>
                      <td>{r.dashboardUrl ? <a href={r.dashboardUrl} target="_blank" rel="noreferrer">{r.ref}</a> : r.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
