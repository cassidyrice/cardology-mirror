import { shadowEntry, shadowLayerEnabled } from "@/lib/shadow-deck";

/**
 * The spicy layer on a card page: the card's shadow archetype in Cass's own
 * words. Archetype name, the worldview line in the person's own voice, and
 * the turn "in the light". Sits above the $19 CTA so the hook comes first.
 */
export function ShadowLayer({ code }: { code: string }) {
  if (!shadowLayerEnabled(code)) return null;
  const s = shadowEntry(code);
  if (!s) return null;
  return (
    <section
      className="mt-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5"
      aria-labelledby="shadow-archetype"
      data-shadow-layer={s.code}
    >
      <p className="eyebrow !text-brand-bronze">The shadow, by name</p>
      <h2 id="shadow-archetype" className="mt-2 font-serif text-2xl text-brand-ink">
        {s.label}: {s.archetype}
      </h2>
      <blockquote className="mt-4 border-l-2 border-brand-line pl-4 font-serif text-xl leading-snug text-brand-ink">
        &ldquo;{s.worldview}&rdquo;
      </blockquote>
      <p className="prose-reading mt-4 text-brand-ink-soft">{s.coreShadow}</p>
      {s.keywords && s.keywords.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Shadow keywords">
          {s.keywords.map((k) => (
            <li key={k} className="rounded-full border border-brand-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-ink-soft">
              {k}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="prose-reading mt-3 text-brand-ink-soft">
        <span className="font-semibold text-brand-ink">In the light{s.lightName ? `: ${s.lightName}` : ""}.</span>{" "}
        {s.inTheLight}
      </p>
      <p className="mt-4 text-xs text-brand-ink-soft">
        From <em>The Shadow Deck</em> by Cassidy Rice. Your birthday fixes the card; the shadow is the
        part of it you were taught to keep in the basement. A mirror, not a forecast.
      </p>
    </section>
  );
}

/** Three journaling prompts for the card, further down the page. */
export function ShadowPrompts({ code }: { code: string }) {
  if (!shadowLayerEnabled(code)) return null;
  const s = shadowEntry(code);
  if (!s || s.prompts.length === 0) return null;
  return (
    <section className="mt-10" aria-labelledby="shadow-prompts" data-shadow-prompts={s.code}>
      <h2 id="shadow-prompts" className="eyebrow mb-2 !text-brand-bronze">
        Three questions for {s.archetype}
      </h2>
      <p className="prose-reading mb-4 text-brand-ink-soft">
        Five minutes and a notebook. Answer honestly; nobody reads it but you.
      </p>
      <ol className="space-y-3">
        {s.prompts.map((p, i) => (
          <li key={i} className="flex gap-4 rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
            <span className="font-serif text-2xl leading-none text-brand-bronze">{String(i + 1).padStart(2, "0")}</span>
            <p className="prose-reading text-brand-ink-soft">{p}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
