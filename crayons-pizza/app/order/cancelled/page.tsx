import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout cancelled" };

export default function CancelledPage() {
  return (
    <main className="page narrow">
      <h1 className="h2">No charge was made.</h1>
      <p>Your slices are still in the cart whenever you are ready.</p>
      <Link className="btn btn-primary" href="/#menu">Back to the menu</Link>
    </main>
  );
}
