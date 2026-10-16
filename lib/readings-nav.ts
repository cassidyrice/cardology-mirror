// Custom readings sold on Stan (https://stan.store/mycardblueprint).
// Header "Readings" menu shows ONLY title + price; prices confirmed by Cass 2026-10-15.
export const STAN_STORE_URL = "https://stan.store/mycardblueprint";

export const READINGS_NAV = [
  { title: "The Chemistry Check", price: "$97", href: `${STAN_STORE_URL}/p/the-chemistry-check` },
  { title: "Your 12-Month Timing Map", price: "$137", href: `${STAN_STORE_URL}/p/your-12month-timing-map` },
  { title: "The Family Snapshot", price: "$179", href: `${STAN_STORE_URL}/p/the-family-snapshot` },
] as const;
