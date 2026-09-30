import type { Metadata } from "next";
import Link from "next/link";

import { PeriodAppView } from "@/components/card-app/PeriodApp";
import { appReadingLibrary } from "@/lib/period-library";
import { ReportCheckoutButton } from "@/components/checkout/ReportCheckoutButton";
import { SeoShell } from "@/components/seo/SeoShell";
import { appDateParam, buildCardApp } from "@/lib/card-app";
import { buildConnection } from "@/lib/card-app-connection";
import { CARD_APP_PRODUCT_PATH, CARD_APP_SLUG } from "@/lib/card-app-slug";
import { DEEP_DIVE_PRICE_LABEL, DEEP_DIVE_PRODUCT_NAME, DEEP_DIVE_PRODUCT_PATH } from "@/lib/deep-dive";
import { buildProductJsonLd } from "@/lib/product-schema";
import { CARD_APP_ON_SALE, CARD_APP_PRODUCT } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";

// The sample shows today's real cards, so this page renders per request.
export const runtime = "edge";
export const dynamic = "force-dynamic";

const product = CARD_APP_PRODUCT;
/** The sample app: a fixed, made-up birthday (no real person), shown for today. */
const SAMPLE_BIRTHDATE = "1988-07-14";
const SAMPLE_OTHER = { birthdate: "1946-06-14", name: "Alex" };

const TITLE = `${product.name} · ${product.priceLabel} once · your cards every day`;
const DESCRIPTION =
  "Your own Cardology app, built from your birthday: today's card, your week, your year, karma cards, good days and compatibility. Pay once, keep it.";
const OG_IMAGE = "/og/products/card-blueprint-app.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CARD_APP_PRODUCT_PATH },
  // Kept out of search until it is on sale.
  robots: CARD_APP_ON_SALE ? undefined : { index: false, follow: true },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: CARD_APP_PRODUCT_PATH,
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${product.name}, ${product.priceLabel} once. Your cards every day, built from your birthday.` }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const faqs = [
  {
    q: "Is it a subscription?",
    a: `No. You pay ${product.priceLabel} once and the app is yours for life. There's nothing to renew and nothing to cancel.`,
  },
  {
    q: "Do I need an account or a download?",
    a: "No. After you pay, you get a private link by email. Open it on your phone and tap Add to Home Screen, and it sits there like any other app. No login, no app store.",
  },
  {
    q: "Does it change, or is it the same every time?",
    a: "Your cards change on schedule: a new daily card every day, a new weekly card about every seven days, a new 52-day period seven times a year, and a new year of cards every birthday. The app works it all out fresh each time you open it.",
  },
  {
    q: "What happens to the birthdays I add for other people?",
    a: "Your list is saved only on your phone. When you compare, the birthday goes to our server to work out the cards, and we don't keep it.",
  },
  {
    q: "Is any of it written by AI?",
    a: "Yes. The reading library was written with AI assistance and checked through an independent AI editorial review. No model generates a new reading when you open the app. Your cards come from the same fixed calculations as the free calculator, and the app selects the matching text. These are symbolic interpretations for reflection, not scientific predictions.",
  },
  {
    q: "Will it tell me what's going to happen?",
    a: "No. It's a mirror, not a forecast. Good days are days your cards line up, not promises. Use it to notice your patterns, not to hand over your choices.",
  },
  {
    q: "What if my birthday is December 31?",
    a: "December 31 is the Joker, the one birthday outside the 52-card map, so the app can't be built for it. Checkout tells you before you pay.",
  },
  {
    q: `How is this different from the ${DEEP_DIVE_PRICE_LABEL} ${DEEP_DIVE_PRODUCT_NAME}?`,
    a: `The reading is one written answer to one question you're stuck on. The app is every card, every day, for life, but it doesn't answer a question for you. Plenty of people get both.`,
  },
];

