import { SampleTabs } from "@/components/home/SampleTabs";
import { getCardSeo } from "@/lib/seo-cards";

/**
 * Notes from the reading desk: shows what an actual Email or Text Message
 * question reading sounds like — zero PDF filler, real spread dates, Cass's voice.
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
          Birth card for February 17. {card?.title ? `${card.title}.` : ""} Standard 52-card math, not tarot.
        </figcaption>
      </figure>
      <div className="sample-text">
        <SampleTabs panels={panels} />
        <h2 id="home-sample-title" className="sample-title" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
          No 19-page PDF.<br />Just the answer, with dates.
        </h2>
        <p className="sample-desc" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
          You type your actual question and pick email or text message. Our spread engine maps every permanent seat and 52-day planetary window, drafts three distinct angles, and Cass personally reviews and approves the one that goes to your inbox or phone.
        </p>
        <div className="sample-actions" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
          <a
            className="sample-cell is-ink"
            href="/#timing-map"
            data-open-question-track="timing-map"
            data-placement="sample-timing"
          >
            Solo Timing Question · $26
          </a>
          <a
            className="sample-cell"
            href="/#chemistry-check"
            data-open-question-track="chemistry-check"
            data-placement="sample-chemistry"
          >
            Compatibility Question · $39
          </a>
        </div>
        <p className="sample-note">
          48-hour response window — almost all readings arrive in under 24 hours.
        </p>
      </div>
    </>
  );
}
