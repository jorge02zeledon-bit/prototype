import Image from "next/image";
import { MenuSection } from "@/components/MenuSection";
import { OrderButton } from "@/components/OrderButton";
import { STORE, SLICE_PRICE_CENTS } from "@/lib/menu";
import { formatMoney } from "@/lib/cart";

export default function HomePage() {
  const price = formatMoney(SLICE_PRICE_CENTS).replace(".00", "");
  return (
    <main>
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-inner">
          <h1 id="hero-h" className="display">
            <span>Six</span>
            <span>dollar</span>
            <span>slices.</span>
          </h1>
          <p className="hero-sub">
            Cheese or pepperoni on 72-hour dough, cut big, {price} each. Order here, pick it up hot at {STORE.address}.
          </p>
          <div className="hero-cta">
            <OrderButton />
            <a className="link-under" href="#pickup">How pickup works</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Image src="/images/pepperoni.svg" alt="" width={900} height={900} priority />
        </div>
      </section>

      <div className="band" role="presentation">
        <span>Two slices on the menu.</span>
        <span>Both {price}.</span>
        <span>Ready in fifteen minutes.</span>
      </div>

      <MenuSection />

      <section className="pickup" id="pickup" aria-labelledby="pickup-h">
        <div className="wrap">
          <h2 id="pickup-h" className="h2">Pickup, start to finish</h2>
          <ol className="steps">
            <li>
              <strong>Pick your slices.</strong>
              <span>Any mix of cheese and pepperoni, up to fifty of each.</span>
            </li>
            <li>
              <strong>Pay online.</strong>
              <span>Card, Apple Pay or Google Pay on a secure checkout page. The menu price is the whole price.</span>
            </li>
            <li>
              <strong>Walk in and say your name.</strong>
              <span>Your box is on the counter at the time you chose. We hold it for thirty minutes.</span>
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
