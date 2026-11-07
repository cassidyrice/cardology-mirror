import "@/app/born-on/born-on.css";

import { SeoShell, StageCard } from "@/components/seo/SeoShell";
import type { BornOnPage } from "@/lib/born-on";
import { birthdateBySlug } from "@/lib/seo-cards";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

/** A birthday page from the Worker port, with the day's card pinned beside it. */
export function BornOnPageView({ page, slug }: { page: BornOnPage; slug?: string }) {
  const card = slug ? birthdateBySlug(slug)?.card ?? null : null;
  const isJokerDay = slug === "december-31";
  const stage = card
    ? <StageCard slug={card.slug} label={card.label} />
    : isJokerDay
      ? <StageCard slug="joker" label="The Joker" />
      : undefined;
  return (
    <SeoShell stage={stage}>
      {page.jsonld ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(page.jsonld) }}
        />
      ) : null}
      <div className="bo" data-born-on data-staged={stage ? "true" : undefined}>
        <div className="wrap" dangerouslySetInnerHTML={{ __html: page.body }} />
      </div>
    </SeoShell>
  );
}
