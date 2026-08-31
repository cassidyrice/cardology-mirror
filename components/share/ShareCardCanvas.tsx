"use client";

import { useState } from "react";
import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import {
  renderBirthSharePng,
  renderCompatSharePng,
  sharePngFile,
  type ShareCardIdentity,
} from "@/lib/share-cards";

type Status = "idle" | "busy" | "copied" | "shared" | "downloaded" | "error";

function statusLabel(status: Status): string {
  switch (status) {
    case "busy":
      return "Preparing…";
    case "copied":
      return "Copied";
    case "shared":
      return "Shared";
    case "downloaded":
      return "Downloaded";
    case "error":
      return "Try again";
    default:
      return "Share";
  }
}

async function runShare(
  render: () => Promise<{ blob: Blob; label: string }>,
  filename: string,
  title: string,
  placement: string,
): Promise<Status> {
  trackClientFunnelEvent("card_shared", { placement });
  const { blob, label } = await render();
  const result = await sharePngFile(blob, filename, title || label);
  if (result === "dismissed") return "idle";
  return result;
}

export function ShareBirthResultButton({
  birthCard,
  placement = "birth-card-calculator-share",
  className = "paper-button large-button w-full max-w-md",
}: {
  birthCard: string;
  placement?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const isJoker = birthCard === "Joker";

  async function onClick() {
    if (status === "busy") return;
    setStatus("busy");
    try {
      const next = await runShare(
        () => renderBirthSharePng({ birthCard }),
        isJoker ? "joker-birth-card.png" : "birth-card.png",
        isJoker ? "The Joker" : "Birth card",
        placement,
      );
      setStatus(next);
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2200);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === "busy"}
      className={className}
      data-share-kind="birth-result"
      aria-label={
        isJoker
          ? "Copy or share The Joker birth card image"
          : "Copy or share birth card image"
      }
    >
      {statusLabel(status)}
    </button>
  );
}

export function ShareCompatDuelButton({
  firstBirthCard,
  secondBirthCard,
  firstLifePathSeatCodes,
  placement = "compatibility-calculator-share",
}: {
  firstBirthCard: string;
  secondBirthCard: string;
  firstLifePathSeatCodes: string[];
  placement?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const disabled =
    firstBirthCard === "Joker" ||
    secondBirthCard === "Joker" ||
    firstLifePathSeatCodes.length === 0;

  async function onClick() {
    if (disabled || status === "busy") return;
    setStatus("busy");
    try {
      const next = await runShare(
        () =>
          renderCompatSharePng({
            firstBirthCard,
            secondBirthCard,
            firstLifePathSeatCodes,
          }),
        "compatibility-duel.png",
        "Birth card comparison",
        placement,
      );
      setStatus(next);
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2200);
    }
  }

  if (disabled) {
    // Honest Joker: no silent K♠ duel. Do not fabricate seats.
    return (
      <p className="text-center text-sm text-brand-ink-soft" data-share-kind="compat-duel-joker">
        Joker has no duel share
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === "busy"}
      className="paper-button large-button w-full max-w-md"
      data-share-kind="compat-duel"
      aria-label="Copy or share compatibility duel image"
    >
      {statusLabel(status)}
    </button>
  );
}

/** @deprecated Prefer ShareBirthResultButton / ShareCompatDuelButton. */
export function ShareCardCanvas(props: {
  mode: "birth" | "compat";
  birthCard?: string;
  firstBirthCard?: string;
  secondBirthCard?: string;
  firstLifePathSeatCodes?: string[];
}) {
  if (props.mode === "birth" && props.birthCard) {
    return <ShareBirthResultButton birthCard={props.birthCard} />;
  }
  if (
    props.mode === "compat" &&
    props.firstBirthCard &&
    props.secondBirthCard &&
    props.firstLifePathSeatCodes
  ) {
    return (
      <ShareCompatDuelButton
        firstBirthCard={props.firstBirthCard}
        secondBirthCard={props.secondBirthCard}
        firstLifePathSeatCodes={props.firstLifePathSeatCodes}
      />
    );
  }
  return null;
}

export type { ShareCardIdentity };
