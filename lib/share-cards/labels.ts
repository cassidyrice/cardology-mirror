import { parseCard } from "@/lib/cards";
import { SHARE_BANNED_WORDS } from "./layout";

export type ShareCardKind = "card" | "joker";

export type ShareCardIdentity = {
  kind: ShareCardKind;
  /** Engine code e.g. "Q♦" or "Joker". Never silently remapped to K♠. */
  code: string;
  /** Grounded label for the name band — card name only. */
  label: string;
};

const PRICE_PATTERN = /\$\s*\d|\bdeep\s*dive\b|\b\$9\b/i;

/** Resolve a birth-card code into a share identity. Joker stays Joker. */
export function shareIdentityFromCode(code: string): ShareCardIdentity | null {
  if (!code) return null;
  if (code === "Joker") {
    return { kind: "joker", code: "Joker", label: "The Joker" };
  }
  const parsed = parseCard(code);
  if (!parsed) return null;
  return { kind: "card", code, label: parsed.label };
}

export function birthShareLabel(identity: ShareCardIdentity): string {
  return identity.label;
}

export function compatShareLabel(
  a: ShareCardIdentity,
  b: ShareCardIdentity,
): string {
  return `${a.label} · ${b.label}`;
}

export function labelContainsBannedWord(label: string): boolean {
  const lower = label.toLowerCase();
  return SHARE_BANNED_WORDS.some((word) => lower.includes(word));
}

export function labelContainsPrice(label: string): boolean {
  return PRICE_PATTERN.test(label);
}

/** True when a share label is safe to paint on the PNG. */
export function assertShareLabelSafe(label: string): string {
  if (labelContainsBannedWord(label)) {
    throw new Error(`Share label contains banned word: ${label}`);
  }
  if (labelContainsPrice(label)) {
    throw new Error(`Share label contains price copy: ${label}`);
  }
  return label;
}

/**
 * Joker must never be drawn as King of Spades.
 * Returns true when the given code would be a silent K♠ substitution.
 */
export function isSilentKingOfSpades(code: string, claimedJoker: boolean): boolean {
  if (!claimedJoker) return false;
  return code === "K♠" || code.toLowerCase() === "king of spades";
}
