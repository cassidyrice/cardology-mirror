"use client";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { READINGS } from "@/lib/readings";

/** The readings, side by side. Shown once a visitor's card is revealed. */
export function OfferColumns({ placement, className = "" }: { placement: string; className?: string }) {
  return (
    <section aria-labelledby={`offers-${placement}`} className={`w-full text-left ${className}`}>
      <h2 id={`offers-${placement}`} className="type-eyebrow mb-4 text-center !text-brand-bronze">
        Go deeper with a reading
      </h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {READINGS.map((o) => (
          <li key={o.id} className="flex flex-col rounded-2xl border border-brand-line bg-brand-ivory/70 p-5">
            <h3 className="font-serif text-xl leading-snug text-brand-ink">{o.name}</h3>
            <p className="mt-1 font-serif text-3xl text-brand-ink">{o.price}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand-bronze">{o.who}</p>
            <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">{o.hook}</p>
            {o.parts.map((part) => (
              <div key={part.title} className="mt-4">
                <p className="text-sm font-semibold text-brand-ink">{part.title}</p>
                <ul className="mt-2 space-y-2">
                  {part.items.map((item) => (
                    <li key={item.label} className="text-sm leading-relaxed text-brand-ink-soft">
                      <strong className="font-semibold text-brand-ink">{item.label}:</strong> {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="mt-4 flex-1 text-xs italic leading-relaxed text-brand-ink-soft">{o.delivery}</p>
            <a
              href={o.url}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-ink px-5 py-3 text-center text-sm font-semibold text-brand-paper"
              onClick={() => trackClientFunnelEvent("offer_cta_clicked", { placement: `${placement}-${o.id}` })}
            >
              Get {o.name} — {o.price}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
