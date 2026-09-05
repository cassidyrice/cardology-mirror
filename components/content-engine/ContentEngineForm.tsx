"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";

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

      {rows ? (
        <div className="mt-10">
          {weekHeaders[0] ? (
            <p className="mb-3 font-serif text-xl text-brand-ink">{weekHeaders[0]}</p>
          ) : null}
          <div className="overflow-x-auto border border-brand-ink">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-brand-ink bg-brand-ivory font-mono text-[0.65rem] uppercase tracking-[0.12em]">
                <tr>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Theme</th>
                  <th className="px-3 py-2">Why</th>
                  <th className="px-3 py-2">Post</th>
                  <th className="px-3 py-2">Format</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.day} className="border-t border-brand-line align-top">
                    <td className="px-3 py-3 font-mono text-xs">{row.day}</td>
                    <td className="px-3 py-3 font-medium">{row.theme}</td>
                    <td className="px-3 py-3 text-brand-ink-soft">{row.why}</td>
                    <td className="px-3 py-3">{row.post}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{row.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border border-brand-ink bg-brand-ivory p-5">
            <p className="font-serif text-xl text-brand-ink">Get all 52 days</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
              Themes, posts, and formats for the next 52 days, plus a CSV you can keep.
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
              <input type="hidden" name="startDate" value={startDate} />
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
