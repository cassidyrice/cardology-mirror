import { CHECKOUT_PATH } from "../urls";
import type { HouseChairRow, HouseParty, HouseRoleKind } from "./types";

export const HOUSE_CHAIRS_HUB_PATH = "/house-chairs";
export const HOUSE_CHAIRS_SITEMAP = "/sitemap-house-chairs.xml";
export const HOUSE_GOV_LEADERSHIP = "https://www.house.gov/leadership";
export const HOUSE_GOV_COMMITTEES = "https://www.house.gov/committees";
export const HISTORY_HOUSE_BIOGUIDE = "https://history.house.gov/People/Search/";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function houseChairPath(slug: string): string {
  return `${HOUSE_CHAIRS_HUB_PATH}/${slug}`;
}

export function houseChairCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "house-chairs",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function houseChairOgSlot(slug: string): string {
  return `/og/house-chairs/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedHouseChairSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "house-chairs slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "house-chairs slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "house-chairs slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "house-chairs slug cannot collide with a month-day date slug";
  }
  return null;
}

export function partyLabel(party: HouseParty): string {
  switch (party) {
    case "Democrat":
      return "Democratic";
    case "Republican":
      return "Republican";
    default: {
      const exhaustive: never = party;
      return exhaustive;
    }
  }
}

export function roleKindLabel(kind: HouseRoleKind): string {
  switch (kind) {
    case "leadership":
      return "House leadership";
    case "chair":
      return "standing committee chair";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function officePhrase(person: HouseChairRow): string {
  const seat = `${person.state}’s ${ordinal(person.district)} district`;
  if (person.role_kind === "leadership") {
    return `${person.office} (${partyLabel(person.party)}, ${seat})`;
  }
  return `${person.office} (${partyLabel(person.party)}, ${seat})`;
}

export function ordinal(value: number): string {
  const ones = value % 10;
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  if (ones === 1) return `${value}st`;
  if (ones === 2) return `${value}nd`;
  if (ones === 3) return `${value}rd`;
  return `${value}th`;
}
