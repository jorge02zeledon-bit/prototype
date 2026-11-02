"use client";

import { useCart } from "./CartProvider";

export function OrderButton() {
  const { count, open } = useCart();
  if (count > 0) {
    return (
      <button type="button" className="btn btn-primary" onClick={open}>
        Check out {count} slice{count === 1 ? "" : "s"}
      </button>
    );
  }
  return (
    <a className="btn btn-primary" href="#menu">
      Order slices
    </a>
  );
}
