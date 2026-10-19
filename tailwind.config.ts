import type { Config } from "tailwindcss";

// Preserve semantic CSS variables while letting Tailwind emit opacity utilities.
const brandColor = (token: string) =>
  `color-mix(in srgb, var(--${token}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b2745",        // near-black base (Co-Star)
        void: "#103254",       // slightly raised surface
        cosmos: "#123a63",     // Pattern deep indigo
        haze: "#1b456f",       // raised card
        bone: "#eef3f8",       // warm off-white text
        mist: "#b9cde0",       // muted text
        faint: "#96afc6",      // very muted
        gold: "#d9b26a",       // accent foil
        ember: "#e0654a",      // over (excess) warning warm
        sage: "#7fae8f",       // sweet-spot balance
        dusk: "#7b6cf0",       // under / cool accent
        hearts: "#e0654a",
        diamonds: "#d9b26a",
        clubs: "#7fae8f",
        spades: "#7b6cf0",
        // Semantic marketing tokens (see :root in globals.css). Namespaced so
        // they never collide with the dark in-app palette above.
        brand: {
          paper: brandColor("paper"),
          "paper-deep": "var(--paper-deep)",
          // A bare var() cannot take /70 — Tailwind drops the utility. <alpha-value>
          // keeps solid ivory and lets bg-brand-ivory/70 paint.
          ivory: brandColor("ivory"),
          ink: brandColor("ink"),
          "ink-soft": "var(--ink-soft)",
          "ink-faint": "var(--ink-faint)",
          line: "var(--line)",
          "line-strong": "var(--line-strong)",
          bronze: brandColor("bronze"),
          gold: brandColor("gold"),
          "gold-soft": "var(--gold-soft)",
          oxblood: brandColor("oxblood"),
          "oxblood-deep": "var(--oxblood-deep)",
          club: "var(--club)",
          "on-dark": "var(--on-dark)",
          "on-dark-soft": "var(--on-dark-soft)",
          "on-dark-line": "var(--on-dark-line)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        wider2: "0.18em",
      },
      backgroundImage: {
        "cosmic": "radial-gradient(120% 120% at 50% 0%, #1b456f 0%, #103254 55%, #0b2745 100%)",
        "foil": "linear-gradient(135deg, #d9b26a 0%, #f4e3b8 45%, #b8893f 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        drift: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 6s linear infinite",
        drift: "drift 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
