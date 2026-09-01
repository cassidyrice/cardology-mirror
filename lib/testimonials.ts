// Real customer words, supplied by the owner 2026-09-01 — verbatim.
// The owner confirmed every review was five-star (2026-09-01), so each
// carries rating: 5 for display and schema.org reviewRating/aggregateRating.

export type Testimonial = {
  author: string;
  /** e.g. "Five of Clubs" — shown when the reviewer named their card. */
  card?: string;
  age?: number;
  quote: string;
  /** Star rating the reviewer gave (owner-confirmed). */
  rating: 5;
  /** Product slugs this review speaks to. */
  products: ("deep-dive" | "personal-card-blueprint")[];
  /** Founder/owner voice — displayed with that label, never in Product schema. */
  founder?: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    author: "Mary",
    age: 60,
    rating: 5,
    products: ["deep-dive", "personal-card-blueprint"],
    quote:
      "The Deep Dive is where it started. Learning my card later in life has been one of the more useful things I've done. I had people I could never quite get — family, mostly — and the friction felt personal. Seeing the pattern under it didn't make anyone different. It made the clash make sense. The $13 Blueprint is what I keep. I can talk to them now without bracing for a fight I don't understand. That's been a relief I didn't expect at this age.",
  },
  {
    author: "Tiffany",
    age: 37,
    card: "Five of Clubs",
    rating: 5,
    products: ["deep-dive"],
    quote:
      "I bought the Deep Dive, found out I was the Five of Clubs, and a lot of my life stopped looking random. I married my challenging karma card young. Once I saw his birth card in there, it was him — not a vibe, him. I used to think that kind of karma was a sentence. Now I treat it as the lesson I actually signed up for. I'm not rewriting the marriage. I'm moving forward with my eyes open, and that part is new.",
  },
  {
    author: "Stephen",
    age: 65,
    card: "Jack of Diamonds",
    rating: 5,
    products: ["deep-dive"],
    quote:
      "I'm a builder. I've started more than one business. I'll also admit I'm a bit of a trickster — that's not a confession, that's just the job. Then I open the Deep Dive, find out I'm the Jack of Diamonds, and the description might as well have had my name on it. I don't get easily impressed. That one got me.",
  },
  {
    author: "Sarah",
    card: "Eight of Clubs",
    rating: 5,
    products: ["deep-dive"],
    quote:
      "I'm an Eight of Clubs — a fixed card. The Deep Dive says that in one sentence, and that sentence is me. I couldn't believe I'm one of the only cards that doesn't get removed, because in my own life I don't leave. I stay. That's been true for better and for worse. I'm working on the \"better\" part.",
  },
  {
    author: "Cass",
    card: "Eight of Diamonds",
    rating: 5,
    products: ["personal-card-blueprint"],
    founder: true,
    quote:
      "What got me wasn't the personality write-up. It was the yearly. The last two months of 35 and the first two months of 36 read like a storybook of what actually happened — not a mood, the sequence. I still pull up a report from a year ago and show people. It laid the coordinates for the most profound, successful 52-day stretch I've had. If I hadn't known what I knew going into that year, I think I would have missed the window.",
  },
];

export function testimonialsFor(slug: string): Testimonial[] {
  return TESTIMONIALS.filter((t) =>
    t.products.includes(slug as Testimonial["products"][number]),
  );
}

/** Customer (non-founder) reviews for schema.org Review markup. */
export function schemaReviewsFor(slug: string): Testimonial[] {
  return testimonialsFor(slug).filter((t) => !t.founder);
}

export function testimonialByline(t: Testimonial): string {
  const bits = [t.author];
  if (t.age) bits[0] = `${t.author}, ${t.age}`;
  if (t.card) bits.push(t.card);
  return bits.join(" · ");
}
