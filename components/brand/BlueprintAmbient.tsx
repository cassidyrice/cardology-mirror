import type { CSSProperties } from "react";

type AmbientVariant =
  | "compatibility"
  | "compatibilityGuide"
  | "birthCard"
  | "blueprint"
  | "method"
  | "library";

type BlueprintAmbientProps = {
  variant: AmbientVariant;
  className?: string;
  tone?: "dark" | "paper";
};

const variantClass: Record<AmbientVariant, string> = {
  compatibility: "blueprint-ambient--compatibility",
  compatibilityGuide: "blueprint-ambient--compatibility-guide",
  birthCard: "blueprint-ambient--birth-card",
  blueprint: "blueprint-ambient--blueprint",
  method: "blueprint-ambient--method",
  library: "blueprint-ambient--library",
};

const nodes = [
  [18, 62], [32, 28], [48, 48], [66, 22], [78, 58], [54, 78], [34, 82],
] as const;

export function BlueprintAmbient({
  variant,
  className = "",
  tone = "dark",
}: BlueprintAmbientProps) {
  const style = { "--ambient-node-count": nodes.length } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`blueprint-ambient ${variantClass[variant]} blueprint-ambient--${tone} pointer-events-none select-none motion-reduce:[animation:none] ${className}`}
      data-ambient-variant={variant}
      style={style}
    >
      <svg className="blueprint-ambient__geometry" viewBox="0 0 100 100" role="presentation">
        <g className="blueprint-ambient__orbit">
          <ellipse cx="47" cy="51" rx="31" ry="19" />
          <ellipse cx="58" cy="48" rx="25" ry="33" />
        </g>
        <g className="blueprint-ambient__plexus">
          <path d="M18 62 32 28 48 48 66 22 78 58 54 78 34 82 18 62" />
          <path d="M18 62 48 48 78 58M32 28 54 78M66 22 34 82" />
          {nodes.map(([cx, cy], index) => (
            <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r={index % 3 === 0 ? 1.35 : 0.9} />
          ))}
        </g>
        <g className="blueprint-ambient__cards">
          <rect x="26" y="34" width="20" height="30" rx="2" />
          <rect x="54" y="36" width="20" height="30" rx="2" />
        </g>
      </svg>
      <span className="blueprint-ambient__wash" />
    </div>
  );
}
