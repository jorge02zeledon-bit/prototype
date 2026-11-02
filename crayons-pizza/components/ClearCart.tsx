"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Mounted on the success page: the order is paid, so the cart starts fresh. */
export function ClearCart() {
  const { clear, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);
  return null;
}
