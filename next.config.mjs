/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: do not add headers() rules for pages here expecting them to reach
  // responses — the compiled middleware route in the build output has
  // override:true and wipes config-route headers for every path it matches
  // (i.e. all pages). Per-route response headers belong in middleware.ts;
  // /card-of-the-day's no-store header lives there.
  async redirects() {
    return [
      // /card-meanings is Google-indexed but has never been a route here —
      // it 404s in production (curl-verified 2026-07-12). Permanently point
      // it at the card-meanings index so the indexed URL recovers its equity.
      // @cloudflare/next-on-pages compiles redirects() into the Pages
      // routing layer, so this 301s at the edge.
      {
        source: "/card-meanings",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/cardology-agent-instructions",
        destination: "/shadow-karma-guide",
        statusCode: 301,
      },
      // Marketing aliases (P0)
      {
        source: "/personal-card-blueprint",
        destination: "/products/personal-card-blueprint",
        statusCode: 301,
      },
      {
        source: "/52-card-astrology",
        destination: "/52-card-astrology-explained",
        statusCode: 301,
      },
      {
        source: "/birthdays-by-date",
        destination: "/born-on/",
        statusCode: 301,
      },
      // Destiny / Love Cards synonym hub (ship with /destiny-cards page)
      {
        source: "/love-cards",
        destination: "/destiny-cards",
        statusCode: 301,
      },
      {
        source: "/science-of-the-cards",
        destination: "/destiny-cards",
        statusCode: 301,
      },
      {
        source: "/cards-of-your-destiny",
        destination: "/destiny-cards",
        statusCode: 301,
      },
      {
        source: "/destiny-card",
        destination: "/destiny-cards",
        statusCode: 301,
      },
      {
        source: "/what-are-destiny-cards",
        destination: "/destiny-cards",
        statusCode: 301,
      },
      {
        source: "/destiny-cards-calculator",
        destination: "/birth-card-calculator",
        statusCode: 301,
      },
      {
        source: "/destiny-card-calculator",
        destination: "/birth-card-calculator",
        statusCode: 301,
      },
      {
        source: "/love-cards-calculator",
        destination: "/birth-card-compatibility-calculator",
        statusCode: 301,
      },
      // P0 rank-only short paths (suit-ambiguous → birth-card index)
      // /2-of has confirmed Google association with 2 of Hearts.
      {
        source: "/2-of",
        destination: "/birth-card/2-of-hearts",
        statusCode: 301,
      },
      {
        source: "/3-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/4-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/5-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/6-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/7-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/8-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/9-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/10-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/ace-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/king-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/queen-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      {
        source: "/jack-of",
        destination: "/birth-card",
        statusCode: 301,
      },
      // P0 bare card aliases → canonical /birth-card/{slug}
      {
        source: "/:rank(ace|2|3|4|5|6|7|8|9|10|jack|queen|king)-of-:suit(hearts|clubs|diamonds|spades)",
        destination: "/birth-card/:rank-of-:suit",
        statusCode: 301,
      },
      {
        source: "/joker",
        destination: "/birth-card/joker",
        statusCode: 301,
      },
      // P0 gap aliases (crawl-debt audit 2026-08-12)
      {
        source: "/joker-meaning",
        destination: "/birth-card/joker",
        statusCode: 301,
      },
      {
        source: "/cardology",
        destination: "/what-is-cardology",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
