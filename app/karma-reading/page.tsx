import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";
import { SITE_URL } from "@/lib/site";

/** Cass supplies the Cal.com / Payment Link URL later. Empty → "Booking opens soon". */
const READING_BOOKING_URL = "";

const UPDATED = PAGE_UPDATED_DATES["/karma-reading"];

const TITLE =
  "Karma Card Reading: 5-Minute Audio Reading with Cassidy Rice ($20)";
const DESCRIPTION =
  "Book a $20, 5-minute audio karma card reading with Cassidy Rice on Sat Sept 20. Ten slots. Your Lifetime Gift and Challenge beside your birth card.";

const OG_IMAGE = {
  url: "/og/karma-reading.png",
  width: 1200,
  height: 630,
  alt: "Karma Card Reading Day — Saturday Sept 20, $20",
};

const PAGE_URL = `${SITE_URL}/karma-reading`;

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/karma-reading" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/karma-reading",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const faqs = [
  {
    q: "What is Karma Card Reading Day?",
    a: "A one-day test on Saturday, September 20, 2026: ten paid slots between 10:00 and 12:00 America/Chicago. Each slot is a $20, 5-minute audio call where Cassidy Rice reads your two karma cards beside your birth card.",
  },
  {
    q: "What do I need to book?",
    a: "Your birthday (required when you book) and a phone number for the audio call. You can add an optional note about anything you want covered. No video; she does not record unless you say yes.",
  },
  {
    q: "What do I get after the call?",
    a: "Within 24 hours you get an email with a card image of your three cards — birth card, Lifetime Gift, and Lifetime Challenge — plus three lines of notes from the call.",
  },
  {
    q: "Can I cancel or reschedule?",
    a: "Cancel up to 24 hours before your slot and you get a refund. If you miss your slot, it can be moved once to the next Reading Day.",
  },
];

export default function KarmaReadingPage() {
  const bookingOpen = READING_BOOKING_URL.trim().length > 0;
  const eventUrl = bookingOpen ? READING_BOOKING_URL.trim() : PAGE_URL;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Karma Card Reading Day",
    description: DESCRIPTION,
    startDate: "2026-09-20T10:00:00-05:00",
    endDate: "2026-09-20T12:00:00-05:00",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "VirtualLocation",
      url: eventUrl,
    },
    organizer: {
      "@type": "Person",
      name: "Cassidy Rice",
      url: `${SITE_URL}/about`,
    },
    offers: {
      "@type": "Offer",
      price: 20,
      priceCurrency: "USD",
      url: eventUrl,
      availability: bookingOpen
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/PreOrder",
    },
    url: PAGE_URL,
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Karma cards", href: "/karma-cards" },
        { label: "Reading Day", href: "/karma-reading" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }}
      />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Live reading · one Saturday</p>
        <h1 className="display text-4xl leading-none text-[#14110d] sm:text-6xl">
          Karma Card Reading Day
        </h1>
        <p className="mt-4 text-xs text-[#5b5148]">
          By{" "}
          <Link href="/about" className="underline underline-offset-4">
            Cassidy Rice
          </Link>{" "}
          · Updated {updatedLabel(UPDATED)}
        </p>
      </header>

      <section className="max-w-3xl border border-[#14110d]/15 bg-[#eadfcd]/70 p-5 sm:p-6">
        <p className="oracle-eyebrow mb-2">When</p>
        <p className="font-serif text-2xl leading-snug text-[#14110d]">
          Saturday, September 20, 2026
        </p>
        <p className="mt-2 text-base leading-relaxed text-[#3d352d]">
          10:00–12:00 America/Chicago · ten slots · $20 · 5 minutes · audio only
        </p>
        <div className="mt-5">
          {bookingOpen ? (
            <a
              href={READING_BOOKING_URL.trim()}
              rel="noopener"
              target="_blank"
              className="accent-button large-button inline-flex text-center"
            >
              Book your slot — $20
            </a>
          ) : (
            <p
              className="inline-block border border-[#14110d]/20 bg-[#f4f0e7] px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#5b5148]"
              role="status"
            >
              Booking opens soon
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 max-w-3xl space-y-4 font-serif text-lg leading-relaxed text-[#3d352d]">
        <h2 className="font-serif text-3xl leading-none text-[#14110d]">
          What happens on the call
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-base sm:text-lg">
          <li>You give your birthday when you book.</li>
          <li>
            On the call, Cassidy reads your two karma cards — the Lifetime Gift
            and the Lifetime Challenge — and what they mean beside your birth
            card.
          </li>
          <li>Five minutes, phone-style audio only. No video.</li>
          <li>No recording unless you say yes.</li>
        </ul>
      </section>

      <section className="mt-12 max-w-3xl space-y-4 font-serif text-lg leading-relaxed text-[#3d352d]">
        <h2 className="font-serif text-3xl leading-none text-[#14110d]">
          What you get after
        </h2>
        <p>
          A card image with your three cards and three lines of notes, by email,
          within 24 hours.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-4 font-serif text-lg leading-relaxed text-[#3d352d]">
        <h2 className="font-serif text-3xl leading-none text-[#14110d]">
          Who reads
        </h2>
        <p>
          Cassidy Rice — founder of Card Blueprints — reads live. Same voice as
          the site: plain language about card patterns, not forecasts.
        </p>
        <p>
          How we write and what we will not claim is in the{" "}
          <Link
            href="/editorial-policy"
            className="underline underline-offset-4"
          >
            editorial policy
          </Link>
          .
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-4 font-serif text-lg leading-relaxed text-[#3d352d]">
        <h2 className="font-serif text-3xl leading-none text-[#14110d]">
          Refunds and rescheduling
        </h2>
        <p>
          Cancel up to 24 hours before and you get a refund. Miss your slot and
          it can be moved once to the next Reading Day.
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-serif text-3xl leading-none text-[#14110d]">
          Frequently asked questions
        </h2>
        <div className="mt-5 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t border-[#14110d]/15 pt-4">
              <h3 className="font-serif text-2xl text-[#14110d]">{faq.q}</h3>
              <p className="mt-2 text-base leading-relaxed text-[#5b5148]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 max-w-3xl text-sm leading-relaxed text-[#5b5148]">
        <p>
          Prefer the written deep dive? See the{" "}
          <Link
            href="/products/birth-card-deep-dive"
            className="underline underline-offset-4"
          >
            $9 Birth Card Deep Dive
          </Link>
          , or look up your pair on the{" "}
          <Link href="/karma-cards" className="underline underline-offset-4">
            karma cards table
          </Link>
          .
        </p>
      </section>
    </SeoShell>
  );
}
