// The three Card Blueprints readings. Sold on Stan Store and written by hand
// (custom PDF within 7 days); nothing here is fulfilled automatically.

export type ReadingItem = { label: string; text: string };
export type ReadingPart = { title: string; items: readonly ReadingItem[] };
export type Reading = {
  id: "chemistry-check" | "timing-map" | "family-snapshot";
  name: string;
  price: string;
  who: string;
  hook: string;
  parts: readonly ReadingPart[];
  delivery: string;
  url: string;
};

const DELIVERY = "Delivered as a private, custom-written PDF to your inbox within 7 days.";

export const READINGS: readonly Reading[] = [
  {
    id: "chemistry-check",
    name: "The Chemistry Check",
    price: "$97",
    who: "For two people",
    hook: "You know the feeling—one minute it flows effortlessly, the next you're hitting an invisible wall over the smallest thing. Instead of guessing what’s going on underneath the surface, get a two-part look at how the two of you are wired to interact—and how your lives are intersecting right now.",
    parts: [
      {
        title: "Part 1: The Core Dynamic",
        items: [
          { label: "How You’re Both Wired", text: "A clear look at your baseline personalities and how your natural instincts show up in a relationship." },
          { label: "Where You Click & Where You Clash", text: "Why certain parts of your connection feel automatic and easy to trust, plus the hidden blind spots and friction loops you keep tripping over." },
        ],
      },
      {
        title: "Part 2: Your Current Year Together",
        items: [
          { label: "Where You Are Right Now", text: "The personal season each of you is currently moving through, and why one of you might be craving momentum while the other needs space." },
          { label: "Where You Show Up in Each Other’s Year", text: "The exact windows over the next 12 months where your timelines cross—showing when the pressure flares up, when things soften, and 3 practical ways to reconnect when you’re out of sync." },
        ],
      },
    ],
    delivery: DELIVERY,
    url: "https://stan.store/mycardblueprint/p/the-chemistry-check",
  },
  {
    id: "timing-map",
    name: "Your 12-Month Timing Map",
    price: "$137",
    who: "You + 2 key people in your life",
    hook: "Stop pushing when you’re meant to pause, and stop second-guessing when it’s time to move. Your year doesn’t happen in a vacuum—so this two-part pacing guide maps out your personal momentum alongside two of the most important people in your world.",
    parts: [
      {
        title: "Part 1: Your Personal Pacing & Core Wiring",
        items: [
          { label: "Your Baseline & Yearly Theme", text: "How you naturally operate at your best (and under stress), paired with the big-picture focus shaping your next 12 months." },
          { label: "Your Seven Personal Seasons", text: "Your year broken down into seven distinct, dated chapters—each with its own rhythm and focus so you know what kind of energy to bring to the table." },
        ],
      },
      {
        title: "Part 2: Who Shows Up in Your Year (Includes 2 Extra Birthdates)",
        items: [
          { label: "Your Shared Friction & Flow", text: "A quick look at the natural alignment and tension points between you and your two chosen people (partner, business partner, child, or friend)." },
          { label: "When They Cross Your Path", text: "Exactly where and when those two people show up in your timeline this year—highlighting the specific dates and seasons when your dynamics will take center stage, and how to navigate them before you make big calls." },
        ],
      },
    ],
    delivery: DELIVERY,
    url: "https://stan.store/mycardblueprint/p/your-12month-timing-map",
  },
  {
    id: "family-snapshot",
    name: "The Family Snapshot",
    price: "$179",
    who: "You + 3 family members — 4 people total",
    hook: "Family dynamics run deep, and it’s way too easy to fall into the same old roles—being the default fixer, walking on eggshells, or having the exact same argument on repeat. This two-part breakdown gives you an objective look at the unspoken wiring between you and three family members, plus what’s actually driving everyone’s behavior this year.",
    parts: [
      {
        title: "Part 1: The Family Wiring",
        items: [
          { label: "How Everyone Is Built", text: "What actually drives all four of you underneath the family roles you’ve gotten used to playing." },
          { label: "The Alignments & Fault Lines", text: "Where the natural alliances live in the group, why certain combinations click effortlessly, and the exact friction points where communication usually breaks down." },
        ],
      },
      {
        title: "Part 2: This Year’s Family Radar",
        items: [
          { label: "Where Everyone Shows Up in Your Year", text: "A look at your current 12-month season and the specific windows when each of those three family members steps into the spotlight of your timeline." },
          { label: "Breaking the Pattern", text: "What each person is quietly navigating right now, plus tailored conversation starters to open things up without triggering the usual defensiveness." },
        ],
      },
    ],
    delivery: DELIVERY,
    url: "https://stan.store/mycardblueprint/p/the-family-snapshot",
  },
];
