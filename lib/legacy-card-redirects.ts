const RANK_ALIASES: Record<string, string> = {
  ace: "ace",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  jack: "jack",
  queen: "queen",
  king: "king",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
};

const SUITS = new Set(["hearts", "clubs", "diamonds", "spades"]);

export function legacyCardDestination(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const meaningMatch = normalized.match(
    /^\/([a-z0-9]+)-of-([a-z]+)-meaning$/i,
  );
  const staticHtmlMatch = normalized.match(
    /^\/cards\/([a-z0-9]+)-of-([a-z]+)\.html$/i,
  );
  const match = meaningMatch ?? staticHtmlMatch;

  if (!match) return null;

  const rank = RANK_ALIASES[match[1].toLowerCase()];
  const suit = match[2].toLowerCase();
  if (!rank || !SUITS.has(suit)) return null;

  return `/birth-card/${rank}-of-${suit}`;
}
