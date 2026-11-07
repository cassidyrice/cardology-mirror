import {
  READINGS_NAV,
  READING_FOLLOW_UP,
  READING_RESPONSE_TIME,
  READING_SUPPORT_EMAIL,
} from "@/lib/readings-nav";

/**
 * The offers set the way a menu sets prices (docs/design/DIRECTION.md §3):
 * name left, price right on the same baseline, the description beneath, what
 * it includes in one line. Public descriptions and purchase links only;
 * fulfillment happens privately. Each row tells the homepage stage which
 * product shot to show while it is nearest the middle of the screen.
 */
const GROUPS = [
  { name: "Just you", ids: ["birth-card-blueprint", "timing-map", "collector-pack"] },
  { name: "You and them", ids: ["chemistry-check", "family-snapshot"] },
] as const;

function includesLine(items: readonly string[]): string {
  const parts = items.map((item) => item.replace(/\.$/, ""));
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(". ")}. ${parts[parts.length - 1]}.`;
}

export function ManualReadingOffers() {
  return (
    <>
      <div className="offer-menu">
        {GROUPS.map((group) => (
          <section key={group.name} className="offer-group" aria-labelledby={`offers-${group.ids[0]}`}>
            <h3 id={`offers-${group.ids[0]}`} className="offer-group-name">{group.name}</h3>
            <ul className="offer-list">
              {group.ids
                .map((id) => READINGS_NAV.find((reading) => reading.id === id))
                .filter((reading): reading is (typeof READINGS_NAV)[number] => Boolean(reading))
                .map((reading) => (
                  <li
                    id={reading.id}
                    key={reading.id}
                    className="offer-row"
                    data-stage-src={reading.image}
                    data-stage-alt={`${reading.title} preview`}
                  >
                    <div className="offer-line">
                      <h4 className="offer-name">{reading.title}</h4>
                      <span className="offer-price tnum">{reading.price}</span>
                    </div>
                    <p className="offer-who">{reading.who}</p>
                    {reading.image ? (
                      <img
                        src={reading.image}
                        alt={`${reading.title} preview`}
                        width={1600}
                        height={1000}
                        loading="lazy"
                        decoding="async"
                        className="offer-image"
                      />
                    ) : null}
                    <p className="offer-desc">{reading.description}</p>
                    <p className="offer-includes">Includes {includesLine(reading.includes).replace(/^./, (c) => c.toLowerCase())}</p>
                    <p className="offer-delivery">
                      {reading.delivery ?? "Personally prepared. Private. Delivered by email."}
                    </p>
                    <div className="offer-actions">
                      {reading.checkoutHref ? (
                        <a
                          href={reading.checkoutHref}
                          data-order-reading={reading.id}
                          className="accent-button offer-order"
                          aria-label={`Order on Stan: ${reading.title}`}
                        >
                          Order on Stan
                        </a>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled
                            data-order-reading={reading.id}
                            aria-describedby={`${reading.id}-availability`}
                            className="accent-button offer-order"
                            aria-label={`Order on Stan: ${reading.title}`}
                          >
                            Order on Stan
                          </button>
                          <p id={`${reading.id}-availability`} className="offer-sample">Ordering opens soon. Sit tight.</p>
                        </>
                      )}
                      {reading.sampleHref ? (
                        <a href={reading.sampleHref} className="editorial-link offer-sample">See a sample first (PDF)</a>
                      ) : null}
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="offer-footnote">
        <p>{READING_FOLLOW_UP}</p>
        <p>
          Questions about your reading? Email{" "}
          <a href={`mailto:${READING_SUPPORT_EMAIL}`}>{READING_SUPPORT_EMAIL}</a>. {READING_RESPONSE_TIME}
        </p>
      </div>
    </>
  );
}
