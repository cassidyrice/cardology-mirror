import Link from "next/link";

export function FreeCourseCta({
  source,
  variant = "card",
  className = "",
}: {
  source: string;
  variant?: "card" | "home";
  className?: string;
}) {
  if (variant === "home") {
    return (
      <div className={`grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center ${className}`}>
        <div className="max-w-2xl">
          <p className="oracle-eyebrow text-brand-bronze">Free four-part course</p>
          <h2 className="type-h2 mt-4 text-brand-on-dark">Read Your Birth Card</h2>
          <p className="mt-4 max-w-[42rem] leading-relaxed text-brand-on-dark-soft">
            Learn the 52-card pattern language in about 14 minutes: find your card, read rank plus suit,
            recognize balanced and shadow states, and build a useful reflection.
          </p>
          <p className="mt-3 text-sm text-brand-on-dark-faint">Four concise video modules · Free with your name and email</p>
        </div>
        <Link
          href={`/free-course?source=${encodeURIComponent(source)}`}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-accent px-7 py-3 font-serif text-base text-white transition hover:bg-brand-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          Get the free course →
        </Link>
      </div>
    );
  }

  return (
    <section className={`card-surface rounded-2xl border border-gold/20 p-5 sm:p-6 ${className}`} aria-label="Free Cardology course">
      <p className="eyebrow text-gold">Free four-part video course</p>
      <div className="mt-3 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <h2 className="font-serif text-xl text-bone">Learn to read your birth card in 14 minutes</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
            Find your card, combine rank and suit, spot balanced and shadow states, and turn the pattern into a practical reflection.
          </p>
          <p className="mt-2 text-xs text-faint">Four short modules · Free with your name and email</p>
        </div>
        <Link
          href={`/free-course?source=${encodeURIComponent(source)}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-foil px-5 py-2.5 font-serif text-sm text-ink transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          Get free access →
        </Link>
      </div>
    </section>
  );
}
