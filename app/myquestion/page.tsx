import type { Metadata } from "next";
import Link from "next/link";

import { MyQuestionOrderForm } from "@/components/my-question/MyQuestionOrderForm";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { Kicker, LinkButton } from "@/components/ui";
import {
  MY_QUESTION_PRICE_CENTS,
  QUESTION_BLUEPRINT_PRICE_CENTS,
} from "@/lib/my-question/core";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const checkoutOpen =
  process.env.MY_QUESTION_CHECKOUT_ENABLED === "true" &&
  process.env.MY_QUESTION_PROOF_APPROVED === "true" &&
  process.env.MY_QUESTION_SAMPLE_APPROVED === "true" &&
  process.env.MY_QUESTION_CAPTIONS_APPROVED === "true" &&
  process.env.MY_QUESTION_BLUEPRINT_SAMPLE_APPROVED === "true" &&
  process.env.MY_QUESTION_D1_READY === "true" &&
  process.env.MY_QUESTION_OPS_READY === "true" &&
  process.env.MY_QUESTION_NARRATION_READY === "true" &&
  Boolean(process.env.STRIPE_MY_QUESTION_PRICE_ID) &&
  Boolean(process.env.STRIPE_QUESTION_BLUEPRINT_PRICE_ID) &&
  Boolean(process.env.MY_QUESTION_SIGNING_SECRET) &&
  Boolean(process.env.RESEND_API_KEY) &&
  Boolean(process.env.INTAKE_EMAIL) &&
  Boolean(process.env.INTAKE_FROM_EMAIL);
const sampleApproved =
  process.env.MY_QUESTION_SAMPLE_APPROVED === "true" &&
  process.env.MY_QUESTION_CAPTIONS_APPROVED === "true";

const faqs = [
  {
    question: "What can I ask?",
    answer:
      "Ask one focused question about a situation, relationship, decision, or recurring pattern. A specific question gives the reading a clearer center.",
  },
  {
    question: "Can I include another person?",
    answer:
      "Yes. You may include up to three additional birthdates when those people are directly relevant to the one question you are asking.",
  },
  {
    question: "When does the delivery clock begin?",
    answer:
      "Payment comes first. Your exact weekday date and one of three daily slots are assigned after the required onboarding form is completed.",
  },
  {
    question: "Is this fortune-telling or professional advice?",
    answer:
      "No. It is a structured cardology reading for symbolic insight and self-reflection. It does not replace medical, legal, financial, crisis, or mental-health support.",
  },
  {
    question: "What happens if the reading has not entered production?",
    answer:
      "You may request a refund before production begins. Once completed onboarding enters production, the personalized work is non-refundable except for a covered correction or production error.",
  },
];

export const metadata: Metadata = {
  title: "My Question Reading | Card Blueprints",
  description:
    "Ask one focused question and receive a private 5-7 minute Card Blueprints video reading using your personal cards and current timing.",
  alternates: { canonical: "/myquestion" },
  openGraph: {
    siteName: SITE_NAME,
    title: "My Question Reading | Card Blueprints",
    description:
      "One focused question. Your personal cards and current timing. A private faceless video reading with AI-generated narration and human-reviewed interpretation.",
    url: "/myquestion",
    images: [
      {
        url: "/media/my-question/faceless-sample-poster.webp",
        width: 480,
        height: 854,
        alt: "Faceless Card Blueprints My Question sample reading",
      },
    ],
  },
};

