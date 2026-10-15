import Link from "next/link";

import { SITE_NAME } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";

const FREE_TOOLS = [
  { label: "Find your card", href: "/birth-card-calculator" },
  { label: "All 52 cards", href: "/birth-card" },
  { label: "Compatibility", href: "/birth-card-compatibility-calculator" },
  { label: "Learn and explore", href: "/explore" },
] as const;

const GET = [
  { label: "My purchases", href: "/my-purchases" },
  { label: "Free course", href: "/free-course" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

const ABOUT = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/methodology" },
  { label: "Editorial policy", href: "/editorial-policy" },
] as const;

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="hover:text-brand-ink">
      {children}
    </Link>
  );
}

export function SiteFooter({ bare = false }: { bare?: boolean }) {
  return (
    <footer
      className={
        bare
          ? "mt-16 border-t border-brand-line pt-10 text-sm leading-relaxed text-brand-ink-soft"
          : "border-t border-brand-line bg-brand-paper text-sm leading-relaxed text-brand-ink-soft"
      }
    >
      <div className={bare ? "" : "mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:px-10"}>
        <p className="mb-10">
          <Link href="/" aria-label={`${SITE_NAME} home`} className="inline-block">
            <BrandLogo compact />
          </Link>
        </p>
        <nav aria-label="More" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Tools and library</p>
            <ul className="space-y-2">
              {FREE_TOOLS.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Reading and support</p>
            <ul className="space-y-2">
              {GET.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">About</p>
            <ul className="space-y-2">
              {ABOUT.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-brand-line pt-5 text-xs">
          <Link href="/privacy-policy" className="hover:text-brand-ink">
            Privacy
          </Link>
          <Link href="/privacy-policy#privacy-choices" className="hover:text-brand-ink">
            Privacy choices
          </Link>
          <Link href="/terms-of-service" className="hover:text-brand-ink">
            Terms
          </Link>
          <Link href="/refund-policy" className="hover:text-brand-ink">
            Refunds
          </Link>
        </div>
        <p className="mt-4 max-w-[38em] text-xs leading-relaxed">
          Playing cards, not tarot. It&rsquo;s a mirror, not a forecast.
        </p>
      </div>
    </footer>
  );
}
