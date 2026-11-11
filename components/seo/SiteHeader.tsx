"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { GlobalQuestionCheckoutModal } from "@/components/checkout/QuestionReadingDrawer";
import { READINGS_NAV } from "@/lib/readings-nav";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
  VIDEO_PATH,
} from "@/lib/site";
import { BrandLogo } from "./BrandLogo";
import { HeaderReadingsMenu } from "./HeaderReadingsMenu";

export const WEBSITE_NAV = [
  { href: "/birth-card-calculator", label: "Find your card" },
  { href: "/birth-card", label: "The card library" },
  { href: "/cardology-for-beginners", label: "Learn" },
  { href: "/explore", label: "Explore" },
] as const;

export const LIBRARY_DROPDOWN_SECTIONS = [
  {
    id: "cards",
    heading: "Cards & birthdays",
    microcopy: "Every fixed coordinate in the deck",
    links: [
      { href: "/birth-card", label: "The card library", note: "All 52 birth card profiles" },
      { href: BIRTHDAY_DIRECTORY_PATH, label: "Birthdays by date", note: "366 calendar dates, Jan 1 – Dec 31" },
      { href: COMPATIBILITY_DIRECTORY_PATH, label: "All pairings", note: "1,378 two-card combinations" },
    ],
  },
  {
    id: "tools",
    heading: "Calculators & timing",
    microcopy: "In-browser math, zero signup",
    links: [
      { href: "/your-year", label: "Your year timing spread", note: "Seven 52-day periods for your age" },
      { href: "/birth-card-compatibility-calculator", label: "Compatibility calculator", note: "Compare any two birthdays" },
      { href: "/52-day-period-meaning-tool", label: "52-day period tool", note: "Mercury through Neptune filters" },
      { href: "/card-of-the-day", label: "Today's card", note: "Today's shared calendar card" },
    ],
  },
  {
    id: "guides",
    heading: "System & guides",
    microcopy: "Lineage, method, and essays",
    links: [
      { href: "/what-is-cardology", label: "What is Cardology", note: "Plain-English system guide" },
      { href: "/cardology-for-beginners", label: "Learn", note: "Ten minutes from card to spread" },
      { href: "/blog", label: "Blog", note: "Essays & public-figure profiles" },
      { href: VIDEO_PATH, label: "Videos", note: "Short shadow-reading films" },
      { href: "/explore", label: "Explore", note: "Full site index on one page" },
    ],
  },
] as const;

export function SiteHeader() {
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (header.current && !header.current.contains(event.target as Node)) {
        header.current.querySelectorAll("details[open]").forEach((item) => item.removeAttribute("open"));
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  function closeOnEscape(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape") return;
    const disclosure = (event.target as HTMLElement).closest("details[open]");
    if (disclosure) {
      disclosure.removeAttribute("open");
      disclosure.querySelector("summary")?.focus();
      event.preventDefault();
    }
  }

  function closeAfterLink(event: MouseEvent<HTMLElement>) {
    const link = (event.target as HTMLElement).closest("a");
    if (!link) return;
    link.closest("details")?.removeAttribute("open");
    if (typeof window !== "undefined") {
      const url = new URL(link.href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) {
        const target = document.getElementById(url.hash.slice(1));
        if (target) {
          target.tabIndex = -1;
          target.focus({ preventScroll: true });
        }
      }
    }
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header
        ref={header}
        className="blueprint-header"
        onKeyDown={closeOnEscape}
        onClick={closeAfterLink}
      >
        <div className="blueprint-header-inner">
          <Link href="/" className="blueprint-brand" aria-label={`${SITE_NAME} home`}>
            <BrandLogo />
          </Link>

          <nav aria-label="Primary" className="blueprint-desktop-nav">
            <Link href="/birth-card-calculator">Find your card</Link>

            <details
              data-library-menu
              className="blueprint-library-menu"
              suppressHydrationWarning
              onToggle={(e) => {
                if ((e.currentTarget as HTMLDetailsElement).open) {
                  trackClientFunnelEvent("library_menu_opened", { placement: "header-desktop" });
                }
              }}
            >
              <summary>
                <span>The Library</span>
                <small className="blueprint-library-signal">52 cards · 366 dates · 1,378 pairs</small>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </summary>
              <div className="blueprint-library-panel" role="region" aria-label="Reference library">
                <p className="blueprint-library-banner">
                  Reference archive — free tools, all 52 card meanings, every calendar birthday, and every compatibility pairing.
                </p>
                <div className="blueprint-library-grid">
                  {LIBRARY_DROPDOWN_SECTIONS.map((section) => (
                    <div key={section.id} className="blueprint-library-col">
                      <p className="blueprint-library-heading">{section.heading}</p>
                      <p className="blueprint-library-sub">{section.microcopy}</p>
                      <ul>
                        {section.links.map((item) => (
                          <li key={item.href}>
                            {item.href.endsWith("/") ? (
                              <a href={item.href}>
                                <span className="blueprint-library-link-title">{item.label}</span>
                                <small className="blueprint-library-link-note">{item.note}</small>
                              </a>
                            ) : (
                              <Link href={item.href}>
                                <span className="blueprint-library-link-title">{item.label}</span>
                                <small className="blueprint-library-link-note">{item.note}</small>
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            <HeaderReadingsMenu />
          </nav>

          {/* Native disclosure may open before hydration; preserve that user choice. */}
          <details className="blueprint-mobile-menu" suppressHydrationWarning>
            <summary>
              Menu <span aria-hidden="true">+</span>
            </summary>
            <nav aria-label="Mobile primary">
              <Link href="/birth-card-calculator">Find your card</Link>

              <details
                className="blueprint-mobile-library"
                suppressHydrationWarning
                onToggle={(e) => {
                  if ((e.currentTarget as HTMLDetailsElement).open) {
                    trackClientFunnelEvent("library_menu_opened", { placement: "header-mobile" });
                  }
                }}
              >
                <summary>
                  <span>
                    The Library
                    <small className="blueprint-mobile-library-signal">
                      52 cards · 366 dates · 1,378 pairs
                    </small>
                  </span>
                  <span aria-hidden="true">▾</span>
                </summary>
                <div className="blueprint-mobile-library-links">
                  <Link href="/birth-card">The card library</Link>
                  <a href={BIRTHDAY_DIRECTORY_PATH}>Birthdays by date</a>
                  <a href={COMPATIBILITY_DIRECTORY_PATH}>All pairings</a>
                  <Link href="/your-year">Your year timing spread</Link>
                  <Link href="/birth-card-compatibility-calculator">Compatibility calculator</Link>
                  <Link href="/cardology-for-beginners">Learn</Link>
                  <Link href="/explore">Explore</Link>
                </div>
              </details>

              <div className="blueprint-menu-readings">
                <p>Personal readings · Email or text</p>
                {READINGS_NAV.map((reading) => (
                  <a
                    href={reading.href}
                    key={reading.id}
                    data-reading-link
                    data-open-question-track={reading.id}
                    data-placement="header-mobile-menu"
                  >
                    <span>{reading.title}</span>
                    <strong>{reading.price}</strong>
                  </a>
                ))}
              </div>
              <Link href="/faq">Questions &amp; answers</Link>
              <Link href="/contact">Contact Cass</Link>
              <Link href="/my-purchases" rel="nofollow">
                My purchases
              </Link>
            </nav>
          </details>
        </div>
      </header>
      <GlobalQuestionCheckoutModal />
    </>
  );
}
