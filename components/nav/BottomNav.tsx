"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ComponentType } from "react";

interface IconProps {
  active: boolean;
}

function TodayIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      {active ? (
        <g opacity="0.9">
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
        </g>
      ) : null}
    </svg>
  );
}

function SelfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function TimingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.2 1.8" />
    </svg>
  );
}

function BondsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path d="M3 19a5 5 0 0 1 8-2M21 19a5 5 0 0 0-8-2" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M5 4v16M9 9h5M9 13h5" />
    </svg>
  );
}

interface Tab {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
}

const TABS: Tab[] = [
  { href: "/today", label: "Today", Icon: TodayIcon },
  { href: "/self", label: "Self", Icon: SelfIcon },
  { href: "/timing", label: "Timing", Icon: TimingIcon },
  { href: "/bonds", label: "Bonds", Icon: BondsIcon },
  { href: "/journal", label: "Journal", Icon: JournalIcon },
];

const HIDDEN = [
  "/",
  "/onboarding",
  "/today",
  "/self",
  "/timing",
  "/bonds",
  "/reading",
  "/story",
  "/journal",
];

export default function BottomNav() {
  const pathname = usePathname() ?? "/";

  if (HIDDEN.includes(pathname)) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-bone/10 bg-ink/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around px-2 pt-2 pb-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-1 rounded-xl py-1.5 outline-none"
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute -top-2 h-[2px] w-7 rounded-full bg-gold shadow-[0_0_10px_rgba(217,178,106,0.7)]"
                  />
                ) : null}
                <span
                  className={
                    active
                      ? "text-gold transition-colors"
                      : "text-faint transition-colors"
                  }
                >
                  <Icon active={active} />
                </span>
                <span
                  className={`text-[0.58rem] uppercase tracking-wider2 transition-colors ${
                    active ? "text-gold" : "text-faint"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
