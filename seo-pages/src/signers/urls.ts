import { CHECKOUT_PATH } from "../urls";

export const SIGNERS_HUB_PATH = "/signers";
export const SIGNERS_SITEMAP = "/sitemap-signers.xml";

export function signerPath(slug: string): string {
  return `${SIGNERS_HUB_PATH}/${slug}`;
}

export function signerCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "signers",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function signerOgSlot(slug: string): string {
  return `/og/signers/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function bioguidePath(bioguideId: string): string {
  return `https://bioguide.congress.gov/search/bio/${bioguideId}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}
