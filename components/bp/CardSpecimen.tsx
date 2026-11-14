import { parseCard } from "@/lib/cards";

import { Gem, gemSuitFromCode } from "./Gem";

/**
 * A playing card drawn as a drafting specimen: white face, hairline edge,
 * corner indices and the suit cut as a gem in the middle.
 */
export function CardSpecimen({
  code,
  size = "md",
  caption,
}: {
  code: string;
  size?: "sm" | "md" | "lg" | "xl";
  caption?: string;
}) {
  const parsed = parseCard(code);
  const suit = gemSuitFromCode(code);
  const label = code === "Joker" ? "The Joker" : parsed?.label ?? code;
  const rank = code === "Joker" ? "★" : parsed?.rank ?? code;
  const red = parsed?.suit === "hearts" || parsed?.suit === "diamonds";
  const center = size === "xl" ? 150 : size === "lg" ? 112 : size === "md" ? 80 : 40;
  const pip = size === "sm" ? 0 : size === "xl" ? 28 : size === "lg" ? 22 : 16;

  return (
    <figure className={`bp-specimen bp-specimen--${size}`}>
      <div className="bp-specimen-face bp-reg" role="img" aria-label={label}>
        <span className={`bp-specimen-index${red ? " is-red" : ""}`} aria-hidden="true">
          <span>{rank}</span>
          {suit && pip ? <Gem suit={suit} size={pip} /> : null}
        </span>
        <span className="bp-specimen-center" aria-hidden="true">
          {suit ? <Gem suit={suit} size={center} /> : <span className="bp-specimen-joker">★</span>}
        </span>
        <span className={`bp-specimen-index is-flipped${red ? " is-red" : ""}`} aria-hidden="true">
          <span>{rank}</span>
          {suit && pip ? <Gem suit={suit} size={pip} /> : null}
        </span>
      </div>
      {caption ? <figcaption className="bp-label">{caption}</figcaption> : null}
    </figure>
  );
}
