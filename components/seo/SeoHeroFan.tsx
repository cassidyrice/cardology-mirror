import { shareFacePathFromCode } from "@/lib/share-cards";

/**
 * Real-card hero art for SEO landing pages: a small fan of photo-real card
 * faces (same assets as the share cards). Server-safe, fixed dimensions so
 * it never shifts layout, eager-loaded because it sits above the fold.
 */
export function SeoHeroFan({
  codes = ["Q♥", "8♦", "A♠"],
  className = "",
}: {
  codes?: [string, string, string] | string[];
  className?: string;
}) {
  return (
    <div
      className={`flex h-32 items-end justify-center ${className}`}
      aria-hidden="true"
    >
      {codes.map((code, i) => {
        const src = shareFacePathFromCode(code);
        if (!src) return null;
        const rotate = i === 0 ? "-rotate-12" : i === 2 ? "rotate-12" : "rotate-0";
        const z = i === 1 ? "z-10" : "z-0";
        const overlap = i === 0 ? "translate-x-4" : i === 2 ? "-translate-x-4" : "";
        return (
          <img
            key={code}
            src={src}
            alt=""
            width={84}
            height={126}
            loading="eager"
            className={`relative ${z} ${rotate} ${overlap} rounded-[6px] border border-brand-line bg-brand-paper shadow-[0_6px_18px_rgba(20,17,13,0.18)]`}
          />
        );
      })}
    </div>
  );
}
