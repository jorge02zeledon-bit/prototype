"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function Header() {
  const { count, open, isOpen } = useCart();
  return (
    <header className="topbar">
      <Link className="wordmark" href="/" aria-label="Crayons Pizza home">
        Crayons Pizza
      </Link>
      <nav className="topnav" aria-label="Site">
        <Link href="/#menu">Menu</Link>
        <Link href="/#pickup">Pickup</Link>
        <Link href="/#hours">Hours</Link>
      </nav>
      <button
        type="button"
        className="cart-btn"
        onClick={open}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="cart-drawer"
      >
        Cart
        <span className="cart-count" aria-label={`${count} slice${count === 1 ? "" : "s"} in cart`}>
          {count}
        </span>
      </button>
    </header>
  );
}
