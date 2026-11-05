import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaidOrder } from "./payments/types.ts";

/**
 * Orders page access. One shared password in ADMIN_PASSWORD; a signed,
 * expiring cookie keeps the browser logged in. No database, nothing to leak.
 */
export const ADMIN_COOKIE = "cp_admin";
const SESSION_HOURS = 12;

function secret(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}
function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminConfigured(): boolean {
  return !!secret();
}

export function checkPassword(input: string): boolean {
  const s = secret();
  return !!s && safeEqual(input, s);
}

/** Cookie value: "<expiry-ms>.<signature>" */
export function issueSession(now = Date.now()): { value: string; maxAge: number } {
  const s = secret();
  if (!s) throw new Error("ADMIN_PASSWORD is not set");
  const exp = String(now + SESSION_HOURS * 3600_000);
  return { value: `${exp}.${sign(`session:${exp}`, s)}`, maxAge: SESSION_HOURS * 3600 };
}

export function verifySession(value: string | undefined, now = Date.now()): boolean {
  const s = secret();
  if (!s || !value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < now) return false;
  return safeEqual(sig, sign(`session:${exp}`, s));
}

/** One line in the orders table. */
export type OrderRow = {
  student: string;
  grade: string;
  classroom: string;
  parent: string;
  phone: string;
  email: string;
  kind: "one-off" | "subscription";
  slices: number;
  /** One-off: the pickup Friday. Subscription: the first Friday. */
  friday: string;
  status: string;
  placedAt: string;
  note: string;
  ref: string;
  dashboardUrl?: string;
};

export function toRows(orders: PaidOrder[]): OrderRow[] {
  return orders.map((o) => {
    const subLine = o.lines.find((l) => l.recurring);
    const oneOffSlices = o.lines.filter((l) => !l.recurring).reduce((n, l) => n + l.qty, 0);
    const kind: OrderRow["kind"] = subLine ? "subscription" : "one-off";
    return {
      student: o.customer.student ?? "",
      grade: o.customer.grade ?? "",
      classroom: o.customer.classroom ?? "",
      parent: o.customer.name ?? "",
      phone: o.customer.phone ?? "",
      email: o.customer.email ?? "",
      kind,
      slices: subLine ? subLine.qty + oneOffSlices : oneOffSlices,
      friday: o.pickupDate ?? "",
      status: o.subscription ? o.subscription.status : o.status,
      placedAt: o.createdAt ?? "",
      note: o.note ?? "",
      ref: o.sessionId.slice(-6).toUpperCase(),
      dashboardUrl: o.dashboardUrl,
    };
  });
}

export type Filters = { friday?: string; grade?: string; q?: string };

/**
 * Which rows apply to the filters. With a Friday chosen, a one-off counts
 * only for that Friday; a subscription counts if it started on or before it
 * and is still active (or was cancelled after it).
 */
export function filterRows(rows: OrderRow[], f: Filters): OrderRow[] {
  const q = (f.q ?? "").trim().toLowerCase();
  return rows.filter((r) => {
    if (f.grade && r.grade !== f.grade) return false;
    if (q && !`${r.student} ${r.parent} ${r.classroom}`.toLowerCase().includes(q)) return false;
    if (f.friday) {
      if (r.kind === "one-off") return r.friday === f.friday && r.status === "paid";
      if (r.friday > f.friday) return false;
      return r.status === "active" || r.status === "trialing" || r.status === "past_due";
    }
    return true;
  });
}

/** Sort by grade order, then classroom, then student. */
export function sortRows(rows: OrderRow[], gradeOrder: readonly string[]): OrderRow[] {
  const gi = (g: string) => { const i = gradeOrder.indexOf(g); return i === -1 ? 999 : i; };
  return [...rows].sort((a, b) => gi(a.grade) - gi(b.grade) || a.classroom.localeCompare(b.classroom) || a.student.localeCompare(b.student));
}

export function countByGrade(rows: OrderRow[]): { grade: string; students: number; slices: number }[] {
  const m = new Map<string, { students: number; slices: number }>();
  for (const r of rows) {
    const e = m.get(r.grade) ?? { students: 0, slices: 0 };
    e.students += 1;
    e.slices += r.slices;
    m.set(r.grade, e);
  }
  return [...m.entries()].map(([grade, v]) => ({ grade, ...v }));
}

export function toCsv(rows: OrderRow[]): string {
  const cols: (keyof OrderRow)[] = ["student", "grade", "classroom", "parent", "phone", "email", "kind", "slices", "friday", "status", "placedAt", "note", "ref"];
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
}
