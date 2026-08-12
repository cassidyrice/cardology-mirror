'use client';

import { ScrollScrub, type ScrollScrubScene } from "./ScrollScrub";

const JOURNEY_SCENES: ScrollScrubScene[] = [
  {
    id: "the-deck",
    label: "The Deck",
    kicker: "Personal Card Blueprint · instant report",
    title: "Your birthday carries a pattern.",
    body: "Every birthday maps to exactly one card in a fixed 52-card order. Find yours free, then put the full pattern in writing.",
    clip: "/brand/journey/scene-01.mp4",
    mobileClip: "/brand/journey/scene-01-mobile.mp4",
    poster: "/brand/journey/scene-01-poster.png",
    mobilePoster: "/brand/journey/scene-01-mobile-poster.png",
    scroll: 1.45,
    tags: ["52 cards", "366 birthdays"],
    actions: (
      <>
        <a className="journey-primary" href="/birth-card-calculator">
          Find Your Birth Card Free
        </a>
        <a className="journey-secondary" href="/products/personal-card-blueprint">
          Get My Blueprint · $13
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
    poster: "/brand/journey/scene-02-poster.png",
    mobilePoster: "/brand/journey/scene-02-mobile-poster.png",
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
    poster: "/brand/journey/scene-03-poster.png",
    mobilePoster: "/brand/journey/scene-03-mobile-poster.png",
    scroll: 1.35,
    tags: ["Reflection, not fortune-telling"],
  },
  {
    id: "the-blueprint",
    label: "The Blueprint",
    kicker: "Personal Card Blueprint",
    title: "Put your pattern in writing.",
    body: "Your birth card, ruling layer, current chapter, and reflection prompts in one personalized report you can open immediately after checkout.",
    clip: "/brand/journey/scene-04.mp4",
    mobileClip: "/brand/journey/scene-04-mobile.mp4",
    poster: "/brand/journey/scene-04-poster.png",
    mobilePoster: "/brand/journey/scene-04-mobile-poster.png",
    scroll: 1.45,
    align: "right",
    tags: ["Instant written report"],
    actions: (
      <>
        <a className="journey-primary" href="/products/personal-card-blueprint">
          Get My Blueprint · $13
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
