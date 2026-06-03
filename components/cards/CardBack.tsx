"use client";

// Minimalist cosmic card back — concentric foil ring on a deep field.
export function CardBack() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit]">
      <div
        aria-hidden
        className="absolute inset-1.5 rounded-lg opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(217,178,106,0.10), transparent 70%)",
          boxShadow: "inset 0 0 0 1px rgba(217,178,106,0.18)",
        }}
      />
      <div
        aria-hidden
        className="h-1/3 w-1/3 rounded-full bg-foil opacity-30 mix-blend-screen animate-shimmer"
        style={{ backgroundSize: "200% 100%" }}
      />
      <span className="absolute foil-text font-serif text-lg">✦</span>
    </div>
  );
}
