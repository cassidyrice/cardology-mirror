"use client";

// A subtle premium foil sheen: a diagonal foil gradient swept by animate-shimmer.
// Rendered as an overlay; `variant` controls how strongly it reads.
export function FoilSheen({ variant = "border" }: { variant?: "border" | "full" }) {
  if (variant === "full") {
    // Soft sweep across the whole face for court/ace cards.
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] animate-shimmer opacity-[0.10] mix-blend-screen bg-foil"
        style={{ backgroundSize: "200% 100%" }}
      />
    );
  }
  // Sheen masked to the inner border ring only — reads as a foil edge.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] animate-shimmer opacity-30 mix-blend-screen bg-foil"
      style={{
        backgroundSize: "200% 100%",
        padding: "1px",
        WebkitMask:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}
