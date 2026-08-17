import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function TableScroll({ label, children, className = "" }: Props) {
  return (
    <div
      className={`table-scroll overflow-x-auto ${className}`.trim()}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  );
}
