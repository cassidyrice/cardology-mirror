"use client";

import { useEffect, useRef, useState } from "react";

type NavItem = { href: string; label: string };

// The article shell sets overflow:hidden, which disables position:sticky.
// After this nav scrolls out of view, pin a fixed copy so the jumps stay reachable.
export function SpreadPageNav({ items }: { items: readonly NavItem[] }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const nav = navRef.current;
    if (!sentinel || !nav) return;

    const observer = new IntersectionObserver(([entry]) => {
      const next = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      if (next) setHeight(nav.getBoundingClientRect().height);
      setPinned(next);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      {pinned ? <div aria-hidden="true" style={{ height }} /> : null}
      <nav
        ref={navRef}
        aria-label="On this page"
        className={
          pinned
            ? "fixed inset-x-0 top-0 z-40 border-b border-brand-line bg-brand-paper/95 py-1 backdrop-blur-sm"
            : "mb-8 border-y border-brand-line bg-brand-paper/95 py-1"
        }
      >
        <ul
          className={`flex flex-wrap gap-x-1 gap-y-1 ${
            pinned ? "mx-auto max-w-5xl px-5 sm:px-8 lg:px-10" : ""
          }`}
        >
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="inline-flex min-h-11 items-center px-2.5 text-sm text-brand-ink hover:text-brand-oxblood"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
