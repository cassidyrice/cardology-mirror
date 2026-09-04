import Link from "next/link";

import { SectionShell } from "@/components/ui";
import { BIRTHDAY_DIRECTORY_PATH } from "@/lib/site";

const START_LINKS = [
  {
    label: "New here? Ten-minute beginner path",
    href: "/cardology-for-beginners",
    external: false,
  },
  { label: "All 52 cards", href: "/birth-card", external: false },
  { label: "Look up a birthday", href: BIRTHDAY_DIRECTORY_PATH, external: true },
  {
    label: "What's your 52-day period?",
    href: "/52-day-period-meaning-tool",
    external: false,
  },
] as const;

export function StartHereSection() {
  return (
    <SectionShell tone="paper" pad="small">
      <h2 className="type-h2">Start here</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {START_LINKS.map((item) => (
          <li key={item.href} className="border-t border-brand-line pt-4">
            {item.external ? (
              <a href={item.href} className="editorial-link text-sm text-brand-ink">
                {item.label} →
              </a>
            ) : (
              <Link href={item.href} className="editorial-link text-sm text-brand-ink">
                {item.label} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
