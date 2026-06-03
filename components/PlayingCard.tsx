"use client";

// Shared card visual. Agent 9 owns/enhances this; keep the prop contract stable.
import { parseCard } from "@/lib/cards";
import { CardFace } from "@/components/cards/CardFace";
import { CardBack } from "@/components/cards/CardBack";

export interface PlayingCardProps {
  code: string;            // e.g. "8♦"
  title?: string;          // archetype label, e.g. "The Businessman"
  subtitle?: string;       // e.g. "Birth Card"
  size?: "sm" | "md" | "lg";
  className?: string;
  // --- optional enhancements (all backward-compatible) ---
  active?: boolean;        // gold halo — marks the current period
  glow?: boolean;          // alias for active
  float?: boolean;         // gentle drift float
  faceDown?: boolean;      // show the cosmic card back
  flippable?: boolean;     // toggle face/back on click
  onClick?: () => void;
}

const SIZES = {
  sm: "h-20 w-14",
  md: "h-32 w-24",
  lg: "h-48 w-36",
} as const;

import { useState } from "react";

export function PlayingCard({
  code,
  title,
  subtitle,
  size = "md",
  className = "",
  active = false,
  glow = false,
  float = false,
  faceDown = false,
  flippable = false,
  onClick,
}: PlayingCardProps) {
  const c = parseCard(code);
  const [flipped, setFlipped] = useState(false);
  if (!c) return null;

  const showBack = flippable ? flipped : faceDown;
  const haloed = active || glow;
  const interactive = flippable || !!onClick;

  const handleClick = () => {
    if (flippable) setFlipped((f) => !f);
    onClick?.();
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? handleClick : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick();
                }
              }
            : undefined
        }
        className={[
          "relative rounded-xl border border-white/10",
          "bg-gradient-to-br from-haze to-cosmos",
          "shadow-lg transition-transform duration-300",
          SIZES[size],
          float ? "animate-drift" : "",
          interactive ? "cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]" : "",
          haloed ? "ring-1 ring-gold/60" : "",
        ].join(" ")}
        style={{
          boxShadow: haloed
            ? `0 0 0 1px #d9b26a55, 0 0 26px -4px #d9b26a99, 0 10px 34px -14px ${c.color}66`
            : `0 8px 30px -12px ${c.color}66`,
        }}
      >
        {showBack ? <CardBack /> : <CardFace card={c} size={size} />}
      </div>

      {(title || subtitle) && (
        <div className="text-center">
          {subtitle && <p className="eyebrow">{subtitle}</p>}
          {title && <p className="font-serif text-sm text-bone">{title}</p>}
        </div>
      )}
    </div>
  );
}
