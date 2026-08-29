/**
 * Birthday → card-level Deep Dive PDF. Server/fulfillment only.
 * Birthday in Stripe metadata is the source of truth; card_slug is optional.
 * Joker / Dec 31 fails closed — never a silent King of Spades fallback.
 */

import { birthCardSlug } from "@/lib/birth-card-calculator";
import { resolvePublicBirth } from "@/lib/birth-card-truth";
import {
  DEEP_DIVE_BONUSES,
  deepDiveCardFile,
  isJokerBirthdate,
  type DeepDiveFile,
} from "@/lib/deep-dive";
import { parseIsoCalendarDate } from "@/lib/worker-seo-routes";

export function deepDiveCardPdfForBirthday(
  birthday: string | undefined | null,
): DeepDiveFile | null {
  if (!birthday) return null;
  const parsed = parseIsoCalendarDate(birthday);
  if (!parsed) return null;
  const birth = resolvePublicBirth(parsed.month, parsed.day);
  if (birth.kind === "joker") return null;
  const slug = birthCardSlug(birth.code);
  if (!slug) return null;
  return deepDiveCardFile(slug);
}

export function deepDiveFilesForBirthday(
  birthday: string | undefined | null,
): DeepDiveFile[] {
  const files: DeepDiveFile[] = [...DEEP_DIVE_BONUSES];
  const card = deepDiveCardPdfForBirthday(birthday);
  if (card) files.push(card);
  return files;
}

export { isJokerBirthdate };
