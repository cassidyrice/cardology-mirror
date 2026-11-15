import { SampleTabs } from "@/components/home/SampleTabs";
import { getCardSeo } from "@/lib/seo-cards";

/**
 * Notes from the reading desk: shows what an actual Email or Text Message
 * answer from The Card Blueprint Reading ($99) sounds like — real spread dates, Cass's voice.
 */
export function ReadingSample() {
  const card = getCardSeo("8♦");
  const panels = [
    {
      id: "email-sample",
      label: "Sample email excerpt",
      text: "Your 4♦ sits in his Mars seat, and in his ruling spread it sits in his Venus seat — magnetic and hard to ignore. Going the other way, his cards don’t land in your spread, so the pull runs one way. Dec 24 to Jan 24 you’re both on the 10♣. Ask your question plainly inside that window instead of carrying a maybe into your Neptune season on Jan 25. — Cass",
    },
    {
      id: "sms-sample",
      label: "Sample text message",
      text: "4♦ (8♦) + K♣ (J♦): One-way pull from him toward you — your 4♦ sits in his Mars & Venus seats, zero Moon tie back. He’s in 7♥ Venus through Dec 23 (analyzing, not acting). Your shared 10♣ window opens Dec 24–Jan 24: ask once in plain words before Jan 25 fog hits. — Cass",
    },
    {
      id: "card-lens",
      label: "How we read a card",
      text: card?.sweetSpot ?? "",
    },
  ].filter((p) => p.text);

  return (
    <>
      <figure className="sample-plate">
        <img
          src="/share-cards/faces/8-of-diamonds.png"
          width="1000"
          height="1500"
          alt="Eight of Diamonds playing card"
          loading="lazy"
          decoding="async"
        />
        <figcaption className="sample-caption">
          The reader in this sample has the 4♦ birth card; this is her ruling card, the 8♦{card?.title ? `, ${card.title}` : ""}. Standard 52-card math, not tarot.
        </figcaption>
      </figure>
      <div className="sample-text">
        <SampleTabs panels={panels} />
        <h2 id="home-sample-title" className="sample-title" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
          Suggested Questions download.<br />48 hours to ask up to 3.
        </h2>
        <p className="sample-desc" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
          Once you book <strong>The Card Blueprint Reading ($99)</strong>, you immediately get our Suggested Questions Guide (.pdf) plus a 48-hour Reading Pass to ask up to 3 questions — your own timing, career, blind spots, or two-person chemistry. Cass reviews your exact spread and sends each answer by email or text.
        </p>
        <div className="sample-actions" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
          <a
            className="sample-cell is-ink"
            href="/#readings"
            data-open-question-track="card-blueprint-reading"
            data-placement="sample-primary"
          >
            The Card Blueprint Reading · $99
          </a>
        </div>
        <p className="sample-note">
          Up to 3 questions within 48 hours of purchase · Answered within 48h (almost all under 24h).
        </p>
      </div>
    </>
  );
}
