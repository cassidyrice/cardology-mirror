// Shared presentational primitives. Treat as read-only from feature agents.
import { ReactNode } from "react";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`display text-2xl text-bone ${className}`}>{children}</h2>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`hairline my-6 border-t ${className}`} />;
}

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative min-h-dvh px-5 pb-28 pt-10 ${className}`}>{children}</div>
  );
}

// Three-position interpretation block (under / sweet-spot / over) — core engine motif.
export function PositionStack({
  under,
  sweet,
  over,
}: {
  under: string;
  sweet: string;
  over: string;
}) {
  const rows = [
    { label: "Under", text: under, color: "text-dusk", dot: "bg-dusk" },
    { label: "Balanced", text: sweet, color: "text-sage", dot: "bg-sage" },
    { label: "Over", text: over, color: "text-ember", dot: "bg-ember" },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
          <p className="text-[0.95rem] leading-relaxed text-mist">
            <span className={`mr-2 text-xs uppercase tracking-wider2 ${r.color}`}>
              {r.label}
            </span>
            {r.text}
          </p>
        </div>
      ))}
    </div>
  );
}
