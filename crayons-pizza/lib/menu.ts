/**
 * The menu is the single source of truth for what can be bought and for
 * how much. The checkout API prices every order from this file, never from
 * numbers the browser sends, so a tampered cart cannot change what is charged.
 */
export type MenuItem = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  /** Shown as a small note on the card. */
  note?: string;
  /** Path under /public used for the item image. */
  image: string;
};

export const SLICE_PRICE_CENTS = 600; // $6.00 per slice

export const MENU: readonly MenuItem[] = [
  {
    id: "cheese",
    name: "Cheese",
    tagline: "One slice. Done right, every time.",
    description:
      "72-hour dough, crushed San Marzano tomatoes, whole-milk mozzarella, a little pecorino, basil out of the oven.",
    priceCents: SLICE_PRICE_CENTS,
    note: "Vegetarian",
    image: "/images/cheese.svg",
  },
] as const;

export const MAX_QTY_PER_ITEM = 50;

export function findMenuItem(id: string): MenuItem | undefined {
  return MENU.find((m) => m.id === id);
}

export const STORE = {
  name: "Crayons Pizza",
  tagline: "Every slice, six dollars.",
  address: "11406 W State Rd 84",
  city: "Davie, Florida 33325",
  phone: "(555) 010-0118",
  hours: [
    { days: "Monday to Thursday", open: "11:00 AM", close: "9:00 PM" },
    { days: "Friday and Saturday", open: "11:00 AM", close: "11:00 PM" },
    { days: "Sunday", open: "12:00 PM", close: "8:00 PM" },
  ],
  pickupSlotsMinutes: [15, 30, 45, 60] as const,
};
