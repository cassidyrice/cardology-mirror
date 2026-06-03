"use client";

// Tasteful placeholder while the first deltas are still in flight.
const WIDTHS = ["92%", "84%", "97%", "70%", "88%", "60%"];

export function ComposingState() {
  return (
    <div className="animate-fade-up">
      <p className="eyebrow foil-text animate-shimmer mb-8">
        composing your mirror…
      </p>
      <div className="space-y-7">
        {[0, 1].map((block) => (
          <div key={block} className="space-y-3">
            <div className="h-5 w-2/5 animate-pulse rounded bg-haze/60" />
            {WIDTHS.map((w, i) => (
              <div
                key={i}
                className="h-3.5 animate-pulse rounded bg-haze/40"
                style={{ width: w, animationDelay: `${(block * 6 + i) * 90}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
