"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { SITE_NAME } from "@/lib/site";
import { READINGS_NAV } from "@/lib/readings-nav";
import { BrandLogo } from "./BrandLogo";
import { HeaderReadingsMenu } from "./HeaderReadingsMenu";

export const WEBSITE_NAV = [
  { href: "/birth-card-calculator", label: "Find your card" },
  { href: "/birth-card", label: "The card library" },
  { href: "/cardology-for-beginners", label: "Learn" },
  { href: "/explore", label: "Explore" },
] as const;

export function SiteHeader() {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (header.current && !header.current.contains(event.target as Node))
        header.current.querySelectorAll("details[open]").forEach(item => item.removeAttribute("open"));
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
    // Same-page offer anchors become the keyboard continuation point.
    const url = new URL(link.href, window.location.href);
    if (url.pathname === window.location.pathname && url.hash) {
      const target = document.getElementById(url.hash.slice(1));
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }
  }
  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header ref={header} className="blueprint-header" onKeyDown={closeOnEscape} onClick={closeAfterLink}>
      <div className="blueprint-header-inner">
        <Link href="/" className="blueprint-brand" aria-label={`${SITE_NAME} home`}><BrandLogo /></Link>
        <nav aria-label="Primary" className="blueprint-desktop-nav">
          {WEBSITE_NAV.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          <HeaderReadingsMenu />
        </nav>
        {/* Native disclosure may open before hydration; preserve that user choice. */}
        <details className="blueprint-mobile-menu" suppressHydrationWarning>
          <summary>Menu <span aria-hidden="true">+</span></summary>
          <nav aria-label="Mobile primary">
            {WEBSITE_NAV.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            <div className="blueprint-menu-readings"><p>Personal readings</p>
              {READINGS_NAV.map(reading => <a href={reading.href} key={reading.id} data-reading-link><span>{reading.title}</span><strong>{reading.price}</strong></a>)}
            </div>
            <Link href="/faq">Questions & answers</Link>
            <Link href="/contact">Contact Cass</Link>
            <Link href="/my-purchases">My purchases</Link>
          </nav>
        </details>
      </div>
    </header>
  </>;
}
