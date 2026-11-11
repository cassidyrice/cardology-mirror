import { QuestionReadingComposer } from "@/components/checkout/QuestionReadingDrawer";
import {
  READINGS_NAV,
  READING_FOLLOW_UP,
  READING_RESPONSE_TIME,
  READING_SUPPORT_EMAIL,
} from "@/lib/readings-nav";

function includesLine(items: readonly string[]): string {
  const parts = items.map((item) => item.replace(/\.$/, ""));
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(". ")}. ${parts[parts.length - 1]}.`;
}

export function ManualReadingOffers() {
  return (
    <>
      <div className="offer-menu">
        <section className="offer-group" aria-label="The Card Blueprint Reading">
          <ul className="offer-list">
            {READINGS_NAV.map((reading) => (
              <li
                id={reading.id}
                key={reading.id}
                className="offer-row"
              >
                <div className="offer-line">
                  <h3 className="offer-name">{reading.title}</h3>
                  <span className="offer-price tnum">{reading.price}</span>
                </div>
                <p className="offer-who">{reading.who}</p>
                <p className="offer-desc">{reading.description}</p>
                <p className="offer-includes">
                  Includes {includesLine(reading.includes).replace(/^./, (c) => c.toLowerCase())}
                </p>
                <p className="offer-delivery">{reading.delivery}</p>
                <div className="offer-actions">
                  <a
                    href={reading.checkoutHref}
                    data-open-question-track={reading.id}
                    data-placement={`offer-row-${reading.id}`}
                    data-order-reading={reading.id}
                    className="accent-button offer-order"
                  >
                    Book The Card Blueprint Reading · $99
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div id="ask-question-inline" className="qr-home-inline">
        <QuestionReadingComposer
          defaultTrack="card-blueprint-reading"
          placement="homepage-readings-section"
          heading="Book The Card Blueprint Reading — $99"
          subheading="Pay inline without leaving this page, get your Suggested Questions Guide (.pdf) immediately, and use your 48-hour Reading Pass to ask up to 3 questions (solo timing or two-person chemistry) by email or text."
        />
      </div>

      <div className="offer-footnote">
        <p>{READING_FOLLOW_UP}</p>
        <p>
          Questions before or after ordering? Email{" "}
          <a href={`mailto:${READING_SUPPORT_EMAIL}`}>{READING_SUPPORT_EMAIL}</a>. {READING_RESPONSE_TIME}
        </p>
      </div>
    </>
  );
}
