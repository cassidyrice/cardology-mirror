import {
  READINGS_NAV,
  READING_FOLLOW_UP,
  READING_RESPONSE_TIME,
  READING_SUPPORT_EMAIL,
} from "@/lib/readings-nav";

/** Public offer descriptions and purchase links; fulfillment happens privately. */
export function ManualReadingOffers() {
  return (
    <>
      <ul className="reading-offer-grid">
        {READINGS_NAV.map((reading) => (
          <li id={reading.id} key={reading.id} className="reading-offer">
            {reading.image ? <img src={reading.image} alt={`${reading.title} preview`} width={1600} height={1000} loading="lazy" className="mb-5 aspect-[16/10] w-full object-cover" /> : null}
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-bronze">{reading.who}</p>
            <h3 className="mt-3 font-serif text-3xl leading-tight text-brand-ink">{reading.title}</h3>
            <p className="mt-4 font-serif text-4xl text-brand-ink">{reading.price}</p>
            <p className="mt-4 text-sm leading-relaxed text-brand-ink-soft">{reading.description}</p>
            <ul className="mt-5 space-y-3 border-t border-brand-line pt-5 text-sm leading-relaxed text-brand-ink-soft">
              {reading.includes.map((item) => (
                <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-brand-bronze">✦</span><span>{item}</span></li>
              ))}
            </ul>
            <p className="mb-6 mt-5 flex-1 text-sm leading-relaxed text-brand-ink-soft">{reading.delivery ?? "A private reading, personally prepared and delivered by email."}{reading.sampleHref ? <>{" "}<a href={reading.sampleHref} className="underline underline-offset-4">See a sample (PDF)</a></> : null}</p>
            {reading.checkoutHref ? (
              <a href={reading.checkoutHref} data-order-reading={reading.id} className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-brand-ink px-4 py-4 text-center text-sm font-semibold text-brand-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">
                Order {reading.title} — {reading.price}<span aria-hidden="true">↗</span>
              </a>
            ) : (
              <>
                <button type="button" disabled data-order-reading={reading.id} aria-describedby={`${reading.id}-availability`} className="min-h-12 w-full cursor-not-allowed bg-brand-ink px-4 py-4 text-center text-sm font-semibold text-brand-paper">
                  Order {reading.title} — {reading.price}
                </button>
                <p id={`${reading.id}-availability`} className="mt-2 text-center text-xs text-brand-ink-soft">Ordering opens soon.</p>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-brand-ink-soft">
        <p>{READING_FOLLOW_UP}</p>
        <p className="mt-2">For questions about your reading, email <a href={`mailto:${READING_SUPPORT_EMAIL}`} className="break-words underline underline-offset-4">{READING_SUPPORT_EMAIL}</a>. {READING_RESPONSE_TIME}</p>
      </div>
    </>
  );
}
