import Link from "next/link";

export function ProfilePrompt({
  eyebrow = "Personalized layer",
  title,
  body,
  cta = "Create your profile",
}: {
  eyebrow?: string;
  title: string;
  body: string;
  cta?: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-6 text-center">
      <p className="eyebrow mb-3 !text-brand-bronze">{eyebrow}</p>
      <h2 className="display text-2xl text-brand-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-brand-ink-soft">
        {body}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/onboarding"
          className="ink-button large-button w-full"
        >
          {cta}
        </Link>
        <Link
          href="/birth-card-calculator"
          className="rounded-full border border-brand-line px-6 py-3 text-sm text-brand-ink-soft transition hover:text-brand-ink"
        >
          Find your birth card first
        </Link>
      </div>
    </div>
  );
}
