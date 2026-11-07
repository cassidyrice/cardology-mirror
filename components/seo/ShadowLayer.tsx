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
      className="card-shadow"
      aria-labelledby="shadow-archetype"
      data-shadow-layer={s.code}
    >
      <h2 id="shadow-archetype" className="card-h2">
        Your shadow has a name. {s.label}: {s.archetype}
      </h2>
      <blockquote className="card-shadow-quote">
        &ldquo;{s.worldview}&rdquo;
      </blockquote>
      <p className="prose-reading mt-4">{s.coreShadow}</p>
      {s.keywords && s.keywords.length > 0 ? (
        <p className="card-shadow-keywords" aria-label="Shadow keywords">
          {s.keywords.join(", ")}
        </p>
      ) : null}
      <p className="prose-reading mt-3">
        <span className="font-semibold text-brand-ink">In the light{s.lightName ? `: ${s.lightName}` : ""}.</span>{" "}
        {s.inTheLight}
      </p>
      <p className="card-note">
        From <em>The Shadow Deck</em> by Cassidy Rice. Your birthday fixes the card. The shadow is the
        part of it you were taught to keep in the basement. It got out. A mirror, not a forecast.
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
    <section className="card-section" aria-labelledby="shadow-prompts" data-shadow-prompts={s.code}>
      <h2 id="shadow-prompts" className="card-h2">
        Three questions for {s.archetype}. Answer them.
      </h2>
      <p className="prose-reading mb-4">
        Five minutes. A notebook. Answer honestly. Nobody reads it but you, and you already know the answers.
      </p>
      <ol className="card-prompts">
        {s.prompts.map((p, i) => (
          <li key={i}>
            <p className="prose-reading">{p}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
