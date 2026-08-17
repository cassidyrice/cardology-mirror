import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/seo/BrandLogo";
import { SITE_NAME } from "@/lib/site";

export function CheckoutShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: { label: string; href: string }[];
}) {
  return (
    <div className="min-h-dvh bg-brand-paper text-brand-ink">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label={`${SITE_NAME} home`}>
          <BrandLogo compact />
        </Link>
        <Link
          href="/products/personal-card-blueprint"
          className="text-sm text-brand-ink-soft underline underline-offset-4"
        >
          Back
        </Link>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-5 pb-16 sm:px-8"
      >
        {crumb && crumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-6 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-brand-ink-faint"
          >
            {crumb.map((c, i) => (
              <span key={c.href}>
                {i > 0 && (
                  <span aria-hidden="true" className="px-2 text-brand-line-strong">
                    /
                  </span>
                )}
                <Link
                  href={c.href}
                  aria-current={i === crumb.length - 1 ? "page" : undefined}
                  className="transition hover:text-brand-ink"
                >
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
        {children}
        <p className="mt-10 text-xs leading-relaxed text-brand-ink-soft">
          <Link href="/privacy-policy" className="underline underline-offset-2">
            Privacy
          </Link>
          {" · "}
          <Link href="/refund-policy" className="underline underline-offset-2">
            Refunds
          </Link>
          {" · "}
          <Link href="/terms-of-service" className="underline underline-offset-2">
            Terms
          </Link>
        </p>
      </main>
    </div>
  );
}
