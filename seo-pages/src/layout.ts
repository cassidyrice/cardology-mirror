import { escapeHtml, serializeJsonLd } from "./escape";
import { articleJsonLd, type JsonLdRecord } from "./jsonld";
import { SITE_NAME, SITE_URL, type Breadcrumb } from "./types";
import { abs } from "./urls";

/** Build date, used when a hub does not supply its own provenance dates. */
export const BUILD_DATE = new Date().toISOString().slice(0, 10);

const METHODOLOGY_URL = abs("/methodology");
const EDITORIAL_POLICY_URL = abs("/editorial-policy");

function longDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const month = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][m - 1];
  return `${month} ${d}, ${y}`;
}

/**
 * Adds the E-E-A-T Article node to a page's JSON-LD graph. Every hub page gets
 * author, publisher, datePublished and dateModified from one place.
 */
function withArticleNode(
  jsonLd: JsonLdRecord,
  article: JsonLdRecord,
): JsonLdRecord {
  const graph = jsonLd["@graph"];
  if (Array.isArray(graph)) {
    return { ...jsonLd, "@graph": [article, ...graph] };
  }
  return jsonLd;
}

export function renderLayout(input: {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage: string;
  ogImageAlt: string;
  jsonLd: JsonLdRecord;
  crumbs: readonly Breadcrumb[];
  body: string;
  kicker?: string;
  footer?: string;
  footerNote?: string;
  /** Date the page's underlying dates were verified against primary sources. */
  dateVerified?: string;
  /** Date this page was last rebuilt. */
  dateModified?: string;
  datePublished?: string;
  /** Primary source URLs, emitted as schema.org citation. */
  citations?: readonly string[];
}): string {
  const canonical = abs(input.canonicalPath);
  const kicker = input.kicker ?? "Birth-card coordinates";
  const footerNote =
    input.footerNote ??
    input.footer ??
    `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`;
  const dateVerified = input.dateVerified ?? BUILD_DATE;
  const dateModified = input.dateModified ?? BUILD_DATE;
  const datePublished = input.datePublished ?? dateModified;
  const article = articleJsonLd({
    headline: input.title,
    urlPath: input.canonicalPath,
    description: input.description,
    datePublished,
    dateModified,
    citations: input.citations,
  });
  const provenance = `<p class="page-provenance">Dates verified <time datetime="${escapeHtml(dateVerified)}">${escapeHtml(longDate(dateVerified))}</time> against the primary sources cited on this page · page updated <time datetime="${escapeHtml(dateModified)}">${escapeHtml(longDate(dateModified))}</time> · written and checked by <a href="${escapeHtml(abs("/about"))}" rel="author">Cassidy Rice</a> · <a href="${escapeHtml(METHODOLOGY_URL)}">Methodology</a> · <a href="${escapeHtml(EDITORIAL_POLICY_URL)}">Editorial policy</a></p>`;
  const crumbNav = input.crumbs
    .map((crumb, index) => {
      const current = index === input.crumbs.length - 1;
      const label = escapeHtml(crumb.name);
      if (current) {
        return `<span aria-current="page">${label}</span>`;
      }
      return `<a href="${escapeHtml(crumb.href)}">${label}</a>`;
    })
    .join(` <span aria-hidden="true">/</span> `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
  <meta name="description" content="${escapeHtml(input.description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(input.title)}" />
  <meta property="og:description" content="${escapeHtml(input.description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(abs(input.ogImage))}" data-slot="og-image-meta" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(input.ogImageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(input.title)}" />
  <meta name="twitter:description" content="${escapeHtml(input.description)}" />
  <meta name="twitter:image" content="${escapeHtml(abs(input.ogImage))}" />
  <link rel="stylesheet" href="/styles.css" />
  <script type="application/ld+json">${serializeJsonLd(withArticleNode(input.jsonLd, article))}</script>
</head>
<body>
  <a class="skip" href="#main-content">Skip to content</a>
  <header class="site-header">
    <a class="wordmark" href="${escapeHtml(SITE_URL)}">${escapeHtml(SITE_NAME)}</a>
    <p class="kicker">${escapeHtml(kicker)}</p>
  </header>
  <main id="main-content" tabindex="-1">
    <nav class="crumbs" aria-label="Breadcrumb">${crumbNav}</nav>
    ${input.body}
  </main>
  <footer class="site-footer">
    ${provenance}
    <p>${escapeHtml(footerNote)}</p>
  </footer>
</body>
</html>
`;
}

export function exampleBanner(): string {
  return `<p class="example-banner" data-example="true" role="note">EXAMPLE fixture page. Not a real biography. WP3 enrichment will replace placeholder copy.</p>`;
}

export function jokerLineageSlot(): string {
  return `<aside class="joker-lineage" data-slot="joker-lineage" data-cass-lock="D1">
  <h2>December 31 / Joker lineage</h2>
  <p>EXAMPLE slot — WP3 will fill the lineage note. December 31 resolves to solar value 0 (the Joker), outside the 1–52 deck. Do not invent a celebrity bio here.</p>
</aside>`;
}
