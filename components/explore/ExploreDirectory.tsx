"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  VIDEO_PATH,
} from "@/lib/site";

type ExploreLink = {
  label: string;
  href: string;
  external?: boolean;
};

type ExploreGroup = {
  title: string;
  links: ExploreLink[];
};

const GROUPS: ExploreGroup[] = [
  {
    title: "Find your card",
    links: [
      { label: "Birth card calculator", href: "/birth-card-calculator" },
      { label: "Birthdays by date", href: BIRTHDAY_DIRECTORY_PATH, external: true },
    ],
  },
  {
    title: "Understand your card",
    links: [
      { label: "All 52 cards", href: "/birth-card" },
      { label: "Planetary ruling card chart", href: "/planetary-ruling-card" },
      { label: "Karma cards", href: "/karma-cards" },
      { label: "Birth card vs ruling card", href: "/birth-card-vs-ruling-card" },
    ],
  },
  {
    title: "Compare two people",
    links: [
      { label: "Compatibility calculator", href: "/birth-card-compatibility-calculator" },
      { label: "Compatibility guide", href: "/cardology-compatibility" },
      { label: "All pairings", href: COMPATIBILITY_DIRECTORY_PATH, external: true },
    ],
  },
  {
    title: "Timing and daily reflection",
    links: [
      { label: "Card of the day", href: "/card-of-the-day" },
      { label: "52-day period tool", href: "/52-day-period-meaning-tool" },
      { label: "Your year in cards", href: "/your-year" },
      { label: "Today", href: "/today" },
    ],
  },
  {
    title: "Articles and videos",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Videos", href: VIDEO_PATH },
      { label: "Cardology for beginners", href: "/cardology-for-beginners" },
    ],
  },
  {
    title: "Paid reports",
    links: [
      { label: "One Question Reading ($13)", href: "/products/one-question-reading" },
    ],
  },
  {
    title: "About and method",
    links: [
      { label: "About", href: "/about" },
      { label: "Methodology", href: "/methodology" },
      { label: "Editorial policy", href: "/editorial-policy" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

function ExploreHref({ link }: { link: ExploreLink }) {
  if (link.external) {
    return (
      <a href={link.href} className="text-brand-ink underline-offset-4 hover:underline">
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className="text-brand-ink underline-offset-4 hover:underline">
      {link.label}
    </Link>
  );
}

export function ExploreDirectory() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((group) => ({
      ...group,
      links: group.links.filter(
        (link) =>
          link.label.toLowerCase().includes(q) ||
          group.title.toLowerCase().includes(q),
      ),
    })).filter((group) => group.links.length > 0);
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:px-10">
      <header className="max-w-2xl pb-8">
        <h1 className="font-serif text-4xl leading-tight text-brand-ink sm:text-5xl">
          Explore Card Blueprints
        </h1>
        <p className="mt-4 text-base leading-relaxed text-brand-ink-soft">
          Your card, the library, compatibility, timing, and the rest of the deck.
          Pick a door below.
        </p>
      </header>

      <label htmlFor="explore-filter" className="type-eyebrow block text-brand-ink">
        Filter
      </label>
      <input
        id="explore-filter"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Calculator, compatibility, One Question Reading…"
        className="mt-2 min-h-11 w-full border border-brand-ink bg-brand-paper px-4 font-serif text-brand-ink outline-none"
      />

      <div className="mt-10 space-y-10">
        {filtered.map((group) => (
          <section key={group.title} aria-labelledby={`explore-${group.title}`}>
            <h2
              id={`explore-${group.title}`}
              className="font-serif text-2xl text-brand-ink"
            >
              {group.title}
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-brand-ink-soft">
              {group.links.map((link) => (
                <li key={link.href}>
                  <ExploreHref link={link} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-brand-ink-soft">No matches. Try a shorter word.</p>
        ) : null}
      </div>
    </div>
  );
}
