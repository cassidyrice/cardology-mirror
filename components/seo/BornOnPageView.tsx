import "@/app/born-on/born-on.css";

import { SeoShell } from "@/components/seo/SeoShell";
import type { BornOnPage } from "@/lib/born-on";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

export function BornOnPageView({ page }: { page: BornOnPage }) {
  return (
    <SeoShell>
      {page.jsonld ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(page.jsonld) }}
        />
      ) : null}
      <div className="bo" data-born-on>
        <div className="wrap" dangerouslySetInnerHTML={{ __html: page.body }} />
      </div>
    </SeoShell>
  );
}
