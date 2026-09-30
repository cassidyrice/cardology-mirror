// Card Blueprint App — compatibility with one other person. Compares both
// birth cards AND both ruling cards (docs/reading-interpretation-reference.md
// §9: "Always compare Birth Cards and Planetary Ruling Cards") on the Life
// Path boards from lib/life-path.ts. Seats are one-way on purpose: landing on
// someone's board is not symmetric.

import { canonicalCalendarDate } from "./birthdate";
import { cardology } from "./engine-core/engine.js";
import { buildLifePathProfileForCard, type LifePathCardProfile } from "./life-path";
import { JokerNotSupportedError, ReadingError } from "./reading";
import { toYearCard, type YearCard } from "./year-blueprint";

type Anchor = "birth card" | "ruling card";

export interface ConnectionSeat {
  /** Whose board the card lands on. */
  board: "yours" | "theirs";
  boardAnchor: Anchor;
  /** The card that lands, and which of the two people it belongs to. */
  cardAnchor: Anchor;
  card: YearCard;
  position: string;
  reading: string;
}

export interface AppConnection {
  name: string;
  birthCard: YearCard;
  ruling: YearCard[];
  /** Their cards on your boards. */
  theyOnYou: ConnectionSeat[];
  /** Your cards on their boards. */
  youOnThem: ConnectionSeat[];
  sharedCount: number;
  summary: string;
}

interface Side {
  birth: string;
  ruling: string | null;
}

function sideFor(birthdate: string): Side {
  const iso = canonicalCalendarDate(birthdate);
  if (!iso) throw new ReadingError(`invalid birthdate: ${birthdate}`);
  const [, m, d] = iso.split("-").map(Number);
  if (m === 12 && d === 31) throw new JokerNotSupportedError();
  const [birth] = cardology.getBirthCard(m, d);
  const prc = cardology.getPlanetaryRulingCard(m, d);
  // Same rule as the app: the first ruler that isn't the birth card.
  const ruling = ((Array.isArray(prc) ? prc : [prc]) as Array<string | null>).find((c) => c && c !== birth) ?? null;
  return { birth, ruling };
}

function anchors(side: Side): Array<[Anchor, string]> {
  const list: Array<[Anchor, string]> = [["birth card", side.birth]];
  if (side.ruling && side.ruling !== side.birth) list.push(["ruling card", side.ruling]);
  return list;
}

function seatsOn(
  board: ConnectionSeat["board"],
  host: Side,
  guest: Side,
): ConnectionSeat[] {
  const seats: ConnectionSeat[] = [];
  for (const [boardAnchor, hostCard] of anchors(host)) {
    const profile: LifePathCardProfile | null = buildLifePathProfileForCard(hostCard);
    if (!profile) continue;
    for (const [cardAnchor, guestCard] of anchors(guest)) {
      const role = profile.allCards.find((c) => c.card === guestCard);
      if (!role) continue;
      seats.push({
        board,
        boardAnchor,
        cardAnchor,
        card: toYearCard(guestCard),
        position: role.shortTitle,
        reading: role.relationship,
      });
    }
  }
  return seats;
}

export function buildConnection(ownerBirthdate: string, otherBirthdate: string, name: string): AppConnection {
  const you = sideFor(ownerBirthdate);
  const them = sideFor(otherBirthdate);
  const theyOnYou = seatsOn("yours", you, them);
  const youOnThem = seatsOn("theirs", them, you);

  const yourCards = new Set(
    anchors(you).flatMap(([, c]) => buildLifePathProfileForCard(c)?.allCards.map((x) => x.card) ?? []),
  );
  const theirCards = new Set(
    anchors(them).flatMap(([, c]) => buildLifePathProfileForCard(c)?.allCards.map((x) => x.card) ?? []),
  );
  const sharedCount = [...yourCards].filter((c) => theirCards.has(c)).length;

  const label = name.trim() || "They";
  const total = theyOnYou.length + youOnThem.length;
  const summary =
    total === 0
      ? `No direct seat either way. Read ${label} through suits, timing and the ${sharedCount} cards your boards share.`
      : `${total} direct connection${total === 1 ? "" : "s"} between you, plus ${sharedCount} cards your boards share.`;

  return {
    name: label,
    birthCard: toYearCard(them.birth),
    ruling: them.ruling && them.ruling !== them.birth ? [toYearCard(them.ruling)] : [],
    theyOnYou,
    youOnThem,
    sharedCount,
    summary,
  };
}
