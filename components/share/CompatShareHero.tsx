"use client";

import type { ReactNode } from "react";
import { CardBack } from "@/components/cards/CardBack";
import { ShareCompatDuelButton } from "@/components/share/ShareCardCanvas";
import { parseCard } from "@/lib/cards";
import { shareFacePathFromCode } from "@/lib/share-cards";

function FaceCard({ code }: { code?: string }) {
  const isJoker = code === "Joker";
  const label = isJoker ? "The Joker" : code ? parseCard(code)?.label : null;
  const face = code && !isJoker ? shareFacePathFromCode(code) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="compat-hero-stage hero-card-float">
        {face ? (
          <div className="flip-scene h-full w-full" key={code}>
            <div className="flip-inner h-full w-full">
              <div className="flip-face h-full w-full">
                <img
                  src={face}
                  alt={label ?? "Birth card"}
                  width={432}
                  height={648}
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
        <p className="mt-3 text-brand-ink [text-wrap:balance]">
          {label}
        </p>
      ) : null}
    </div>
  );
}

export function CompatShareHero({
  firstBirthCard,
  secondBirthCard,
  firstLifePathSeatCodes,
  stage,
}: {
  firstBirthCard?: string;
  secondBirthCard?: string;
  firstLifePathSeatCodes?: string[];
  /** The two cards on their board, when the page draws them elsewhere; otherwise the duel renders here. */
  stage?: ReactNode;
}) {
  const ready = Boolean(firstBirthCard && secondBirthCard);

  return (
    <div className="compat-duel">
      {stage ?? (
        <div className="compat-hero-row">
          <FaceCard code={firstBirthCard} />
          <FaceCard code={secondBirthCard} />
        </div>
      )}
      {ready && firstLifePathSeatCodes ? (
        <div className="compat-duel-share">
          <ShareCompatDuelButton
            firstBirthCard={firstBirthCard!}
            secondBirthCard={secondBirthCard!}
            firstLifePathSeatCodes={firstLifePathSeatCodes}
            className="paper-button large-button"
          />
        </div>
      ) : null}
    </div>
  );
}
