/**
 * Normalises Wikipedia plaintext extracts for rendering.
 *
 * Lead-section extracts (`exintro=1`) are already clean prose. Full-article
 * extracts carry MediaWiki section headers ("== Biography =="), pronunciation
 * blocks and list fragments, which must not be spliced into a paragraph.
 */

/** Strip section headers and other artefacts from a plaintext extract. */
export function cleanArticleText(text: string): string {
  return (
    text
      // MediaWiki section headers at any depth.
      .replace(/^=+\s*[^=\n]+\s*=+\s*$/gm, "\n")
      // IPA / pronunciation runs left dangling by the extractor.
      .replace(/\(\s*(?:[A-Za-z]+ pronunciation:)?\s*\[[^\]]*\]\s*;?\s*/g, "(")
      .replace(/\(\s*;\s*/g, "(")
      .replace(/\(\s*\)/g, "")
      // Collapse the blank-line runs the header removal leaves behind.
      .replace(/\n{2,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

/**
 * Longest verified prose for a row: the full extract when present, else the
 * short REST summary. Both come from the same Wikipedia article under the same
 * CC BY-SA 4.0 licence, so this only ever changes how much is used, never where
 * it came from.
 */
export function longestSourceProse(row: {
  source_text?: string;
  source_text_full?: string;
}): string {
  const full = cleanArticleText((row.source_text_full ?? "").trim());
  const short = cleanArticleText((row.source_text ?? "").trim());
  return full.length > short.length ? full : short;
}

/** First `max` sentences of a plaintext extract. */
export function firstSentences(text: string, max: number): string {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => s.split(" ").length >= 5)
    .slice(0, max)
    .join(" ");
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * "X on the record" section for the non-person hubs (parks, holidays, MLB
 * clubs). Same contract as the people hubs: verbatim sourced prose, attributed
 * inline, and nothing written for the page beyond the cited article.
 */
export function renderRecordSection(input: {
  heading: string;
  row: { source_text?: string; source_text_full?: string; source_url?: string; wikipedia_title?: string };
  maxSentences?: number;
  /** Where the page's own date came from, if not this article. */
  dateSourceNote?: string;
}): string {
  const prose = firstSentences(longestSourceProse(input.row), input.maxSentences ?? 12);
  if (!prose) return "";
  const url = input.row.source_url ?? "";
  const title = input.row.wikipedia_title ?? "Wikipedia";
  const link = url
    ? `<a href="${escape(url)}">${escape(title)}</a>`
    : escape(title);
  return `<section data-slot="record">
      <h2>${escape(input.heading)}</h2>
      <p>${escape(prose)}</p>
      <p class="attribution">Summarised from the lead section of the Wikipedia article ${link}
        (CC BY-SA 4.0). Nothing here was written for this page beyond that article.${
          input.dateSourceNote ? ` ${escape(input.dateSourceNote)}` : ""
        }</p>
    </section>`;
}
