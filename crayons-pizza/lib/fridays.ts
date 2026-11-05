/**
 * Date helpers for "which Friday". Dates are plain YYYY-MM-DD strings so the
 * browser and the server agree without timezone drift.
 */
export type ISODate = string; // YYYY-MM-DD

const DAY_MS = 86_400_000;

export function isISODate(s: unknown): s is ISODate {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function toISODate(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Today's calendar date in a given IANA time zone. */
export function todayInZone(timeZone: string, now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Day of week for a YYYY-MM-DD, 0 = Sunday ... 5 = Friday. */
export function weekday(iso: ISODate): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

export function isFriday(iso: ISODate): boolean {
  return weekday(iso) === 5;
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISODate(new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS));
}

/** The first Friday on or after the given date. */
export function nextFridayOnOrAfter(iso: ISODate): ISODate {
  const d = weekday(iso);
  return addDays(iso, (5 - d + 7) % 7);
}

/** The Fridays a customer may choose: from the next one, for `weeks` weeks. */
export function selectableFridays(today: ISODate, weeks: number): ISODate[] {
  const first = nextFridayOnOrAfter(today);
  return Array.from({ length: weeks }, (_, i) => addDays(first, i * 7));
}

export function isSelectableFriday(iso: unknown, today: ISODate, weeks: number): iso is ISODate {
  return isISODate(iso) && selectableFridays(today, weeks).includes(iso);
}

export function formatFriday(iso: ISODate, style: "long" | "short" = "long"): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: style === "long" ? "long" : "short",
    month: style === "long" ? "long" : "short",
    day: "numeric",
    ...(style === "long" ? { year: "numeric" } : {}),
  }).format(d);
}
