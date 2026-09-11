"use client";

import { useId, useRef, useState } from "react";
import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { DEEP_DIVE_OFFER_SLUG, DEEP_DIVE_PRICE_LABEL, DEEP_DIVE_SESSION_PATH } from "@/lib/deep-dive";
import type { YearPreviewData } from "@/lib/year-preview";
import s from "./year.module.css";

const FEATURES = [
  ["My card", "Your full light and shadow reading"],
  ["Now", "Your chapter’s meaning and a practical prompt"],
  ["Chapters", "All seven chapters, with dates and interpretations"],
  ["Story", "The connections across your yearly map"],
];

/** Public-only sample. This component never receives or imports the paid app. */
export function YearPreviewApp({ sample, source, className = "", onOwnYear }: {
  sample: YearPreviewData;
  source: string;
  className?: string;
  onOwnYear?: (iso: string | undefined) => void;
}) {
  const [data, setData] = useState(sample);
  const [draft, setDraft] = useState("");
  const [own, setOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(0);
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  async function showPreview() {
    const request = ++requestId.current;
    setBusy(true);
    setNote("");
    setOwn(false);
    onOwnYear?.(undefined);
    try {
      const res = await fetch("/api/year-preview", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthdate: draft }),
      });
      const body = await res.json().catch(() => ({}));
      if (request !== requestId.current) return;
      if (!res.ok) {
        setNote(body.error === "joker"
          ? "December 31 is the Joker. It sits outside the 52-card calendar, so this year preview is not available for that birthday."
          : res.status === 400 || res.status === 422
            ? "That date could not be read. Check your birthday and try again."
            : "The preview is busy right now. Try again in a moment.");
        return;
      }
      const year = body as YearPreviewData;
      setData(year);
      setOwn(true);
      onOwnYear?.(year.birthdate);
      trackClientFunnelEvent("calculator_completed", {
        offerSlug: DEEP_DIVE_OFFER_SLUG, placement: `52xseven-preview-${source}`,
      });
    } catch {
      if (request === requestId.current) setNote("The preview is busy right now. Try again in a moment.");
    } finally {
      if (request === requestId.current) setBusy(false);
    }
  }

  return (
    <div className={className} data-year-preview>
      <p className="mb-3 text-center text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-bronze" aria-live="polite">
        {busy ? "Finding your preview…" : own ? "Your personal preview" : "Example preview · try your birthday"}
      </p>
      <div className={s.root}>
        <div className={`${s.phone} ${s.previewPhone}`}>
          <div className={s.notch} />
          <section className={`${s.screen} ${s.previewScreen}`} aria-label="Free Blueprint preview" aria-busy={busy}>
            <div className={s.eyebrow}>52xSeven Blueprint · Free preview</div>
            <h3 className={s.h1}>A first look at your year.</h3>
            <p className={s.p}>Find your birth card and see which chapter you’re in. Unlock the full reading when you’re ready.</p>
            <form className={`${s.field} ${s.previewField}`} onSubmit={(e) => { e.preventDefault(); void showPreview(); }}>
              <label htmlFor={fieldId}>Your birthday</label>
              <input ref={inputRef} id={fieldId} name="birthdate" type="date" className={s.input} required min="1900-01-01" max={sample.targetDate} value={draft}
                onChange={(e) => {
                  requestId.current++;
                  setDraft(e.currentTarget.value); setOwn(false); setData(sample); setBusy(false); setNote(""); onOwnYear?.(undefined);
                }} />
              <button className={`${s.btn} ${s.btnGhost}`} type="submit" disabled={busy}>{busy ? "Finding your card…" : "Show my preview"}</button>
            </form>
            {note && <p role="status" className={s.note}>{note}</p>}
            {!own && <p className={s.note}>An example birthday is shown below. Enter yours to personalize it.</p>}
            <div className={`${s.card} ${s.cardGlow} ${s.hero}`}>
              <div className={`${s.pc} ${s.pcSm} ${data.birthCard.red ? s.pcRed : ""}`} aria-label={data.birthCard.name}>
                <div className={s.r}>{data.birthCard.rank}<small>{data.birthCard.suit}</small></div>
                <div className={s.c}>{data.birthCard.suit}</div>
              </div>
              <div className={s.stack}>
                <div className={s.eyebrow}>{own ? "Your birth card" : "Example birth card"}</div>
                <h4 className={s.h2}>{data.birthCard.name}</h4>
                <p className={`${s.p} ${s.small}`}>{data.introduction}</p>
              </div>
            </div>
            <div className={`${s.card} ${s.stack}`}>
              <div className={s.eyebrow}>{own ? "Your current chapter" : "Example current chapter"}</div>
              <h4 className={s.h3}>{data.current.planet}</h4>
              <p className={s.p}>{data.current.startLabel} – {data.current.endLabel}</p>
              <p className={s.note}>The chapter’s card, meaning, and reflection prompt are included with your full year.</p>
            </div>
            <div className={`${s.card} ${s.stack}`}>
              <div className={s.eyebrow}>Included after purchase</div>
              <div className="grid grid-cols-2 gap-2" aria-label="Explore what is included">
                {FEATURES.map(([title], index) => <button key={title} type="button" className={`${s.btn} ${s.btnGhost}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>{title} <span aria-hidden="true">↗</span></button>)}
              </div>
              <p className={`${s.p} ${s.small}`} aria-live="polite">{FEATURES[selected][1]}. Available in your full Blueprint.</p>
              {own ? (
                <form action={DEEP_DIVE_SESSION_PATH} method="post" data-analytics-checkout>
                  <input type="hidden" name="birthdate" value={data.birthdate} />
                  <input type="hidden" name="source" value={source} />
                  <button type="submit" className={s.btn} disabled={busy}>Unlock my full year — {DEEP_DIVE_PRICE_LABEL}</button>
                </form>
              ) : <button type="button" className={s.btn} onClick={() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ block: "center", behavior: "auto" }); }}>Enter your birthday to unlock</button>}
              <p className={s.note}>12 months of access · one payment · no renewal.<br />Instant access after payment, plus an emailed sign-in link.</p>
            </div>
          </section>
        </div>
      </div>
      <p className="mt-3 text-center text-xs leading-relaxed text-brand-ink-soft">A limited sample, calculated from your birthday. Full readings unlock after payment.</p>
    </div>
  );
}
