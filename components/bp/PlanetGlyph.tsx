import type { PlanetName } from "@/lib/types";

// Planet symbols drawn as strokes so they render the same on every device
// (no symbol font to load, no emoji substitution for ♀ and ♂).
const PATHS: Record<PlanetName, string> = {
  Mercury: "M8.2 2.8 Q12 7.4 15.8 2.8 M12 6.5 a4.5 4.5 0 1 0 0.01 0 M12 15.5 V22 M9 19 H15",
  Venus: "M12 4 a5 5 0 1 0 0.01 0 M12 14 V22 M8.5 18.5 H15.5",
  Mars: "M10 9 a5 5 0 1 0 0.01 0 M13.6 10.4 L19.5 4.5 M14.5 4.5 H19.5 V9.5",
  Jupiter: "M5.5 7.5 Q5.5 3 9.5 3 Q13.5 3 12.5 8 L7 15.5 H19 M15.5 10 V21.5",
  Saturn: "M6 5 H12 M9 2 V15 M9 12 Q12 8.5 15 10.8 Q17.5 13.5 14.5 17 Q12.8 19 14.5 21.5",
  Uranus: "M6 3 V13 M18 3 V13 M6 8 H18 M12 3 V15.5 M12 15.5 a3 3 0 1 0 0.01 0",
  Neptune: "M5 4 Q5 12.5 12 12.5 Q19 12.5 19 4 M12 3 V22 M8 18 H16",
};

export function PlanetGlyph({
  planet,
  size = 20,
  label,
  className,
}: {
  planet: PlanetName;
  size?: number;
  /** Pass when the glyph stands alone without the planet's name beside it. */
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `bp-glyph ${className}` : "bp-glyph"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[planet]} />
    </svg>
  );
}
