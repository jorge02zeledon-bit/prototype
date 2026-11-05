"use client";

import { useMemo, useState } from "react";
import { addDays, formatFriday, isFriday, todayInZone, type ISODate, selectableFridays } from "@/lib/fridays";
import { STORE } from "@/lib/menu";

type Props = {
  value: ISODate | "";
  onChange: (date: ISODate) => void;
  id?: string;
  describedBy?: string;
  invalid?: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A month calendar where only upcoming Fridays can be chosen. */
export function FridayPicker({ value, onChange, id = "friday-picker", describedBy, invalid }: Props) {
  const today = useMemo(() => todayInZone(STORE.timeZone), []);
  const allowed = useMemo(() => new Set(selectableFridays(today, STORE.maxWeeksAhead)), [today]);
  const first = [...allowed][0];
  const last = [...allowed][allowed.size - 1];
  const [view, setView] = useState(() => (value || first).slice(0, 7)); // YYYY-MM

  const [y, m] = view.split("-").map(Number);
  const monthStart = `${view}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const leading = new Date(`${monthStart}T00:00:00Z`).getUTCDay();
  const cells: (ISODate | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i)),
  ];
  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    new Date(`${monthStart}T00:00:00Z`),
  );
  const canPrev = view > first.slice(0, 7);
  const canNext = view < last.slice(0, 7);
  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setView(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className={`cal ${invalid ? "invalid" : ""}`} id={id} role="group" aria-label="Choose a Friday" aria-describedby={describedBy}>
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month">
          ‹
        </button>
        <span className="cal-month" aria-live="polite">{monthLabel}</span>
        <button type="button" className="cal-nav" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="cal-grid" role="grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className={`cal-wd ${w === "Fri" ? "cal-wd-fri" : ""}`} role="columnheader" aria-label={w}>
            {w[0]}
          </span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={`e${i}`} className="cal-empty" />
          ) : allowed.has(d) ? (
            <button
              key={d}
              type="button"
              className={`cal-day cal-friday ${value === d ? "selected" : ""}`}
              aria-pressed={value === d}
              aria-label={formatFriday(d)}
              onClick={() => onChange(d)}
            >
              {Number(d.slice(8))}
            </button>
          ) : (
            <span key={d} className={`cal-day ${isFriday(d) ? "cal-past-friday" : ""}`} aria-hidden="true">
              {Number(d.slice(8))}
            </span>
          ),
        )}
      </div>
      <p className="cal-foot">{value ? formatFriday(value) : "Fridays only. Tap one."}</p>
    </div>
  );
}
