"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { ContentCalendarView } from "@/components/content-engine/ContentCalendarView";
import { rowsToCsv } from "@/lib/content-engine/storage";

type SampleRow = {
  day: number;
  theme: string;
  why: string;
  post: string;
  format: string;
};

type SampleResponse = {
  startDate?: string;
  weekHeaders?: string[];
  rows?: SampleRow[];
  error?: string;
  message?: string;
};

export function ContentEngineForm() {
  const [business, setBusiness] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<SampleRow[] | null>(null);
  const [weekHeaders, setWeekHeaders] = useState<string[]>([]);
  const [resolvedStartDate, setResolvedStartDate] = useState("");

  const sampleCalendar = useMemo(() => {
    if (!rows?.length) return null;
    return {
      sessionId: "sample",
      business,
      startDate: resolvedStartDate || startDate || new Date().toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
      weekHeaders,
      rows,
      csv: rowsToCsv(rows),
    };
  }, [rows, business, resolvedStartDate, startDate, weekHeaders]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setWarmingUp(false);
    setLoading(true);
    trackClientFunnelEventOnce("engine_sample_requested", {
      placement: "content-engine",
    });

    try {
      const res = await fetch("/api/content-engine/sample", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          business,
          startDate: startDate || undefined,
        }),
      });
      const data = (await res.json()) as SampleResponse;

      if (res.status === 503 || data.error === "warming_up") {
        setWarmingUp(true);
        setRows(null);
        return;
      }

      if (!res.ok || !data.rows?.length) {
        setError(data.message || "Could not build the sample.");
        setRows(null);
        return;
      }

      setRows(data.rows);
      setWeekHeaders(data.weekHeaders || []);
      if (data.startDate) setResolvedStartDate(data.startDate);
      trackClientFunnelEvent("engine_sample_shown", {
        placement: "content-engine",
      });
    } catch {
      setError("Could not reach the sample engine.");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="ce-business" className="type-eyebrow block text-brand-ink">
            Your business in a sentence
          </label>
          <textarea
            id="ce-business"
            value={business}
            onChange={(e) => setBusiness(e.target.value.slice(0, 240))}
            maxLength={240}
            rows={3}
            required
            placeholder="A neighborhood bakery in Bozeman posting on Instagram…"
            className="mt-2 w-full border border-brand-ink bg-brand-paper px-4 py-3 font-serif text-brand-ink outline-none"
          />
          <p className="mt-1 text-xs text-brand-ink-soft">{business.length}/240</p>
        </div>
        <div>
          <label htmlFor="ce-start" className="type-eyebrow block text-brand-ink">
            Start date (optional)
          </label>
          <input
            id="ce-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-2 min-h-11 w-full max-w-xs border border-brand-ink bg-brand-paper px-4 font-serif text-brand-ink outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="accent-button large-button"
        >
          {loading ? "Building…" : "Show me 7 days"}
        </button>
      </form>

      {warmingUp ? (
        <p role="status" className="mt-8 font-serif text-lg text-brand-ink">
          Sample engine is warming up
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 text-sm text-brand-oxblood">
          {error}
        </p>
      ) : null}

      {sampleCalendar ? (
        <div className="mt-10">
          <ContentCalendarView
            calendar={sampleCalendar}
            sessionId="sample"
            mode="sample"
            business={business}
            startDate={sampleCalendar.startDate}
          />

          <div className="mt-8 border border-brand-ink bg-brand-ivory p-5">
            <p className="font-serif text-xl text-brand-ink">Get all 52 days — $29</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
              52 days of content, written for you. Not a spreadsheet: tap any day and it
              writes the post.
            </p>
            <form
              method="POST"
              action="/checkout/content-calendar-52/session"
              className="mt-4 space-y-3"
              onSubmit={() =>
                trackClientFunnelEvent("engine_cta_clicked", {
                  placement: "content-engine-sample",
                })
              }
            >
              <input type="hidden" name="business" value={business} />
              <input type="hidden" name="startDate" value={sampleCalendar.startDate} />
              <input type="hidden" name="source" value="content-engine" />
              <button type="submit" className="accent-button large-button">
                Get all 52 days — $29
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-brand-ink-soft">
        Every calendar date has a card. Same date, same card, every year. We turn the
        day&rsquo;s card into your day&rsquo;s angle.{" "}
        <Link href="/explore" className="underline underline-offset-4">
          Learn more →
        </Link>
      </p>
    </div>
  );
}
