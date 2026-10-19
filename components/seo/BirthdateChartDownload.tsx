"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  birthdateChartFilename,
  birthdateChartFromIsoDate,
} from "@/lib/birthdate-chart";
import { renderBirthdateChartPng } from "@/lib/birthdate-chart-render";

export type BirthdateChartSource = "calculator-result" | "home-reveal";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadStatus = "pending" | "saved" | "failed";

/** Saves the lead through our own API (Buttondown key stays on the server). The download never waits on it. */
async function saveLead(email: string, source: BirthdateChartSource, slug: string): Promise<LeadStatus> {
  try {
    const res = await fetch("/api/chart-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source, slug }),
    });
    return res.ok ? "saved" : "failed";
  } catch {
    return "failed";
  }
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Free birthdate chart: email in, chart PNG out, right here on the page.
 * The birthday stays in the browser; only the email + tags go to Buttondown.
 */
export function BirthdateChartDownload({
  birthdate,
  source,
}: {
  birthdate: string;
  source: BirthdateChartSource;
}) {
  const chart = useMemo(() => birthdateChartFromIsoDate(birthdate), [birthdate]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadStatus>("pending");

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  if (!chart) return null;
  const filename = birthdateChartFilename(chart);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!chart || status === "busy") return;
    const clean = email.trim().toLowerCase();
    if (clean.length > 254 || !EMAIL_PATTERN.test(clean)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setStatus("busy");
    void saveLead(clean, source, chart.slug).then(setLead);
    try {
      const blob = await renderBirthdateChartPng(chart);
      const next = URL.createObjectURL(blob);
      setUrl(next);
      setStatus("ready");
      triggerDownload(next, filename);
    } catch {
      setStatus("error");
      setError("Something went wrong drawing your chart. Try again.");
    }
  }

  return (
    <aside
      className="w-full max-w-xl border-t border-brand-line pt-5 text-left"
      aria-label="Free birthdate chart"
      data-birthdate-chart={source}
    >
      <h2 className="font-serif text-xl text-brand-ink sm:text-2xl">Download your birthdate chart</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        {chart.isJoker
          ? "A one-page chart for December 31, the Joker. Free. Enter your email and it downloads right away."
          : `A one-page chart for ${chart.dateLabel}: your ${chart.birth.label}, ruling card, and karma cards. Free. Enter your email and it downloads right away.`}
      </p>
      {status !== "ready" ? (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3" noValidate>
          <label htmlFor={`chart-email-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`chart-email-${source}`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-h-11 min-w-0 flex-1 rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 text-brand-ink outline-none placeholder:text-brand-ink-faint focus:border-brand-oxblood focus:ring-2 focus:ring-brand-oxblood/20"
          />
          <button
            type="submit"
            disabled={status === "busy"}
            className="accent-button min-h-11 px-5 py-2.5 text-sm"
          >
            {status === "busy" ? "Drawing your chart…" : "Get my free chart"}
          </button>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-brand-oxblood">
          {error}
        </p>
      ) : null}
      {status === "ready" && url ? (
        <div className="mt-4 flex flex-col items-center gap-3" data-birthdate-chart-ready>
          <img
            src={url}
            alt={`Birthdate chart for ${chart.dateLabel}: ${chart.birth.label}`}
            width={600}
            height={800}
            className="w-full max-w-sm rounded-[3px] border border-brand-line shadow-sm"
          />
          <a href={url} download={filename} className="accent-button min-h-11 px-5 py-2.5 text-sm">
            Download my chart
          </a>
          <p className="text-xs text-brand-ink-soft">
            Your download should start on its own. If it didn&apos;t, tap the button above.
          </p>
          {lead === "failed" ? (
            <p className="text-center text-xs text-brand-ink-soft" data-birthdate-chart-save-failed>
              Your chart is yours to keep. We couldn&apos;t save your email just now, so Monday&apos;s card won&apos;t arrive yet.
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-brand-ink-soft">
        Your birthday stays on this page. We keep your email to send your card on Mondays. Unsubscribe anytime.{" "}
        <Link href="/privacy-policy" className="text-brand-oxblood underline underline-offset-4">
          Privacy policy
        </Link>
      </p>
    </aside>
  );
}
