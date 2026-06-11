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
      <p className="eyebrow mb-3 text-gold">{eyebrow}</p>
      <h2 className="display text-2xl text-bone">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-mist">
        {body}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/onboarding"
          className="rounded-full bg-foil px-6 py-3 font-serif text-base text-ink transition active:scale-[0.99]"
        >
          {cta}
        </Link>
        <Link
          href="/birth-card-calculator"
          className="rounded-full border border-white/15 px-6 py-3 text-sm text-mist transition hover:border-gold hover:text-bone"
        >
          Find your birth card first
        </Link>
      </div>
    </div>
  );
}
