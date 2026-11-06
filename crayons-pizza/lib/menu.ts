/**
 * The products are the single source of truth for what can be bought and for
 * how much. The checkout API prices every order from this file, never from
 * numbers the browser sends, so a tampered cart cannot change what is charged.
 */
export type ProductKind = "one-off" | "subscription";

export type Product = {
  id: string;
  kind: ProductKind;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  /** For subscriptions: how often the price is charged. */
  billing?: { interval: "week" | "month"; intervalCount: number; label: string };
  note?: string;
  /** Path under /public used for the product image. */
  image: string;
  /** Label for the quantity being chosen. */
  unitLabel: string;
};

export const SLICE_PRICE_CENTS = 600; // $6.00 for one slice, one Friday
export const SUBSCRIPTION_PRICE_CENTS = 2400; // $24.00 for a slice every Friday, four Fridays at a time

export const MENU: readonly Product[] = [
  {
    id: "cheese",
    kind: "one-off",
    name: "One Friday",
    tagline: "A cheese slice, one Friday, six dollars.",
    description:
      "Wider than a normal slice, with a soft crust and cheese that covers it edge to edge. Thick, doughy crust, tomato sauce, and a heavy layer of mozzarella. No other toppings.",
    priceCents: SLICE_PRICE_CENTS,
    note: "Vegetarian",
    image: "/images/cheese.svg",
    unitLabel: "slice",
  },
  {
    id: "friday-club",
    kind: "subscription",
    name: "Every Friday",
    tagline: "The same slice, every Friday, for $24 a month.",
    description:
      "One cheese slice waiting for you every Friday. Billed every four Fridays, which works out to the same $6 a slice. Pick your first Friday. Cancel any time.",
    priceCents: SUBSCRIPTION_PRICE_CENTS,
    billing: { interval: "week", intervalCount: 4, label: "every 4 weeks" },
    note: "Cancel any time",
    image: "/images/cheese.svg",
    unitLabel: "slice every Friday",
  },
] as const;

export const MAX_QTY_PER_ITEM = 50;

/** Grades offered at checkout. Edit to match the school. */
export const GRADES = ["Pre-K", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"] as const;
export type Grade = (typeof GRADES)[number];

export function findProduct(id: string): Product | undefined {
  return MENU.find((m) => m.id === id);
}

export const STORE = {
  name: "Crayons Pizza",
  tagline: "Every slice, six dollars.",
  address: "11406 W State Rd 84",
  city: "Davie, Florida 33325",
  phone: "(954) 452-1616",
  timeZone: "America/New_York",
  /** Online orders are picked up on Fridays during these hours. */
  fridayPickup: { open: "9:00 AM", close: "5:00 PM" },
  hours: [{ days: "Monday to Friday", open: "9:00 AM", close: "5:00 PM" }],
  /** How far ahead a Friday can be chosen. */
  maxWeeksAhead: 8,
};
