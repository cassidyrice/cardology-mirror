// Shared presentational primitives. Treat as read-only from feature agents.
// Two systems live here: the dark in-app primitives (Eyebrow, SectionTitle,
// Screen, PositionStack) and the warm-paper marketing system (LinkButton,
// Kicker, SectionShell, Rule, PricingCard, MobileActionBar).
import { ReactNode } from "react";
import Link from "next/link";

import type { ReadingOffer } from "@/lib/products";
import { readingOfferHref } from "@/lib/products";
import { READER_PHONE_TEL } from "@/lib/offers";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`display text-2xl text-bone ${className}`}>{children}</h2>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`hairline my-6 border-t ${className}`} />;
}

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative min-h-dvh px-5 pb-28 pt-10 ${className}`}>{children}</div>
  );
}

// Three-position interpretation block (under / sweet-spot / over) — core engine motif.
export function PositionStack({
  under,
  sweet,
  over,
}: {
  under: string;
  sweet: string;
  over: string;
}) {
  const rows = [
    { label: "Under", text: under, color: "text-dusk", dot: "bg-dusk" },
    { label: "Balanced", text: sweet, color: "text-sage", dot: "bg-sage" },
    { label: "Over", text: over, color: "text-ember", dot: "bg-ember" },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
          <p className="text-[0.95rem] leading-relaxed text-mist">
            <span className={`mr-2 text-xs uppercase tracking-wider2 ${r.color}`}>
              {r.label}
            </span>
            {r.text}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Warm-paper marketing primitives                                          */
/* ------------------------------------------------------------------------ */

type ButtonVariant = "primary" | "accent" | "outline" | "text";

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary: "ink-button",
  accent: "accent-button",
  outline: "paper-button",
  text: "editorial-link",
};

// One link-button for every marketing CTA. tel:/mailto:/external hrefs render
// a plain anchor; internal routes use next/link.
export function LinkButton({
  href,
  variant = "primary",
  size,
  children,
  className = "",
  ariaLabel,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: "small" | "large";
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const sizeClass =
    variant === "text" ? "" : size === "small" ? "small-button" : size === "large" ? "large-button" : "";
  const cls = `${BUTTON_CLASS[variant]} ${sizeClass} ${className}`.trim();
  // /checkout/* is a route handler that creates a Stripe session per request —
  // a plain anchor keeps next/link prefetch from minting sessions on hover.
  const external = /^(tel:|mailto:|https?:)/.test(href) || href.startsWith("/checkout/");
  if (external) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

// Eyebrow label for paper/ink surfaces (bronze on paper, gold on ink via
// .shell-ink). The dark in-app screens keep the original Eyebrow above.
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`type-eyebrow ${className}`}>{children}</p>;
}

// Section wrapper: tone + vertical rhythm + one content column.
export function SectionShell({
  tone = "paper",
  pad = "default",
  width = "default",
  id,
  children,
  className = "",
}: {
  tone?: "paper" | "paperDeep" | "ink";
  pad?: "default" | "small";
  width?: "default" | "narrow";
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === "ink" ? "shell-ink" : tone === "paperDeep" ? "shell-paper-deep" : "shell-paper";
  const padClass = pad === "small" ? "shell-pad-sm" : "shell-pad";
  const widthClass = width === "narrow" ? "max-w-3xl" : "max-w-6xl";
  return (
    <section id={id} className={`${toneClass} ${padClass} ${className}`}>
      <div className={`mx-auto w-full ${widthClass} px-5 sm:px-8 lg:px-10`}>{children}</div>
    </section>
  );
}

// 1px semantic divider for paper surfaces (Divider above is the dark-app one).
export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-t border-brand-line ${className}`} />;
}

// Pricing card. The emphasized card inverts to ink — inversion, not scale,
// carries the recommendation. Structure: badge → name → price → one-line
// outcome → up to 3 bullets → CTA → risk-reversal note.
export function PricingCard({
  offer,
  emphasized = false,
  badge,
  goldAccent = false,
  className = "",
}: {
  offer: ReadingOffer;
  emphasized?: boolean;
  badge?: string;
  goldAccent?: boolean;
  className?: string;
}) {
  const shownBadge = badge ?? offer.badge;
  const surface = emphasized
    ? "shell-ink border border-brand-ink"
    : `bg-brand-ivory border border-brand-line ${goldAccent ? "border-t-brand-gold" : ""}`;
  const soft = emphasized ? "text-brand-on-dark-soft" : "text-brand-ink-soft";
  const hair = emphasized ? "border-brand-on-dark-line" : "border-brand-line";

  return (
    <article
      id={offer.slug}
      className={`flex flex-col rounded-[3px] p-8 transition-shadow duration-200 hover:shadow-[0_8px_30px_rgba(20,17,13,0.08)] sm:p-9 ${surface} ${className}`}
    >
      <div className="min-h-[1.25rem]">
        {shownBadge && <p className="type-eyebrow">{shownBadge}</p>}
      </div>
      <h3 className="type-h3 mt-3 lg:min-h-[2.6em]">{offer.name}</h3>
      <p className="mt-4 font-serif text-4xl leading-none">
        {offer.priceLabel}
        <span className={`ml-2 align-middle text-sm ${soft}`}>one time</span>
      </p>
      <p className={`mt-4 text-[0.95rem] leading-relaxed ${soft}`}>{offer.oneLine}</p>
      <ul className={`mt-6 flex-1 space-y-2.5 text-sm leading-relaxed ${soft}`}>
        {offer.includes.slice(0, 3).map((item) => (
          <li key={item} className={`border-t ${hair} pt-2.5`}>
            {item}
          </li>
        ))}
      </ul>
      <LinkButton
        href={readingOfferHref(offer)}
        variant={emphasized ? "accent" : "outline"}
        size="large"
        className="mt-7 w-full text-center"
      >
        {offer.cta}
      </LinkButton>
      <p className={`mt-3 text-center text-xs leading-relaxed ${soft}`}>{offer.checkoutNote}</p>
    </article>
  );
}

// Fixed two-action bar for phone widths. Rendered only on / and /readings.
// The in-flow spacer keeps the bar from covering content or the footer.
export function MobileActionBar({ readingHref = "/readings" }: { readingHref?: string }) {
  return (
    <>
      <div aria-hidden="true" className="h-[4.5rem] md:hidden" />
      {/* No oxblood here — the hero owns the accent; primary emphasis mirrors
          the hero's free-call-first hierarchy. */}
      <nav aria-label="Quick actions" className="mobile-action-bar md:hidden">
        <a href={READER_PHONE_TEL} className="ink-button">
          Call Free
        </a>
        <Link href={readingHref} className="paper-button">
          Get a Reading
        </Link>
      </nav>
    </>
  );
}
