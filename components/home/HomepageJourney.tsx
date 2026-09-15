'use client';

import { ScrollScrub, type ScrollScrubScene } from "./ScrollScrub";

const JOURNEY_SCENES: ScrollScrubScene[] = [
  {
    id: "the-deck",
    label: "The Deck",
    kicker: "One Question Reading · written within 2 business days",
    title: "Your birthday carries a pattern.",
    body: "Every birthday maps to exactly one card in a fixed 52-card order. Find yours free, then unlock your whole year.",
    clip: "/brand/journey/scene-01.mp4",
    mobileClip: "/brand/journey/scene-01-mobile.mp4",
    poster: "/brand/journey/scene-01-poster.webp",
    mobilePoster: "/brand/journey/scene-01-mobile-poster.webp",
    scroll: 1.45,
    tags: ["52 cards", "366 birthdays"],
    actions: (
      <>
        <a className="journey-primary" href="/birth-card-calculator">
          Find Your Birth Card Free
        </a>
        <a className="journey-secondary" href="/products/one-question-reading">
          Ask one question · $13
        </a>
      </>
    ),
  },
  {
    id: "the-fan",
    label: "The Fan",
    title: "One card is already yours.",
    body: "Your birth date resolves to a single fixed card. It does not change with the year, the mood, or the market.",
    clip: "/brand/journey/scene-02.mp4",
    mobileClip: "/brand/journey/scene-02-mobile.mp4",
    poster: "/brand/journey/scene-02-poster.webp",
    mobilePoster: "/brand/journey/scene-02-mobile-poster.webp",
    scroll: 1.35,
    align: "right",
    tags: ["Fixed by your birth date"],
  },
  {
    id: "the-pull",
    label: "The Pull",
    title: "Rank, suit, and the layer beneath.",
    body: "A card carries its rank, suit, and ruling layer. Read together, they form a pattern for reflection rather than prediction.",
    clip: "/brand/journey/scene-03.mp4",
    mobileClip: "/brand/journey/scene-03-mobile.mp4",
    poster: "/brand/journey/scene-03-poster.webp",
    mobilePoster: "/brand/journey/scene-03-mobile-poster.webp",
    scroll: 1.35,
    tags: ["Reflection, not fortune-telling"],
  },
  {
    id: "the-blueprint",
    label: "The Blueprint",
    kicker: "One Question Reading",
    title: "See your whole year on one map.",
    body: "Your birth card, the 52-day chapter you are in right now, all seven chapters, and the yearly story arc in one phone-friendly app you can open the moment payment clears.",
    clip: "/brand/journey/scene-04.mp4",
    mobileClip: "/brand/journey/scene-04-mobile.mp4",
    poster: "/brand/journey/scene-04-poster.webp",
    mobilePoster: "/brand/journey/scene-04-mobile-poster.webp",
    scroll: 1.45,
    align: "right",
    tags: ["Instant · 12 months of access"],
    actions: (
      <>
        <a className="journey-primary" href="/products/one-question-reading">
          Ask one question · $13
        </a>
        <a className="journey-secondary" href="/birth-card-calculator">
          Find Your Birth Card Free
        </a>
      </>
    ),
  },
];

const JOURNEY_THEME = {
  accent: "var(--oxblood)",
  background: "var(--paper)",
  ink: "var(--ink)",
  muted: "var(--ink-soft)",
};

export function HomepageJourney() {
  return (
    <ScrollScrub
      className="homepage-journey"
      scenes={JOURNEY_SCENES}
      theme={JOURNEY_THEME}
    />
  );
}
