"use client";

// Shimmering load placeholder for the Today screen.
function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-gradient-to-r from-haze via-cosmos to-haze bg-[length:200%_100%] ${className}`}
    />
  );
}

export function TodaySkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <Bar className="h-3 w-28" />
      <Bar className="h-12 w-3/4" />
      <Bar className="h-3 w-40" />
      <div className="flex gap-4 pt-2">
        <Bar className="h-32 w-24" />
        <Bar className="h-32 w-24" />
      </div>
      <Bar className="h-px w-full" />
      <div className="space-y-4">
        <Bar className="h-3 w-32" />
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-5/6" />
        <Bar className="h-4 w-4/6" />
      </div>
    </div>
  );
}
