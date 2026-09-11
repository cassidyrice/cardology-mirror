"use client";

import Link from "next/link";

import { SITE_NAME } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";

const NAV_LINKS = [{ label: "Explore", href: "/explore" }] as const;

export function SiteHeader() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="relative z-10 border-b border-brand-line bg-brand-paper">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-8 lg:px-10">
          <Link href="/" className="text-brand-ink max-[360px]:[&_.brand-logo-wordmark]:text-[16px] max-[360px]:[&_.brand-logo-mark]:w-6" aria-label={`${SITE_NAME} home`}>
            <BrandLogo />
          </Link>
          <nav
            aria-label="Primary"
            className="ml-auto hidden items-center gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-brand-ink-soft lg:flex lg:gap-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap transition hover:text-brand-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <details className="relative ml-auto lg:hidden">
            <summary className="paper-button small-button cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Mobile primary"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 max-w-[calc(100vw-2rem)] border border-brand-line bg-brand-ivory p-4 shadow-[0_8px_30px_rgba(20,17,13,0.12)]"
            >
              <ul className="divide-y divide-brand-line text-sm text-brand-ink">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block min-h-11 py-3"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
          <a
            href="https://www.tiktok.com/@52xseven"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow 52xseven on TikTok (opens in a new tab)"
            title="Follow @52xseven on TikTok"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-ink-soft transition hover:bg-brand-ink/5 hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M16.6 2c.3 2.5 1.7 4 4.1 4.2v3.3a8.3 8.3 0 0 1-4.1-1.2v6.8a6.1 6.1 0 1 1-5.3-6v3.4a2.8 2.8 0 1 0 2 2.6V2h3.3Z" /></svg>
          </a>
        </div>
      </header>
    </>
  );
}
