"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/cart";
import { formatFriday, type ISODate } from "@/lib/fridays";
import { GRADES } from "@/lib/menu";
import { useCart } from "./CartProvider";
import { FridayPicker } from "./FridayPicker";
import { Stepper } from "./Stepper";

type Step = "cart" | "details";
type Errors = Record<string, string | undefined>;

export function CartDrawer() {
  const { lines, totals, count, cart, set, isOpen, close } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState({ name: "", student: "", grade: "", classroom: "", phone: "", email: "", note: "" });
  const [pickupDate, setPickupDate] = useState<ISODate | "">("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);

  const subscribing = lines.some((l) => l.kind === "subscription");
  const oneOff = lines.some((l) => l.kind === "one-off");

  useEffect(() => {
    if (!isOpen) return;
    returnFocus.current = document.activeElement;
    document.body.classList.add("drawer-open");
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href]")].filter(
          (n) => !n.hasAttribute("disabled"),
        );
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("drawer-open");
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (count === 0) setStep("cart");
  }, [count]);

  if (!isOpen) return null;

  const field = (key: keyof typeof form) => ({
    id: `f-${key}`,
    name: key,
    value: form[key],
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `err-${key}` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cart,
          customer: { name: form.name, student: form.student, grade: form.grade, classroom: form.classroom, phone: form.phone, email: form.email },
          pickupDate,
          note: form.note,
        }),
      });
      const data = (await res.json()) as { url?: string; errors?: Errors };
      if (!res.ok || !data.url) {
        setErrors(data.errors ?? { form: "Payment could not be started. Try again." });
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setErrors({ form: "We could not reach the server. Check your connection and try again." });
      setBusy(false);
    }
  }

  const dateLabel = subscribing && oneOff ? "Your first Friday" : subscribing ? "Start on which Friday?" : "Pick up on which Friday?";
  const payLabel = subscribing
    ? `Pay ${formatMoney(totals.totalCents)} today`
    : `Pay ${formatMoney(totals.totalCents)}`;

  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" ref={panel}>
        <div className="drawer-head">
          <h2 id="drawer-title" className="h3">
            {step === "details" ? "Pickup details" : "Your order"}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close cart" onClick={close} ref={closeBtn}>
            ×
          </button>
        </div>

        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="empty">
              <p>Nothing in the box yet.</p>
              <a className="btn btn-primary" href="#menu" onClick={close}>
                See the menu
              </a>
            </div>
          ) : (
            <>
              <ul className="lines">
                {lines.map((l) => (
                  <li key={l.id} className="line">
                    <div className="line-main">
                      <span className="line-name">{l.kind === "subscription" ? "Every Friday" : "One Friday"}</span>
                      <span className="line-unit">
                        {formatMoney(l.unitCents)} {l.kind === "subscription" ? `${l.billing?.label} per slice` : "a slice"}
                      </span>
                    </div>
                    <span className="line-total">
                      {formatMoney(l.lineCents)}
                      {l.kind === "subscription" ? <small> {l.billing?.label}</small> : null}
                    </span>
                    <Stepper id={l.id} label={l.name} />
                    <button type="button" className="link-btn" onClick={() => set(l.id, 0)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="totals">
                {oneOff ? (
                  <div>
                    <span>One-time slices</span>
                    <span>{formatMoney(totals.oneOffCents)}</span>
                  </div>
                ) : null}
                {subscribing ? (
                  <div>
                    <span>Subscription, every 4 weeks</span>
                    <span>{formatMoney(totals.recurringCents)}</span>
                  </div>
                ) : null}
                <div className="totals-grand">
                  <span>{subscribing ? "Due today" : "Total"}</span>
                  <span>{formatMoney(totals.totalCents)}</span>
                </div>
                <p className="totals-note">
                  {subscribing
                    ? `Then ${formatMoney(totals.recurringCents)} every 4 weeks until you cancel. No service fee.`
                    : "No service fee. Pay by card on the next page."}
                </p>
              </div>

              {step === "cart" ? (
                <div className="stack">
                  <button type="button" className="btn btn-primary btn-block" onClick={() => setStep("details")}>
                    Check out
                  </button>
                  <button type="button" className="btn btn-ghost btn-block" onClick={close}>
                    Keep ordering
                  </button>
                </div>
              ) : (
                <form className="form" onSubmit={submit} noValidate>
                  <div className={`field ${errors.pickupDate ? "invalid" : ""}`}>
                    <span className="field-label" id="lbl-pickupDate">{dateLabel}</span>
                    <FridayPicker
                      value={pickupDate}
                      onChange={(d) => {
                        setPickupDate(d);
                        if (errors.pickupDate) setErrors((er) => ({ ...er, pickupDate: undefined }));
                      }}
                      describedBy={errors.pickupDate ? "err-pickupDate" : "lbl-pickupDate"}
                      invalid={!!errors.pickupDate}
                    />
                    {errors.pickupDate ? <p className="err" id="err-pickupDate">{errors.pickupDate}</p> : null}
                    {subscribing && pickupDate ? (
                      <p className="hint">First slice {formatFriday(pickupDate, "short")}, then every Friday after.</p>
                    ) : null}
                  </div>
                  <div className={`field ${errors.name ? "invalid" : ""}`}>
                    <label htmlFor="f-name">Your name</label>
                    <input type="text" autoComplete="name" required {...field("name")} />
                    {errors.name ? <p className="err" id="err-name">{errors.name}</p> : null}
                  </div>
                  <div className={`field ${errors.student ? "invalid" : ""}`}>
                    <label htmlFor="f-student">Student&apos;s name</label>
                    <input type="text" autoComplete="off" maxLength={80} required {...field("student")} />
                    {errors.student ? <p className="err" id="err-student">{errors.student}</p> : <p className="hint">The slice is set aside under this name.</p>}
                  </div>
                  <div className="two-up">
                    <div className={`field ${errors.grade ? "invalid" : ""}`}>
                      <label htmlFor="f-grade">Grade</label>
                      <select required {...field("grade")}>
                        <option value="">Choose</option>
                        {GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                      {errors.grade ? <p className="err" id="err-grade">{errors.grade}</p> : null}
                    </div>
                    <div className={`field ${errors.classroom ? "invalid" : ""}`}>
                      <label htmlFor="f-classroom">Teacher or room</label>
                      <input type="text" autoComplete="off" maxLength={60} required placeholder="Ms. Rivera, Rm 12" {...field("classroom")} />
                      {errors.classroom ? <p className="err" id="err-classroom">{errors.classroom}</p> : null}
                    </div>
                  </div>
                  <div className={`field ${errors.phone ? "invalid" : ""}`}>
                    <label htmlFor="f-phone">Mobile number</label>
                    <input type="tel" autoComplete="tel" inputMode="tel" placeholder="(555) 123-4567" required {...field("phone")} />
                    {errors.phone ? <p className="err" id="err-phone">{errors.phone}</p> : <p className="hint">We text you if anything changes.</p>}
                  </div>
                  <div className={`field ${errors.email ? "invalid" : ""}`}>
                    <label htmlFor="f-email">Email for the receipt {subscribing ? "" : "(optional)"}</label>
                    <input type="email" autoComplete="email" inputMode="email" {...field("email")} />
                    {errors.email ? <p className="err" id="err-email">{errors.email}</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor="f-note">Anything else? (optional)</label>
                    <textarea rows={2} maxLength={300} placeholder="Well done, extra napkins" {...field("note")} />
                  </div>
                  {errors.form ? <p className="err" role="alert">{errors.form}</p> : null}
                  <div className="stack">
                    <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                      {busy ? "Opening secure checkout" : payLabel}
                    </button>
                    <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep("cart")} disabled={busy}>
                      Back
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
