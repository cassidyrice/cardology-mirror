"use client";

import { CardBack } from "@/components/cards/CardBack";
import { ShareBirthResultButton } from "@/components/share/ShareCardCanvas";
import { parseCard } from "@/lib/cards";
import { shareFacePathFromCode } from "@/lib/share-cards";

export function BirthShareHero({ birthCard }: { birthCard?: string }) {
  const isJoker = birthCard === "Joker";
  const label = isJoker
    ? "The Joker"
    : birthCard
      ? parseCard(birthCard)?.label
      : null;
  const face = birthCard ? shareFacePathFromCode(birthCard) : null;

  return (
    <div className="mx-auto flex w-full max-w-[17.5rem] flex-col items-center text-center">
      <div className="hero-card-stage hero-card-float">
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
          <p className="mt-1 font-serif text-3xl leading-tight text-brand-ink [text-wrap:balance]">
            {label}
          </p>
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
