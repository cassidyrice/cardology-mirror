"use client";

import { FormEvent, useState } from "react";

import { birthCardSlug } from "@/lib/birth-card-calculator";
import { birthCardFromISODate } from "@/lib/life-path";
import { compatibilityPairPath } from "@/lib/worker-seo-routes";
import { Kicker, SectionShell } from "@/components/ui";

/**
 * Home compare band. DEVIATION from spec §3.4: birthdays never go in the URL
 * (site rule). Cards are computed client-side (same helpers as the
 * compatibility calculator) and we navigate to /compatibility/<a>-and-<b>.
 */
export function CompareBand() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cardA = birthCardFromISODate(a);
    const cardB = birthCardFromISODate(b);
    if (!cardA || !cardB) {
      setError("Enter two full birthdays to compare.");
      return;
    }
    if (cardA === "Joker" || cardB === "Joker") {
      setError("December 31 (Joker) has no pair page. Try another birthday.");
      return;
    }
    const slugA = birthCardSlug(cardA);
    const slugB = birthCardSlug(cardB);
    if (!slugA || !slugB) {
      setError("Those dates could not be mapped to cards.");
      return;
    }
    const path = compatibilityPairPath(slugA, slugB);
    if (!path) {
      setError("Those cards could not be paired.");
      return;
    }
    window.location.assign(path);
  }

  return (
    <SectionShell tone="ink">
      <div className="mx-auto max-w-[40rem] text-center">
        <Kicker className="text-brand-gold">Compare</Kicker>
        <h2 className="type-h2 mt-3">Who are you dealing with?</h2>
        <p className="mt-4 text-brand-on-dark-soft">
          Put in two birthdays. See where their card lands in your spread, and where yours lands in
          theirs.
        </p>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="text-left">
            <label htmlFor="home-compare-a" className="type-eyebrow block text-brand-on-dark-soft">
              First birthday
            </label>
            <input
              id="home-compare-a"
              type="date"
              value={a}
              onChange={(e) => setA(e.target.value)}
              required
              className="mt-2 min-h-12 w-full rounded-[3px] border border-white/20 bg-white/5 px-4 font-serif text-brand-on-dark outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30"
            />
          </div>
          <div className="text-left">
            <label htmlFor="home-compare-b" className="type-eyebrow block text-brand-on-dark-soft">
              Second birthday
            </label>
            <input
              id="home-compare-b"
              type="date"
              value={b}
              onChange={(e) => setB(e.target.value)}
              required
              className="mt-2 min-h-12 w-full rounded-[3px] border border-white/20 bg-white/5 px-4 font-serif text-brand-on-dark outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="accent-button large-button w-full sm:w-auto">
              Compare
            </button>
          </div>
        </form>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-brand-gold">
            {error}
          </p>
        ) : null}
        <p className="mt-6 text-sm">
          <a href="/compatibility/" className="editorial-link text-brand-on-dark-soft">
            Browse every card pairing →
          </a>
        </p>
      </div>
    </SectionShell>
  );
}
