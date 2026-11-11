import "@/app/born-on/born-on.css";

import { QuestionReadingComposer } from "@/components/checkout/QuestionReadingDrawer";
import { SeoShell, StageCard } from "@/components/seo/SeoShell";
import type { BornOnPage } from "@/lib/born-on";
import { birthdateBySlug } from "@/lib/seo-cards";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

/** A birthday page from the Worker port, with the day's card pinned beside it. */
export function BornOnPageView({ page, slug }: { page: BornOnPage; slug?: string }) {
  const dateInfo = slug ? birthdateBySlug(slug) : null;
  const card = dateInfo?.card ?? null;
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
        {!isJokerDay ? (
          <div className="wrap">
            <QuestionReadingComposer
              defaultTrack="timing-map"
              monthDayHint={
                dateInfo
                  ? { month: dateInfo.month, day: dateInfo.day, label: dateInfo.label }
                  : undefined
              }
              placement={slug ? `born-on-${slug}` : "born-on-index"}
              compact
            />
          </div>
        ) : null}
      </div>
    </SeoShell>
  );
}
