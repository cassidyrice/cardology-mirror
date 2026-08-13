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

type Plate = {
  poster: string;
  mobilePoster: string;
  clip: string;
  mobileClip: string;
};

const variantClass: Record<AmbientVariant, string> = {
  compatibility: "blueprint-ambient--compatibility",
  compatibilityGuide: "blueprint-ambient--compatibility-guide",
  birthCard: "blueprint-ambient--birth-card",
  blueprint: "blueprint-ambient--blueprint",
  method: "blueprint-ambient--method",
  library: "blueprint-ambient--library",
};

const plates: Record<AmbientVariant, Plate> = {
  compatibility: {
    poster: "/brand/journey/scene-02-poster.png",
    mobilePoster: "/brand/journey/scene-02-mobile-poster.png",
    clip: "/brand/journey/scene-02.mp4",
    mobileClip: "/brand/journey/scene-02-mobile.mp4",
  },
  compatibilityGuide: {
    poster: "/brand/journey/scene-02-poster.png",
    mobilePoster: "/brand/journey/scene-02-mobile-poster.png",
    clip: "/brand/journey/scene-02.mp4",
    mobileClip: "/brand/journey/scene-02-mobile.mp4",
  },
  birthCard: {
    poster: "/brand/journey/scene-01-poster.png",
    mobilePoster: "/brand/journey/scene-01-mobile-poster.png",
    clip: "/brand/journey/scene-01.mp4",
    mobileClip: "/brand/journey/scene-01-mobile.mp4",
  },
  blueprint: {
    poster: "/brand/journey/scene-04-poster.png",
    mobilePoster: "/brand/journey/scene-04-mobile-poster.png",
    clip: "/brand/journey/scene-04.mp4",
    mobileClip: "/brand/journey/scene-04-mobile.mp4",
  },
  method: {
    poster: "/brand/journey/scene-03-poster.png",
    mobilePoster: "/brand/journey/scene-03-mobile-poster.png",
    clip: "/brand/journey/scene-03.mp4",
    mobileClip: "/brand/journey/scene-03-mobile.mp4",
  },
  library: {
    poster: "/brand/journey/scene-01-poster.png",
    mobilePoster: "/brand/journey/scene-01-mobile-poster.png",
    clip: "/brand/journey/scene-01.mp4",
    mobileClip: "/brand/journey/scene-01-mobile.mp4",
  },
};

const nodes = [
  [18, 62], [32, 28], [48, 48], [66, 22], [78, 58], [54, 78], [34, 82],
] as const;

export function BlueprintAmbient({
  variant,
  className = "",
  tone = "dark",
}: BlueprintAmbientProps) {
  const plate = plates[variant];
  const style = { "--ambient-node-count": nodes.length } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`blueprint-ambient ${variantClass[variant]} blueprint-ambient--${tone} pointer-events-none select-none motion-reduce:[animation:none] ${className}`}
      data-ambient-variant={variant}
      style={style}
    >
      <picture className="blueprint-ambient__still">
        <source media="(max-width: 700px)" srcSet={plate.mobilePoster} />
        <img alt="" decoding="async" src={plate.poster} />
      </picture>
      <video
        autoPlay
        className="blueprint-ambient__clip"
        loop
        muted
        playsInline
        poster={plate.poster}
        preload="metadata"
      >
        <source src={plate.clip} type="video/mp4" />
      </video>
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
