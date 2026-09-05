"use client";

import { useEffect } from "react";
import Link from "next/link";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { HOME_CUE_DEMO_ROWS } from "@/lib/content-engine/fixtures/home-cue-demo";

export function HomeContentCue() {
  useEffect(() => {
    trackClientFunnelEventOnce("home_cue_shown", { placement: "home-landing" });
  }, []);

  return (
    <section
      data-home-cue
      className="border-t border-brand-line px-5 py-10 sm:px-8"
      aria-labelledby="home-cue-heading"
    >
      <div className="mx-auto w-full max-w-md">
        <p className="type-eyebrow text-brand-bronze">The same math writes content</p>
        <h2
          id="home-cue-heading"
          className="mt-2 font-serif text-2xl leading-snug text-brand-ink sm:text-3xl"
        >
          Tell it your business. It writes 52 days of posts.
        </h2>

        <ul className="mt-6 space-y-4 border border-brand-ink bg-brand-ivory p-4 text-left text-sm">
          {HOME_CUE_DEMO_ROWS.map((row) => (
            <li key={row.day} className="border-b border-brand-line pb-4 last:border-0 last:pb-0">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-brand-ink-soft">
                Day {row.day}
              </p>
              <p className="mt-1 font-medium text-brand-ink">{row.theme}</p>
              <p className="mt-1 leading-relaxed text-brand-ink-soft">{row.post}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 text-center">
          <Link
            href="/content-engine"
            className="accent-button large-button inline-flex"
            onClick={() =>
              trackClientFunnelEvent("home_cue_clicked", { placement: "home-landing" })
            }
          >
            See 7 days free →
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-brand-ink-soft">
            Every day has a card. Same date, same card, every year. That&rsquo;s the schedule.
          </p>
        </div>
      </div>
    </section>
  );
}
