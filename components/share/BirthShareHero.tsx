"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CardBack } from "@/components/cards/CardBack";
import { ShareBirthResultButton } from "@/components/share/ShareCardCanvas";
import { parseCard } from "@/lib/cards";
import { shareFacePathFromCode } from "@/lib/share-cards";

export function BirthShareHero({
  birthCard,
  action,
  compact = false,
}: {
  birthCard?: string;
  /** Rendered between the card name and Share (the calculator's reading button). */
  action?: ReactNode;
  compact?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!compact) return;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [compact, birthCard]);
  const isJoker = birthCard === "Joker";
  const label = isJoker
    ? "The Joker"
    : birthCard
      ? parseCard(birthCard)?.label
      : null;
  const face = birthCard ? shareFacePathFromCode(birthCard) : null;

  return (
    <div className={`mx-auto flex w-full flex-col items-center text-center ${compact ? "max-w-xl" : "max-w-[17.5rem]"}`}>
      <div className={compact ? "w-16 aspect-[2/3]" : "hero-card-stage hero-card-float"}>
        {face ? (
          <div className="flip-scene h-full w-full" key={birthCard}>
            <div className="flip-inner h-full w-full">
              <div className="flip-face h-full w-full">
                <img
                  src={face}
                  alt={label ?? "Birth card"}
                  width={624}
                  height={936}
                  className="hero-card-face"
                />
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
      {label ? (
        <>
          <p className="type-eyebrow mt-4">Birth card</p>
          <h2 ref={heading} tabIndex={-1} className="mt-1 scroll-mt-20 font-serif text-3xl leading-tight text-brand-ink [text-wrap:balance]">
            {label}
          </h2>
          {action ? <div className="mt-4 w-full">{action}</div> : null}
          <div className="mt-4 w-full">
            <ShareBirthResultButton
              birthCard={birthCard!}
              placement="birth-card-calculator-hero-share"
              className="paper-button large-button w-full"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