export default function MyQuestionPage() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "My Question",
    description:
      "A private 5-7 minute faceless cardology reading with AI-generated narration and human-reviewed interpretation for one focused question.",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: "99.00",
      priceCurrency: "USD",
      url: `${SITE_URL}/myquestion`,
      ...(checkoutOpen
        ? { availability: "https://schema.org/InStock" }
        : {}),
      hasMerchantReturnPolicy: {
        "@id": `${SITE_URL}/refund-policy#merchant-return-policy`,
      },
    },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="bg-brand-paper text-brand-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="shell-paper border-b border-brand-line">
          <div className="mx-auto grid min-h-[calc(100dvh-5rem)] w-full max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.72fr)] lg:px-10 lg:py-16">
            <div className="max-w-[43rem]">
              <Kicker>My Question reading</Kicker>
              <h1 className="type-display mt-6 max-w-[12ch] text-brand-ink">
                One question. Your personal cards. A private video.
              </h1>
              <p className="type-body-lg mt-7 max-w-[34em] text-brand-ink-soft">
                Created for the situation you are facing: a faceless private
                reading of your cards and current timing, with AI-generated
                narration and human-reviewed interpretation.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <LinkButton href="#sample-reading" variant="accent" size="large">
                  Watch the sample
                </LinkButton>
                <LinkButton href="#order" variant="outline" size="large">
                  See the order
                </LinkButton>
              </div>
            </div>

            <figure id="sample-reading" className="mx-auto w-full max-w-[27rem] scroll-mt-24">
              <div className="relative overflow-hidden rounded-sm border border-brand-line-strong bg-brand-ink p-2 shadow-[0_24px_60px_rgba(44,31,20,0.16)]">
                <video
                  className="aspect-[9/16] w-full rounded-sm bg-brand-ink object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  poster="/media/my-question/faceless-sample-poster.webp"
                  aria-label="Faceless sample My Question reading with AI-generated narration"
                >
                  <source
                    src="/media/my-question/faceless-sample.mp4"
                    type="video/mp4"
                  />
                  <track
                    kind="captions"
                    src="/media/my-question/faceless-sample.en.vtt"
                    srcLang="en"
                    label="English"
                    default
                  />
                  Your browser does not support embedded video. You can use the
                  captioned transcript below instead.
                </video>
              </div>
              <figcaption className="mt-4 text-sm leading-relaxed text-brand-ink-soft">
                Faceless sample reading · AI-generated narration · Mechanics verified · Interpretation human-reviewed. Case study uses
                February 17, 1991 and a real difficult-year question. The sample
                follows the same reading structure offered below.
              </figcaption>
              {!sampleApproved ? (
                <p
                  role="note"
                  className="mt-3 rounded-sm border border-brand-line-strong bg-brand-paper-deep px-4 py-3 text-xs leading-relaxed text-brand-ink-soft"
                >
                  Local proof review: the faceless draft is integrated for
                  preview. Captions still need a human correction pass, and
                  separate launch gates remain closed until publication approval.
                </p>
              ) : null}
            </figure>
          </div>
        </section>

        <section aria-labelledby="proof-heading" className="shell-paper-deep border-b border-brand-line">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
            <h2 id="proof-heading" className="type-h2 max-w-[18ch]">
              A demonstration, not a promise.
            </h2>
            <p className="mt-4 max-w-[43rem] text-base leading-relaxed text-brand-ink-soft">
              The sample shows the actual pace, structure, specificity, and
              practical ending of the service before you are asked to pay.
            </p>
            <dl className="mt-10 grid gap-x-8 gap-y-6 border-t border-brand-line pt-7 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm font-semibold text-brand-ink">Question</dt>
                <dd className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
                  A real difficult-year question
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-ink">Mechanics</dt>
                <dd className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
                  Deterministic card calculations
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-ink">Interpretation</dt>
                <dd className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
                  Interpretation human-reviewed
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-ink">Length</dt>
                <dd className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
                  7 minutes
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm font-semibold leading-relaxed text-brand-ink">
              Faceless sample reading · AI-generated narration · Mechanics verified · Interpretation human-reviewed
            </p>
            <p className="mt-8 text-xs leading-relaxed text-brand-ink-faint">
              No customer name or quotation is published without confirmed
              wording and publication permission.
            </p>
          </div>
        </section>

        <section aria-labelledby="inside-heading" className="shell-paper border-b border-brand-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.7fr)] lg:px-10 lg:py-20">
            <div>
              <h2 id="inside-heading" className="type-h2 max-w-[19ch]">
                The cards are the structure. Your question is the center.
              </h2>
              <p className="mt-5 max-w-[41rem] text-base leading-relaxed text-brand-ink-soft">
                Every reading follows the same reviewed framework, then narrows
                it to the situation you submitted.
              </p>
              <div className="mt-9 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {[
                  ["Birth Card", "The core pattern connected to your birthday."],
                  ["Planetary Ruling Card", "The style through which that pattern tends to express."],
                  ["Combined pattern", "Where those two layers reinforce or challenge each other."],
                  ["Current 52-day card", "The shorter cycle active around your question."],
                  ["Current Long Range card", "The larger birthday-to-birthday theme in motion."],
                  ["Question-specific timing", "The cards and timing most relevant to one focus."],
                ].map(([title, copy]) => (
                  <div key={title} className="border-t border-brand-line pt-4">
                    <h3 className="font-serif text-xl font-semibold text-brand-ink">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="self-start rounded-sm border border-brand-line-strong bg-brand-paper-deep p-6 sm:p-8">
              <p className="font-serif text-2xl leading-snug text-brand-ink">
                The reading ends with one practical takeaway or next step, not
                a vague prediction.
              </p>
              <p className="mt-5 text-sm leading-relaxed text-brand-ink-soft">
                You receive a private downloadable Google Drive link that stays
                available for at least 12 months.
              </p>
            </aside>
          </div>
        </section>

        <section aria-labelledby="questions-heading" className="shell-paper-deep border-b border-brand-line">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <h2 id="questions-heading" className="type-h2 max-w-[20ch]">
              Bring one question that has weight.
            </h2>
            <p className="mt-5 max-w-[42rem] text-base leading-relaxed text-brand-ink-soft">
              One situation, relationship, decision, or pattern gives the
              reading enough room to become specific.
            </p>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-sm border border-brand-line bg-brand-paper p-6 sm:p-8">
                <h3 className="font-serif text-2xl font-semibold text-brand-ink">
                  Personal patterns and decisions
                </h3>
                <ul className="mt-6 space-y-4 text-sm leading-relaxed text-brand-ink-soft">
                  <li>Why has this year felt so hard, and what am I missing?</li>
                  <li>What pattern keeps pulling me back into the same decision?</li>
                  <li>What should I understand before I change direction?</li>
                  <li>Where am I using effort when a clearer choice is needed?</li>
                </ul>
              </div>
              <div className="rounded-sm border border-brand-line-strong bg-brand-ink p-6 text-brand-on-dark sm:p-8">
                <h3 className="font-serif text-2xl font-semibold">
                  Relationships and compatibility
                </h3>
                <ul className="mt-6 space-y-4 text-sm leading-relaxed text-brand-on-dark-soft">
                  <li>Why do we keep having the same argument?</li>
                  <li>Why does this person affect me so strongly?</li>
                  <li>What am I missing about this relationship pattern?</li>
                  <li>Is this relationship asking me to stay, change, or set a boundary?</li>
                </ul>
                <p className="mt-6 border-t border-brand-on-dark-line pt-5 text-xs leading-relaxed text-brand-on-dark-soft">
                  Up to three additional birthdates may be included only when
                  they are directly relevant. The reading does not claim to
                  know another person&apos;s private thoughts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="flow-heading" className="shell-paper border-b border-brand-line">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <h2 id="flow-heading" className="type-h2">From payment to private delivery</h2>
            <div className="mt-10 border-l border-brand-line-strong pl-6 sm:pl-9">
              {[
                [
                  "Pay securely",
                  "Choose the $99 reading and the optional $29 Question Blueprint. Stripe handles payment details.",
                ],
                [
                  "Complete the required intake",
                  "After payment, submit your name, one focused question, and any directly relevant birthdates.",
                ],
                [
                  "Receive your assigned date",
                  "One of three weekday slots is assigned only after valid onboarding is complete. The private video is delivered by email.",
                ],
              ].map(([title, copy], index) => (
                <div
                  key={title}
                  className={`relative pb-10 last:pb-0 ${index ? "pt-1" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[1.78rem] top-1.5 h-3 w-3 rounded-full border border-brand-oxblood bg-brand-paper sm:-left-[2.53rem]"
                  />
                  <h3 className="font-serif text-2xl font-semibold text-brand-ink">{title}</h3>
                  <p className="mt-3 max-w-[43rem] text-base leading-relaxed text-brand-ink-soft">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="order" aria-labelledby="order-heading" className="shell-paper-deep scroll-mt-24 border-b border-brand-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.65fr)] lg:px-10 lg:py-20">
            <div>
              <Kicker>Order My Question</Kicker>
              <h2 id="order-heading" className="type-h2 mt-5 max-w-[18ch]">
                One focused reading, human-reviewed.
              </h2>
              <p className="mt-5 max-w-[39rem] text-base leading-relaxed text-brand-ink-soft">
                The base reading is $99. Add the 4-6 page Question Blueprint for
                $29 if you want the same interpretation in a written companion.
              </p>

              <div className="mt-9 grid gap-6 sm:grid-cols-2">
                <div className="border-t border-brand-line-strong pt-4">
                  <p className="font-serif text-3xl font-semibold text-brand-ink">$99</p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
                    Private 5-7 minute video for one question
                  </p>
                </div>
                <div className="border-t border-brand-line-strong pt-4">
                  <p className="font-serif text-3xl font-semibold text-brand-ink">+$29</p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
                    Optional 4-6 page Question Blueprint PDF
                  </p>
                </div>
              </div>

              <div className="mt-10 rounded-sm border border-brand-line bg-brand-paper p-5 text-sm leading-relaxed text-brand-ink-soft">
                <p className="font-semibold text-brand-ink">Before checkout opens</p>
                <p className="mt-2">
                  The clean sample export, matching Blueprint sample, payment
                  account, database, webhook, and full test purchase must all
                  pass review.
                </p>
              </div>
            </div>

            <div className="self-start rounded-sm border border-brand-line-strong bg-brand-ivory p-6 shadow-[0_20px_50px_rgba(44,31,20,0.12)] sm:p-8 lg:sticky lg:top-24">
              <MyQuestionOrderForm
                checkoutOpen={checkoutOpen}
                basePriceCents={MY_QUESTION_PRICE_CENTS}
                blueprintPriceCents={QUESTION_BLUEPRINT_PRICE_CENTS}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="boundaries-heading" className="shell-paper border-b border-brand-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:px-10 lg:py-20">
            <div>
              <h2 id="boundaries-heading" className="type-h2 max-w-[16ch]">
                Clear boundaries protect the reading.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-brand-ink-soft">
                This service offers personalized symbolic insight and
                self-reflection. It does not provide professional advice,
                guaranteed outcomes, crisis support, diagnosis, treatment, or
                certainty about another person.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                "Medical or mental-health treatment advice",
                "Legal or financial advice",
                "Emergency or crisis requests",
                "Guaranteed predictions or mind-reading",
              ].map((item) => (
                <div key={item} className="rounded-sm border border-brand-line bg-brand-paper-deep p-5">
                  <p className="text-sm font-semibold leading-relaxed text-brand-ink">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="shell-paper-deep border-b border-brand-line">
          <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
            <h2 id="faq-heading" className="type-h2">Questions before you order</h2>
            <div className="mt-9 space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-sm border border-brand-line bg-brand-paper px-5 py-4 open:border-brand-line-strong"
                >
                  <summary className="cursor-pointer list-none pr-8 font-semibold text-brand-ink outline-none marker:hidden focus-visible:underline focus-visible:underline-offset-4">
                    {item.question}
                  </summary>
                  <p className="mt-4 max-w-[44rem] text-sm leading-relaxed text-brand-ink-soft">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="shell-paper">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-10">
            <div className="grid gap-6 text-sm leading-relaxed text-brand-ink-soft sm:grid-cols-3">
              <p>
                Refundable before production begins. Personalized work is
                non-refundable after production starts, except for covered
                corrections or a clear production error.
              </p>
              <p>
                Detailed intake is scheduled for deletion 90 days after
                delivery. The private Drive file remains available for at least
                12 months.
              </p>
              <p>
                If the assigned delivery window is missed, you may choose a
                refund or continued fulfillment.
              </p>
            </div>
            <nav aria-label="My Question policies" className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <Link href="/refund-policy" className="underline underline-offset-4">
                Refund policy
              </Link>
              <Link href="/privacy-policy" className="underline underline-offset-4">
                Privacy policy
              </Link>
              <Link href="/terms-of-service" className="underline underline-offset-4">
                Terms of service
              </Link>
            </nav>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
