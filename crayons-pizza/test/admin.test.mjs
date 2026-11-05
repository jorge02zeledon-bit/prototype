import test from "node:test";
import assert from "node:assert/strict";
import { countByGrade, filterRows, sortRows, toCsv, toRows, issueSession, verifySession, checkPassword } from "../lib/admin.ts";

const paid = (over) => ({
  provider: "stripe", sessionId: "cs_test_abc123", status: "paid", mode: "payment", totalCents: 600, currency: "usd",
  customer: { name: "Ana", student: "Leo", grade: "2nd", classroom: "Rm 12", phone: "5551234567" },
  pickupDate: "2026-11-13", createdAt: "2026-11-05T12:00:00Z",
  lines: [{ name: "One Friday", qty: 1, unitCents: 600 }], ...over,
});
const sub = (over) => paid({
  sessionId: "cs_test_sub999", mode: "subscription", totalCents: 2400, pickupDate: "2026-11-06",
  customer: { name: "Bo", student: "Mia", grade: "K", classroom: "Ms. Lee", phone: "5550000000" },
  subscription: { id: "sub_1", status: "active" },
  lines: [{ name: "Every Friday", qty: 1, unitCents: 2400, recurring: "every 4 weeks" }], ...over,
});

test("rows carry student, grade, classroom and plan", () => {
  const rows = toRows([paid(), sub()]);
  assert.deepEqual(rows.map((r) => [r.student, r.grade, r.classroom, r.kind, r.slices, r.status, r.ref]),
    [["Leo", "2nd", "Rm 12", "one-off", 1, "paid", "ABC123"], ["Mia", "K", "Ms. Lee", "subscription", 1, "active", "SUB999"]]);
});

test("friday filter: one-offs on that day, subscriptions started on or before it and still active", () => {
  const rows = toRows([paid(), sub(), sub({ sessionId: "cs_x", subscription: { id: "sub_2", status: "canceled" } }), sub({ sessionId: "cs_y", pickupDate: "2026-11-20" })]);
  assert.deepEqual(filterRows(rows, { friday: "2026-11-13" }).map((r) => r.ref), ["ABC123", "SUB999"]);
  assert.deepEqual(filterRows(rows, { friday: "2026-11-06" }).map((r) => r.ref), ["SUB999"]);
  assert.deepEqual(filterRows(rows, { friday: "2026-11-20" }).map((r) => r.ref), ["SUB999", "CS_Y"]);
  assert.deepEqual(filterRows(rows, { grade: "K", q: "mia" }).length, 3);
  assert.deepEqual(filterRows(rows, { q: "rm 12" }).map((r) => r.student), ["Leo"]);
});

test("sorting follows grade order then classroom then student; counts by grade", () => {
  const rows = sortRows(toRows([paid(), sub()]), ["Pre-K", "K", "1st", "2nd"]);
  assert.deepEqual(rows.map((r) => r.student), ["Mia", "Leo"]);
  assert.deepEqual(countByGrade(rows), [{ grade: "K", students: 1, slices: 1 }, { grade: "2nd", students: 1, slices: 1 }]);
});

test("csv escapes commas and quotes", () => {
  const csv = toCsv(toRows([paid({ note: 'no basil, "extra" crispy' })]));
  const [head, line] = csv.trim().split("\n");
  assert.equal(head.split(",")[0], "student");
  assert.ok(line.includes('"no basil, ""extra"" crispy"'));
});

test("admin session cookie is signed and expires", () => {
  process.env.ADMIN_PASSWORD = "pizza-secret";
  assert.equal(checkPassword("pizza-secret"), true);
  assert.equal(checkPassword("nope"), false);
  const s = issueSession(1_000_000);
  assert.equal(verifySession(s.value, 1_000_001), true);
  assert.equal(verifySession(s.value, 1_000_000 + 13 * 3600_000), false);
  assert.equal(verifySession(s.value.replace(/.$/, "x"), 1_000_001), false);
  process.env.ADMIN_PASSWORD = "other";
  assert.equal(verifySession(s.value, 1_000_001), false);
});
