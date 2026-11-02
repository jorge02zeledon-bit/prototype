"use client";

import { MAX_QTY_PER_ITEM } from "@/lib/menu";
import { useCart } from "./CartProvider";

export function Stepper({ id, label, size = "md" }: { id: string; label: string; size?: "md" | "lg" }) {
  const { cart, add, set } = useCart();
  const qty = cart[id] ?? 0;
  return (
    <div className={`stepper stepper-${size}`}>
      <button type="button" aria-label={`Remove one ${label} slice`} disabled={qty === 0} onClick={() => add(id, -1)}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_QTY_PER_ITEM}
        value={qty}
        aria-label={`${label} slices`}
        onChange={(e) => set(id, Number(e.target.value))}
      />
      <button type="button" aria-label={`Add one ${label} slice`} disabled={qty >= MAX_QTY_PER_ITEM} onClick={() => add(id, 1)}>
        +
      </button>
    </div>
  );
}
