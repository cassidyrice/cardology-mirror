import "@/app/born-on/born-on.css";

import { SeoShell } from "@/components/seo/SeoShell";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

/** Renders a page ported from the cardology-unlock Worker inside the shared site chrome. */
export function WorkerPageView({ page, kind }: { page: { jsonld: unknown; body: string }; kind: string }) {
  return (
    <SeoShell>
      {page.jsonld ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(page.jsonld) }}
        />
      ) : null}
      <div className="bo" data-worker-page={kind}>
        <div className="wrap" dangerouslySetInnerHTML={{ __html: page.body }} />
      </div>
    </SeoShell>
  );
}
