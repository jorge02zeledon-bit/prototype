import Image from "next/image";
import { MenuSection } from "@/components/MenuSection";
import { OrderButton } from "@/components/OrderButton";
import { STORE, SLICE_PRICE_CENTS, SUBSCRIPTION_PRICE_CENTS } from "@/lib/menu";
import { formatMoney } from "@/lib/cart";

export default function HomePage() {
  const price = formatMoney(SLICE_PRICE_CENTS).replace(".00", "");
  const subPrice = formatMoney(SUBSCRIPTION_PRICE_CENTS).replace(".00", "");
  return (
    <main>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-inner">
          <h1 id="hero-h" className="display">
            <span>Six</span>
            <span>dollar</span>
            <span>Fridays.</span>
          </h1>
          <p className="hero-sub">
            A cheese slice on 72-hour dough, {price} a Friday, or {subPrice} a month for every Friday. Pick your Friday on the
            calendar and it is hot when you walk in at {STORE.address} in Davie.
          </p>
          <div className="hero-cta">
            <OrderButton />
            <a className="link-under" href="#pickup">How pickup works</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Image src="/images/cheese.svg" alt="" width={900} height={900} priority />
        </div>
      </section>

      <div className="band" role="presentation">
        <span>One Friday, {price}.</span>
        <span>Every Friday, {subPrice} a month.</span>
        <span>Fridays {STORE.fridayPickup.open} to {STORE.fridayPickup.close}.</span>
      </div>

      <MenuSection />

      <section className="pickup" id="pickup" aria-labelledby="pickup-h">
        <div className="wrap">
          <h2 id="pickup-h" className="h2">Pickup, start to finish</h2>
          <ol className="steps">
            <li>
              <strong>Choose one Friday or every Friday.</strong>
              <span>One-time slices are {price} each. The subscription is {subPrice} every four Fridays and you can cancel any time.</span>
            </li>
            <li>
              <strong>Pick the Friday on the calendar.</strong>
              <span>For a subscription that is your first Friday. Up to {STORE.maxWeeksAhead} weeks ahead.</span>
            </li>
            <li>
              <strong>Pay online, then say your name at the counter.</strong>
              <span>
                Card, Apple Pay or Google Pay on a secure page. Your slice is ready on Friday between {STORE.fridayPickup.open} and{" "}
                {STORE.fridayPickup.close}.
              </span>
            </li>
          </ol>
        </div>
      </section>

      <section className="hours" id="hours" aria-labelledby="hours-h">
        <div className="wrap hours-grid">
          <div>
            <h2 id="hours-h" className="h2">Find us</h2>
            <address>
              <strong>{STORE.name}</strong>
              <br />
              {STORE.address}
              <br />
              {STORE.city}
              <br />
              <a href={`tel:${STORE.phone.replace(/\D/g, "")}`}>{STORE.phone}</a>
            </address>
          </div>
          <div>
            <h3 className="h3">Hours</h3>
            <table className="hours-table">
              <tbody>
                {STORE.hours.map((h) => (
                  <tr key={h.days}>
                    <th scope="row">{h.days}</th>
                    <td>
                      {h.open} to {h.close}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hours-note">
              Online orders are picked up on Fridays, {STORE.fridayPickup.open} to {STORE.fridayPickup.close}.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span className="wordmark">Crayons Pizza</span>
          <span>
            {STORE.address}, {STORE.city}
          </span>
        </div>
      </footer>
    </main>
  );
}
