/** Three bakery rows from fixtures/bakery-v2.md — server-rendered on the home cue block. */
export type HomeCueDemoRow = {
  day: number;
  theme: string;
  post: string;
};

export const HOME_CUE_DEMO_ROWS: HomeCueDemoRow[] = [
  {
    day: 1,
    theme: "Sharing the good stuff",
    post:
      '"We\'re giving our partners at [Cafe A] and [Cafe B] an extra dozen croissants this week. We love supporting other local spots."',
  },
  {
    day: 2,
    theme: "How we adapt and pivot",
    post:
      '"Our usual Montana flour mill had a small delay. This week\'s sourdough uses an amazing single-origin wheat from another local farm. The flavor is incredible."',
  },
  {
    day: 3,
    theme: "Investing in our craft",
    post:
      '"Meet our new dough sheeter. It\'s a big investment, but it means more consistent, flaky croissants for you, every single time."',
  },
];
