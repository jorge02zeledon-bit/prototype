"use client";

import Image from "next/image";
import { MENU } from "@/lib/menu";
import { formatMoney } from "@/lib/cart";
import { useCart } from "./CartProvider";
import { Stepper } from "./Stepper";

export function MenuSection() {
  const { cart, add } = useCart();
  return (
    <section className="menu" id="menu" aria-labelledby="menu-h">
      <div className="wrap">
        <h2 id="menu-h" className="h2">Two ways to get it</h2>
      </div>
      {MENU.map((item, i) => {
        const qty = cart[item.id] ?? 0;
        const sub = item.kind === "subscription";
        return (
          <article className={`dish ${i % 2 ? "dish-flip" : ""}`} key={item.id} aria-labelledby={`dish-${item.id}`}>
            <div className={`dish-art ${sub ? "dish-art-sub" : ""}`}>
              <Image src={item.image} alt="Cheese pizza" width={720} height={720} sizes="(min-width: 900px) 45vw, 90vw" />
              {sub ? <span className="dish-badge">Every Friday</span> : null}
            </div>
            <div className="dish-body">
              <h3 id={`dish-${item.id}`} className="dish-name">
                {item.name}
              </h3>
              <p className="dish-tagline">{item.tagline}</p>
              <p className="dish-desc">{item.description}</p>
              <p className="dish-price">
                {formatMoney(item.priceCents)}{" "}
                <span>
                  {sub ? `${item.billing?.label}, per slice` : "a slice"}
                  {item.note ? `, ${item.note.toLowerCase()}` : ""}
                </span>
              </p>
              <div className="dish-actions">
                {qty === 0 ? (
                  <button type="button" className="btn btn-primary" onClick={() => add(item.id, 1)}>
                    {sub ? "Subscribe" : "Add a slice"}
                  </button>
                ) : (
                  <>
                    <Stepper id={item.id} label={item.name} size="lg" />
                    <span className="dish-incart">
                      {qty} {sub ? `slice${qty === 1 ? "" : "s"} every Friday` : "in cart"}, {formatMoney(qty * item.priceCents)}
                      {sub ? ` ${item.billing?.label}` : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
