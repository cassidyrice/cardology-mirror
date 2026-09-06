import Link from "next/link";

const BUTTONDOWN_SUBSCRIBE_ENDPOINT =
  "https://buttondown.com/api/emails/embed-subscribe/cardblueprint";

export type NewsletterSource =
  | "calculator-result"
  | "methodology-dataset"
  | "site-footer"
  | "home-monday"
  | "home-reading-waitlist";

export function NewsletterSignupForm({
  source,
  compact = false,
  heading = "Your card, every Monday.",
  body = "One email a week: the card of the week, what it's pressing on, and one thing worth trying. That's it.",
  buttonLabel = "Send me Monday's card",
  finePrint = "Unsubscribe anytime.",
  hideHeading = false,
}: {
  source: NewsletterSource;
  compact?: boolean;
  heading?: string;
  body?: string;
  buttonLabel?: string;
  finePrint?: string;
  hideHeading?: boolean;
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
      {!hideHeading ? (
        <>
          <h2 className="font-serif text-xl text-brand-ink sm:text-2xl">{heading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{body}</p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-brand-ink-soft">{body}</p>
      )}
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
          {buttonLabel}
        </button>
      </form>
      <p className="mt-3 text-xs leading-relaxed text-brand-ink-soft">
        {finePrint}{" "}
        <Link href="/privacy-policy" className="text-brand-oxblood underline underline-offset-4">
          Privacy policy
        </Link>
      </p>
    </aside>
  );
}
