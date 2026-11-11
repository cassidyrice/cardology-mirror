import "@/app/born-on/born-on.css";

import { QuestionReadingComposer } from "@/components/checkout/QuestionReadingDrawer";
import { SeoShell, StageCard } from "@/components/seo/SeoShell";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

/** Renders a page ported from the cardology-unlock Worker inside the shared site chrome.
 *  `cards` pins the page's card or pair beside the reading (docs/design/DIRECTION.md). */
export function WorkerPageView({
  page,
  kind,
  cards = [],
}: {
  page: { jsonld: unknown; body: string };
  kind: string;
  cards?: { slug: string; label: string }[];
}) {
  const stage =
    cards.length === 1 ? (
      <StageCard slug={cards[0].slug} label={cards[0].label} />
    ) : cards.length === 2 ? (
      <div className="shell-stage-pair">
        <StageCard slug={cards[0].slug} label={cards[0].label} />
        <StageCard slug={cards[1].slug} label={cards[1].label} />
      </div>
    ) : undefined;
  return (
    <SeoShell stage={stage}>
      {page.jsonld ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(page.jsonld) }}
        />
      ) : null}
      <div className="bo" data-worker-page={kind} data-staged={stage ? "true" : undefined}>
        <div className="wrap" dangerouslySetInnerHTML={{ __html: page.body }} />
        <div className="wrap">
          <QuestionReadingComposer
            defaultTrack="chemistry-check"
            placement={`worker-${kind}`}
            compact
          />
        </div>
      </div>
    </SeoShell>
  );
}
