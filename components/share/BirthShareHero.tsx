"use client";

import type { ReactNode } from "react";
import { CardBack } from "@/components/cards/CardBack";
import { ShareBirthResultButton } from "@/components/share/ShareCardCanvas";
import { parseCard } from "@/lib/cards";
import { shareFacePathFromCode } from "@/lib/share-cards";

/**
 * The calculator's card on its board. Face down until there is a birthday;
 * then it turns to face you (docs/design/MOTION.md, "The card turns to face
 * you"). Used twice on the calculator page: pinned in the shell's rail on
 * desktop and inline above the result on phones.
 */
export function BirthShareHero({
  birthCard,
  action,
  compact = false,
}: {
  birthCard?: string;
  /** Rendered between the card name and Share (the calculator's reading button). */
  action?: ReactNode;
  /** The rail copy: card only, no name, no actions. */
  compact?: boolean;
}) {
  const isJoker = birthCard === "Joker";
  const label = isJoker
    ? "The Joker"
    : birthCard
      ? parseCard(birthCard)?.label
      : null;
  const face = birthCard ? shareFacePathFromCode(birthCard) : null;

  return (
    <div className="calc-card" data-has-card={birthCard ? "true" : "false"}>
      {compact ? (
        <img
          className="calc-rail-film"
          src="/video/hero-loop-poster-9x16.webp"
          alt="The deck face down on linen"
          width={720}
          height={1280}
          fetchPriority="high"
          decoding="async"
        />
      ) : null}
      <div className="hero-card-stage hero-card-float calc-card-stage">
        {birthCard ? (
          <div className="flip-scene h-full w-full" key={birthCard}>
            <div className="flip-inner h-full w-full">
              <div className="flip-face h-full w-full">
                {face ? (
                  <img
                    src={face}
                    alt={label ? `${label} playing card` : "Birth card"}
                    width={624}
                    height={936}
                    className="hero-card-face"
                  />
                ) : (
                  <div className="hero-card-face calc-card-joker" role="img" aria-label="The Joker">
                    Joker
                  </div>
                )}
              </div>
              <div className="flip-face flip-back">
                <div className="hero-card-back">
                  <CardBack />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hero-card-back">
            <CardBack />
          </div>
        )}
      </div>
      {label && !compact ? (
        <div className="calc-card-text" data-in-view="true">
          <p className="calc-card-name" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
            {label}
          </p>
          <p className="calc-card-sub" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
            Your birth card.
          </p>
          {action ? (
            <div className="calc-card-action" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
              {action}
            </div>
          ) : null}
          <div data-rise style={{ "--rise-i": 3 } as React.CSSProperties}>
            <ShareBirthResultButton
              birthCard={birthCard!}
              placement="birth-card-calculator-hero-share"
              className="paper-button large-button w-full"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