export default async function CardBlueprintAppPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  // "Today" is the visitor's own date: the sample syncs ?date= like a buyer's app.
  const { date } = await searchParams;
  const sample = buildCardApp(SAMPLE_BIRTHDATE, appDateParam(date));
  const connection = buildConnection(SAMPLE_BIRTHDATE, SAMPLE_OTHER.birthdate, SAMPLE_OTHER.name);

  const jsonLd = [
    ...(CARD_APP_ON_SALE ? [buildProductJsonLd(product)] : []),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: product.name, href: CARD_APP_PRODUCT_PATH },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="type-eyebrow mb-3 !text-brand-bronze">Cardology · your own app</p>
      <h1 className="display mb-3 text-3xl text-brand-ink sm:text-4xl">
        {product.name}
        <span className="mt-2 block font-sans text-base font-medium leading-snug tracking-normal text-brand-ink-soft">
          {product.priceLabel} once · yours for life · a mirror, not a forecast
        </span>
      </h1>
      <p className="prose-reading mb-6 max-w-[38em] text-brand-ink-soft">
        Your birth card is the start. This is everything after it: your card for today, this
        week, the 52-day period you&rsquo;re in, your whole year, your karma cards, the days your
        cards line up, and how you connect with the people in your life. Built from your
        birthday, on your phone, updated every day.
      </p>

      <BuyBlock placement="product-page" />

      <section aria-labelledby="sample-heading" className="mb-10">
        <h2 id="sample-heading" className="type-eyebrow mb-2 !text-brand-bronze">Try it</h2>
        <p className="mb-4 max-w-[38em] text-sm text-brand-ink-soft">
          This is the real app for a made-up person born {sample.birthdateDisplay}, showing
          today. Tap the tabs at the bottom. Yours is built from your birthday.
        </p>
        <PeriodAppView data={sample} readings={appReadingLibrary(sample)} sample={{ connection }} framed />
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What&rsquo;s inside</h2>
        <ul className="prose-reading list-disc space-y-1.5 pl-5 text-brand-ink-soft">
          {product.includes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How it works</h2>
        <p className="prose-reading text-brand-ink-soft">
          You type your birth date on the next page and pay {product.priceLabel} on Stripe. Your
          app is ready the moment payment goes through: on the page you land on and in your
          email. Open the link on your phone and add it to your home screen. That&rsquo;s it. No
          account, no subscription, no waiting.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Where the cards come from</h2>
        <p className="prose-reading text-brand-ink-soft">
          The same math as the{" "}
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            free birth card calculator
          </Link>
          : one fixed deck order, 90 yearly spreads, and your birthday. Same birthday, same
          cards, every time. Want to see a card first? Here&rsquo;s the{" "}
          <Link href={`/birth-card/${sample.identity.birth.card.slug}`} className="text-brand-oxblood underline underline-offset-4">
            {sample.identity.birth.card.name}
          </Link>
          , the birth card in the sample above. Compatibility compares both birth cards and both
          ruling cards, in both directions, a deeper version of the free{" "}
          <Link href="/birth-card-compatibility-calculator" className="text-brand-oxblood underline underline-offset-4">
            compatibility calculator
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What it is not</h2>
        <p className="prose-reading text-brand-ink-soft">
          A mirror, not a forecast. It won&rsquo;t tell you what to do or what will happen. It
          shows the pattern you&rsquo;re running, where you are in your year, and when your cards
          line up. What you do with that is yours.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">Questions people ask first</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-brand-line pt-8">
        <BuyBlock placement="product-page-bottom" />
        <p className="mt-2 text-sm text-brand-ink-soft">
          One question on your mind instead?{" "}
          <Link href={DEEP_DIVE_PRODUCT_PATH} className="text-brand-oxblood underline underline-offset-4">
            {DEEP_DIVE_PRODUCT_NAME}, {DEEP_DIVE_PRICE_LABEL} →
          </Link>
        </p>
      </section>
    </SeoShell>
  );
}

/** The buy button, or an honest "not yet" while the product is off sale. */
function BuyBlock({ placement }: { placement: string }) {
  if (!CARD_APP_ON_SALE) {
    return (
      <div className="mb-10 max-w-md rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
        <p className="font-serif text-lg text-brand-ink">Opening soon</p>
        <p className="mt-1 text-sm text-brand-ink-soft">
          The app isn&rsquo;t on sale yet. Try the sample below in the meantime.
        </p>
      </div>
    );
  }
  return (
    <div className="mb-10 flex max-w-md flex-col items-start gap-2">
      <ReportCheckoutButton slug={CARD_APP_SLUG} placement={placement} submitLabel={product.cta} />
      <p className="text-sm text-brand-ink-soft">One payment. Yours for life. Birth date on the next page.</p>
    </div>
  );
}
