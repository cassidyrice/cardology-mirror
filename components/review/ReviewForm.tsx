"use client";

import { useState } from "react";

import {
  REVIEW_COMMENT_MAX,
  REVIEW_DISCOUNT_PERCENT,
  REVIEW_READINGS,
  REVIEW_STORE_URL,
} from "@/lib/review-offer";

export function ReviewForm() {
  const [firstName, setFirstName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reading, setReading] = useState(REVIEW_READINGS[0]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, rating, comment, reading, consent }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !data.code) throw new Error(data.error || "That didn't save. Try once more.");
      setCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save. Try once more.");
    } finally {
      setSending(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (code) {
    return (
      <section className="border border-brand-line-strong bg-brand-ivory p-5 sm:p-6" aria-live="polite">
        <h2 className="type-h2 text-brand-ink">Thank you. Here is your {REVIEW_DISCOUNT_PERCENT}% off.</h2>
        <p className="mt-3 text-base leading-relaxed text-brand-ink-soft">
          Good for one more reading of your choice. Any report in the store.
        </p>
        <button
          type="button"
          onClick={copyCode}
          className="mt-5 w-full border-2 border-dashed border-brand-ink bg-brand-paper-deep px-4 py-4 text-center font-mono text-2xl tracking-widest text-brand-ink"
          aria-label={`Copy code ${code}`}
        >
          {code}
        </button>
        <p className="mt-2 text-sm text-brand-ink-soft">{copied ? "Copied. It's on your clipboard." : "Tap the code to copy it."}</p>
        <a
          href={REVIEW_STORE_URL}
          target="_blank"
          rel="noopener"
          onClick={copyCode}
          className="mt-5 block w-full bg-brand-ink px-5 py-4 text-center text-base font-semibold text-brand-ivory"
        >
          Copy code and pick my next reading
        </a>
        <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-brand-ink-soft">
          <li>The button copies your code and opens the store in a new tab.</li>
          <li>Pick any report. Same reading, same care.</li>
          <li>At checkout, find &ldquo;Discount code.&rdquo; Paste. Price drops by half.</li>
          <li>Lost it? Come back here. The code stays on this page until you close it.</li>
        </ol>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 border border-brand-line-strong bg-brand-ivory p-5 sm:p-6">
      <div>
        <label htmlFor="rv-name" className="block text-sm font-semibold text-brand-ink">First name</label>
        <p className="text-sm text-brand-ink-soft">Only your first name. No last name. We don&rsquo;t need it.</p>
        <input
          id="rv-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={40}
          autoComplete="given-name"
          required
          className="mt-2 w-full border border-brand-line bg-white px-3 py-2 text-base"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-semibold text-brand-ink">How was it?</legend>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className={`text-3xl leading-none ${n <= rating ? "text-brand-ink" : "text-brand-line-strong"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="rv-reading" className="block text-sm font-semibold text-brand-ink">Which reading did you get?</label>
        <select
          id="rv-reading"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          className="mt-2 w-full border border-brand-line bg-white px-3 py-2 text-base"
        >
          {REVIEW_READINGS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="rv-comment" className="block text-sm font-semibold text-brand-ink">A sentence or two</label>
        <p className="text-sm text-brand-ink-soft">What landed? What surprised you? Skip names of other people.</p>
        <textarea
          id="rv-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={REVIEW_COMMENT_MAX}
          rows={4}
          required
          className="mt-2 w-full border border-brand-line bg-white px-3 py-2 text-base"
        />
        <p className="text-right text-xs text-brand-ink-soft">{comment.length}/{REVIEW_COMMENT_MAX}</p>
      </div>

      <label className="flex gap-3 text-sm leading-relaxed text-brand-ink">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>
          Yes, Card Blueprints may share my first name, star rating, and comment on its site and social posts.
          No photo. No last name. No email or other personal info. I can ask to have it taken down any time.
        </span>
      </label>
      <p className="-mt-3 text-xs text-brand-ink-soft">Not comfortable? Leave it unchecked. You still get the code. Your review stays private.</p>

      {error ? <p className="text-sm font-semibold text-red-700" role="alert">{error}</p> : null}

      <button
        type="submit"
        disabled={sending || rating === 0}
        className="w-full bg-brand-ink px-5 py-4 text-base font-semibold text-brand-ivory disabled:opacity-50"
      >
        {sending ? "Saving..." : `Send review and get ${REVIEW_DISCOUNT_PERCENT}% off`}
      </button>
    </form>
  );
}
