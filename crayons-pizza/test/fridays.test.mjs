import test from "node:test";
import assert from "node:assert/strict";
import { addDays, formatFriday, isFriday, isISODate, isSelectableFriday, nextFridayOnOrAfter, selectableFridays, todayInZone, weekday } from "../lib/fridays.ts";

test("weekday and friday detection", () => {
  assert.equal(weekday("2026-11-06"), 5); // a Friday
  assert.equal(isFriday("2026-11-06"), true);
  assert.equal(isFriday("2026-11-07"), false);
  assert.equal(isISODate("2026-11-06"), true);
  assert.equal(isISODate("2026-13-40"), false);
  assert.equal(isISODate("nope"), false);
});

test("next friday on or after", () => {
  assert.equal(nextFridayOnOrAfter("2026-11-06"), "2026-11-06"); // friday stays
  assert.equal(nextFridayOnOrAfter("2026-11-07"), "2026-11-13"); // saturday -> next week
  assert.equal(nextFridayOnOrAfter("2026-11-02"), "2026-11-06"); // monday
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("selectable fridays and validation", () => {
  const list = selectableFridays("2026-11-03", 3);
  assert.deepEqual(list, ["2026-11-06", "2026-11-13", "2026-11-20"]);
  assert.equal(isSelectableFriday("2026-11-13", "2026-11-03", 3), true);
  assert.equal(isSelectableFriday("2026-11-27", "2026-11-03", 3), false); // too far
  assert.equal(isSelectableFriday("2026-10-30", "2026-11-03", 3), false); // past
  assert.equal(isSelectableFriday("2026-11-12", "2026-11-03", 3), false); // thursday
  assert.equal(isSelectableFriday(42, "2026-11-03", 3), false);
});

test("today in zone and formatting", () => {
  // 03:00 UTC on Nov 6 is still Nov 5 in New York.
  assert.equal(todayInZone("America/New_York", new Date("2026-11-06T03:00:00Z")), "2026-11-05");
  assert.equal(formatFriday("2026-11-06"), "Friday, November 6, 2026");
  assert.equal(formatFriday("2026-11-06", "short"), "Fri, Nov 6");
});
