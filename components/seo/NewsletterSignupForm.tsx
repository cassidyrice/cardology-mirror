import Link from "next/link";

const BUTTONDOWN_SUBSCRIBE_ENDPOINT =
  "https://buttondown.com/api/emails/embed-subscribe/cardblueprint";

export function NewsletterSignupForm({
  source,
  compact = false,
}: {
  source: "calculator-result" | "methodology-dataset" | "site-footer";
  compact?: boolean;
}) {
  const emailId = `newsletter-email-${source}`;

  return (
    <aside
      className={
        compact
          ? "w-full max-w-xl border-t border-brand-line pt-5"
          : "w-full max-w-2xl rounded-[3px] border border-brand-line bg-brand-ivory p-5 sm:p-6"
      }
      aria-label="Card Blueprints email updates"
    >
      <p className="type-eyebrow text-brand-bronze">Card Blueprints updates</p>
      <h2 className="mt-2 font-serif text-xl text-brand-ink">
        Keep the useful parts close.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        Evidence-led Cardology tools, datasets, and practical interpretation.
        No daily horoscope spam.
      </p>
      <form
        method="post"
        action={BUTTONDOWN_SUBSCRIBE_ENDPOINT}
        data-newsletter-source={source}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@example.com"
          className="min-h-11 min-w-0 flex-1 rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 text-brand-ink outline-none placeholder:text-brand-ink-faint focus:border-brand-oxblood focus:ring-2 focus:ring-brand-oxblood/20"
        />
        <button type="submit" className="accent-button min-h-11 px-5 py-2.5 text-sm">
          Subscribe
        </button>
      </form>
      <p className="mt-3 text-xs leading-relaxed text-brand-ink-soft">
        Confirm by email. Unsubscribe anytime. See the{" "}
        <Link href="/privacy-policy" className="text-brand-oxblood underline underline-offset-4">
          privacy policy
        </Link>
        .
      </p>
    </aside>
  );
}
