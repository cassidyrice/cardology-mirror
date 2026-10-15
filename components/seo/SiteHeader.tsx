"use client";

import Link from "next/link";

import { SITE_NAME } from "@/lib/site";
import { PRIMARY_NAV } from "@/lib/site-nav";
import { BrandLogo } from "./BrandLogo";

export function SiteHeader() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="relative z-10 border-b border-brand-line bg-brand-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-3 py-4 sm:gap-4 sm:px-8 lg:px-10">
          <Link href="/" className="min-w-0 shrink text-brand-ink max-[360px]:[&_.brand-logo-wordmark]:text-[16px] max-[360px]:[&_.brand-logo-mark]:w-6" aria-label={`${SITE_NAME} home`}>
            <BrandLogo />
          </Link>
          <nav
            aria-label="Primary"
            className="ml-auto hidden items-center gap-4 text-[0.8rem] font-semibold text-brand-ink-soft lg:flex lg:gap-5"
          >
            {PRIMARY_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-money-path={link.id}
                  className="money-path whitespace-nowrap font-semibold text-brand-ink transition hover:text-brand-ink"
                >
                  {link.label}
                </Link>
            ))}
            <Link href="/my-purchases" className="whitespace-nowrap font-semibold text-brand-oxblood hover:underline">
              My purchases
            </Link>
          </nav>
          <details className="relative ml-auto shrink-0 lg:ml-0 lg:hidden">
            <summary className="paper-button small-button cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Mobile primary"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 max-w-[calc(100vw-2rem)] border border-brand-line bg-brand-ivory p-4 shadow-[0_8px_30px_rgba(20,17,13,0.12)]"
            >
              <ul className="divide-y divide-brand-line text-sm text-brand-ink">
                {PRIMARY_NAV.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        data-money-path={link.id}
                        className="money-path block min-h-11 py-3 font-semibold text-brand-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                ))}
                <li>
                  <Link href="/my-purchases" className="block min-h-11 py-3 font-semibold text-brand-oxblood">
                    My purchases
                  </Link>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
