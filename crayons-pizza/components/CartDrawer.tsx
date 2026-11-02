"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/cart";
import { STORE } from "@/lib/menu";
import { useCart } from "./CartProvider";
import { Stepper } from "./Stepper";

type Step = "cart" | "details";
type Errors = Record<string, string | undefined>;

export function CartDrawer() {
  const { lines, totals, count, cart, set, isOpen, close } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState({ name: "", phone: "", email: "", pickupInMinutes: "", note: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);

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
      if (key === "pickupInMinutes" && errors.pickup) setErrors((er) => ({ ...er, pickup: undefined }));
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
          customer: { name: form.name, phone: form.phone, email: form.email },
          pickupInMinutes: Number(form.pickupInMinutes),
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
                      <span className="line-name">{l.name} slice</span>
                      <span className="line-unit">{formatMoney(l.unitCents)} each</span>
                    </div>
                    <span className="line-total">{formatMoney(l.lineCents)}</span>
                    <Stepper id={l.id} label={l.name} />
                    <button type="button" className="link-btn" onClick={() => set(l.id, 0)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="totals">
                <div>
                  <span>
                    {count} slice{count === 1 ? "" : "s"}
                  </span>
                  <span>{formatMoney(totals.subtotalCents)}</span>
                </div>
                <div className="totals-grand">
                  <span>Total</span>
                  <span>{formatMoney(totals.totalCents)}</span>
                </div>
                <p className="totals-note">No service fee. Pay by card on the next page.</p>
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
                  <div className={`field ${errors.name ? "invalid" : ""}`}>
                    <label htmlFor="f-name">Name for the order</label>
                    <input type="text" autoComplete="name" required {...field("name")} />
                    {errors.name ? <p className="err" id="err-name">{errors.name}</p> : null}
                  </div>
                  <div className={`field ${errors.phone ? "invalid" : ""}`}>
                    <label htmlFor="f-phone">Mobile number</label>
                    <input type="tel" autoComplete="tel" inputMode="tel" placeholder="(555) 123-4567" required {...field("phone")} />
                    {errors.phone ? <p className="err" id="err-phone">{errors.phone}</p> : <p className="hint">We text you if anything changes.</p>}
                  </div>
                  <div className={`field ${errors.email ? "invalid" : ""}`}>
                    <label htmlFor="f-email">Email for the receipt (optional)</label>
                    <input type="email" autoComplete="email" inputMode="email" {...field("email")} />
                    {errors.email ? <p className="err" id="err-email">{errors.email}</p> : null}
                  </div>
                  <div className={`field ${errors.pickup ? "invalid" : ""}`}>
                    <label htmlFor="f-pickupInMinutes">Pick up in</label>
                    <select required {...field("pickupInMinutes")} aria-invalid={errors.pickup ? true : undefined} aria-describedby={errors.pickup ? "err-pickup" : undefined}>
                      <option value="">Choose a time</option>
                      {STORE.pickupSlotsMinutes.map((m) => (
                        <option key={m} value={m}>
                          {m} minutes
                        </option>
                      ))}
                    </select>
                    {errors.pickup ? <p className="err" id="err-pickup">{errors.pickup}</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor="f-note">Anything else? (optional)</label>
                    <textarea rows={2} maxLength={300} placeholder="Well done, extra napkins" {...field("note")} />
                  </div>
                  {errors.form ? <p className="err" role="alert">{errors.form}</p> : null}
                  <div className="stack">
                    <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                      {busy ? "Opening secure checkout" : `Pay ${formatMoney(totals.totalCents)}`}
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
