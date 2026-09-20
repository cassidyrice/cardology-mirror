import { CONSULT_SLUG, consultationHref } from "@/lib/blueprint-report";
import type { Metadata } from "next";
import Link from "next/link";
import OneQuestionReadingLive from "@/components/checkout/OneQuestionReadingLive";

import { DeepDiveDeliveredBeacon } from "@/components/checkout/DeepDiveDeliveredBeacon";
import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import {
  DEEP_DIVE_PRODUCT_NAME,
  DEEP_DIVE_PRODUCT_PATH,
  FIFTY_TWO_BY_SEVEN_ACCESS_DAYS,
  FIFTY_TWO_BY_SEVEN_REPORT_SLUG,
  ONE_QUESTION_TURNAROUND,
  deepDiveSuccessCopy,
  isOneQuestionSession,
  questionFromCheckoutSession,
} from "@/lib/deep-dive";
import { YearBlueprintApp } from "@/components/year/YearBlueprintApp";
import { buildYearBlueprint, type YearBlueprint } from "@/lib/year-blueprint";
import {
  productBySlug,
  isDigitalDownload,
  isInstantReport,
  isVoiceReading,
  isDeepDive,
  type SiteProduct,
} from "@/lib/products";
import { mintReportToken } from "@/lib/report-token";
import { mintDownloadToken } from "@/lib/download-token";
import { ALL_90_SPREADS_FILE, isJokerBirthdate } from "@/lib/deep-dive";
import { getStripe } from "@/lib/stripe";
import { birthdateFromCheckoutSession } from "@/lib/birthdate";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Purchase status",
  description:
    "Confirm a Card Blueprints purchase and access your order.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ session_id?: string }>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id ?? "";

  let product: SiteProduct | undefined;
  let customerEmail = "";
  let confirmed = false;
  let session2: import("stripe").Stripe.Checkout.Session | undefined;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(
        sessionId,
      );
      session2 = session;
      customerEmail =
        session.customer_details?.email ??
        session.customer_email ??
        "";
      const paymentSatisfied =
        session.payment_status === "paid" ||
        (session.payment_status === "no_payment_required" &&
          session.amount_total === 0);
      product =
        session.status === "complete" && paymentSatisfied
          ? productBySlug(session.metadata?.offer_slug ?? "")
          : undefined;
      confirmed = Boolean(product);
    } catch (error) {
      console.warn(
        "[checkout/success] could not retrieve session",
        error,
      );
    }
  }

  const deepDive = product && isDeepDive(product);
  // The live product: fulfilled by hand, nothing to mint or build here.
  const oneQuestion = Boolean(deepDive && isOneQuestionSession(session2));
  // Retired year-app SKUs on the same slug still render the year for past buyers.
  const legacyYearApp = Boolean(deepDive && !oneQuestion);
  const question = oneQuestion ? questionFromCheckoutSession(session2) : "";
  const deepDiveBirthday = deepDive ? birthdateFromCheckoutSession(session2) : "";
  const digital =
    product && isDigitalDownload(product) && !deepDive;
  const voice = product && isVoiceReading(product);
  const instantReport = product && isInstantReport(product);

  // Instant report: birth date from our review picker (session metadata)
  // or an older Stripe custom field. Then mint the report token.
  let reportToken = "";
  if (product && isInstantReport(product) && confirmed) {
    const birthdate = birthdateFromCheckoutSession(session2);
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate) && customerEmail) {
      try {
        reportToken = await mintReportToken(
          customerEmail,
          product.reportSlug,
          sessionId,
          birthdate,
        );
      } catch (e) {
        console.error("[checkout/success] report token mint failed", e);
      }
    }
  }

  // Blueprint bundle: The 90 Spreads PDF ships with the $13 report.
  let spreadsDownloadHref = "";
  if (instantReport && product!.slug === "personal-card-blueprint" && confirmed && customerEmail) {
    try {
      const dl = await mintDownloadToken(customerEmail, ALL_90_SPREADS_FILE.slug, 30);
      spreadsDownloadHref = `/api/download/${ALL_90_SPREADS_FILE.slug}?token=${encodeURIComponent(dl)}`;
    } catch (e) {
      console.error("[checkout/success] 90 spreads token mint failed", e);
    }
  }

  let downloadToken = "";
  if (
    confirmed &&
    customerEmail &&
    isDigitalDownload(product!) &&
    !deepDive
  ) {
    try {
      downloadToken = await mintDownloadToken(
        customerEmail,
        product!.slug,
        product!.redownloadDays,
      );
    } catch (e) {
      console.error("[checkout/success] download token mint failed", e);
    }
  }

  // 52xSeven Blueprint: mint the same 12-month sign-in token the webhook
  // emails, and build the year so the app renders right here. Mint or engine
  // failure falls back to the email-only story — never a blank page.
  let yearToken = "";
  let yearData: YearBlueprint | null = null;
  let yearExtra = "";
  const yearJoker = isJokerBirthdate(deepDiveBirthday);
  if (legacyYearApp && confirmed && customerEmail) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(deepDiveBirthday) && !yearJoker) {
      try {
        yearToken = await mintReportToken(
          customerEmail,
          FIFTY_TWO_BY_SEVEN_REPORT_SLUG,
          sessionId,
          deepDiveBirthday,
          FIFTY_TWO_BY_SEVEN_ACCESS_DAYS,
        );
      } catch (e) {
        console.error("[checkout/success] 52xseven token mint failed", e);
      }
      try {
        yearData = await buildYearBlueprint(deepDiveBirthday);
      } catch (e) {
        console.error("[checkout/success] 52xseven year build failed", e);
        yearData = null;
      }
    } else if (!yearJoker) {
      yearExtra =
        "We could not read a birth date from this checkout. Reply to your receipt email with your birth date (YYYY-MM-DD) and we will unlock your year.";
    }
  }

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        {
          label: voice ? "Legacy order support" : DEEP_DIVE_PRODUCT_NAME,
          href: digital
            ? "/products/analog-algorithm"
            : voice
              ? "/contact"
              : DEEP_DIVE_PRODUCT_PATH,
        },
        {
          label: "Purchase status",
          href: "/checkout/success",
        },
      ]}
    >
      <header className="max-w-[38em] pb-8">
        <Kicker className="mb-4">
          {confirmed ? "Payment received" : "Payment not verified"}
        </Kicker>
        <h1 className="type-display text-brand-ink">
          {confirmed && oneQuestion
            ? "Payment confirmed. Your question is in."
            : confirmed && deepDive
            ? yearToken
              ? "Payment confirmed. Your year is unlocked."
              : "Order confirmed. Check your email."
            : confirmed && digital
            ? "Your e-book is ready for download."
            : confirmed && instantReport
              ? "Payment confirmed. Your Blueprint is ready."
              : confirmed && voice
                ? "Payment confirmed. Your access is being activated."
                : "We could not confirm this purchase yet."}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          {confirmed && oneQuestion
            ? deepDiveSuccessCopy(deepDiveBirthday)
            : confirmed && deepDive
            ? yearToken
              ? `"${product!.name}" — ${product!.priceLabel}. Your birth card, the chapter you are in right now, all seven chapters and the story arc are below. Your sign-in link was also emailed and works for 12 months.`
              : yearExtra || deepDiveSuccessCopy(deepDiveBirthday)
            : confirmed && digital
            ? `"${product!.name}" — ${product!.priceLabel}. Your download link is below. Save the PDF somewhere safe.`
            : confirmed && instantReport
              ? reportToken
                ? `"${product!.name}" — ${product!.priceLabel}. Your personalized report is generated and ready to read. A return link was also emailed to you.`
                : "Payment is confirmed, but we could not read a birth date from this checkout. Reply to your receipt email with your birth date (YYYY-MM-DD) and we'll finish your Blueprint."
              : confirmed && voice
                ? activationInstructions(product!)
                : "No paid access was verified. Return to the Blueprint page or contact support so we can verify the payment."}
        </p>
        {confirmed && customerEmail && (
          <p className="mt-3 text-sm text-brand-ink-soft">
            Receipt and instructions were sent to{" "}
            <strong>{customerEmail}</strong>.
          </p>
        )}
      </header>

      {confirmed && (
        <div className="mb-6"><LinkButton href={`/my-purchases?session_id=${encodeURIComponent(sessionId)}`} variant="outline">My purchases</LinkButton></div>
      )}

      {confirmed ? (
        <section className="border-y border-brand-line py-8">
          {oneQuestion ? (
            <>
              <QuestionFulfillment question={question} email={customerEmail} />
              <OneQuestionReadingLive sessionId={sessionId} email={customerEmail} />
            </>
          ) : deepDive ? (
            <YearFulfillment
              birthday={deepDiveBirthday}
              token={yearToken}
              year={yearData}
              extra={yearExtra}
              email={customerEmail}
            />
          ) : digital ? (
            <DigitalFulfillment
              product={product!}
              email={customerEmail}
              token={downloadToken}
            />
          ) : instantReport ? (
            <><ReportFulfillment reportToken={reportToken} spreadsHref={spreadsDownloadHref} />
            {product!.slug === CONSULT_SLUG && session2?.payment_status === "paid" && (
              <div className="mt-8 text-center">
                <p className="mb-4">Share what you want to explore and your time zone. Cass will contact you to arrange your 45-minute call.</p>
                <LinkButton href={consultationHref(sessionId)} variant="primary">Arrange my consultation</LinkButton>
              </div>
            )}</>
          ) : voice ? (
            <VoiceFulfillment product={product!} />
          ) : null}
        </section>
      ) : (
        <section
          role="status"
          className="border-y border-brand-line py-8"
        >
          <h2 className="type-h3 text-brand-ink">
            No paid access is being claimed on this page.
          </h2>
          <p className="mt-3 max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
            A missing, unpaid, or unavailable Stripe session can land
            here without proving a purchase. If you have a receipt,
            contact support and include the purchase email and offer
            name.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LinkButton href={DEEP_DIVE_PRODUCT_PATH} variant="primary">
              Ask one question
            </LinkButton>
            <LinkButton href="/contact" variant="outline">
              Contact Support
            </LinkButton>
          </div>
        </section>
      )}

      <section className="mt-10 max-w-[38em]">
        <h2 className="type-h3 text-brand-ink">
          If something doesn&rsquo;t work
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          {oneQuestion
            ? "If the question came through wrong, or the birth date is off, reply to your receipt email today or"
            : deepDive
            ? "If your year doesn't open, or the birth date is wrong, reply to your receipt email or"
            : digital
            ? "If your download link doesn't work, reply to your receipt email or"
            : instantReport
              ? "If your Blueprint link doesn't work or the birth date is wrong, reply to your receipt email or"
              : "If the line doesn&rsquo;t recognize your number or a call drops, reply to your receipt email or"}{" "}
          <Link
            href="/contact"
            className="editorial-link text-brand-ink"
          >
            send a note via contact
          </Link>{" "}
          with the email used at checkout{voice ? " and your checkout phone number" : ""}. Unused
          purchases are covered by the{" "}
          <Link
            href="/refund-policy"
            className="editorial-link text-brand-ink"
          >
            refund policy
          </Link>
          .
        </p>
      </section>
    </SeoShell>
  );
}

function QuestionFulfillment({
  question,
  email,
}: {
  question: string;
  email: string;
}) {
  return (
    <div className="max-w-[38em]">
      <Kicker className="mb-4">What happens now</Kicker>
      {question ? (
        <blockquote className="border-l-2 border-brand-line-strong pl-4 font-serif text-lg leading-snug text-brand-ink">
          &ldquo;{question}&rdquo;
        </blockquote>
      ) : (
        <p className="text-[0.95rem] leading-relaxed text-brand-ink-soft">
          The question did not come through with the payment. Reply to your
          receipt email with the one question and it goes in the queue.
        </p>
      )}
      <ol className="mt-6 space-y-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
        <li>
          <strong className="text-brand-ink">1. I pull your cards.</strong> Your
          birth card, this year&rsquo;s Long Range and Pluto cards, and the two
          karma cards. Same birthday, same cards, every time.
        </li>
        <li>
          <strong className="text-brand-ink">2. I write it.</strong> About 600
          words in plain language. What the pattern is, how it bears on your
          question, and three things to keep an eye out for.
        </li>
        <li>
          <strong className="text-brand-ink">3. It lands in your inbox</strong>
          {email ? (
            <>
              {" "}at <strong className="text-brand-ink">{email}</strong>
            </>
          ) : null}{" "}
          within {ONE_QUESTION_TURNAROUND}. Plain text. No login, nothing to
          download.
        </li>
      </ol>
      <p className="mt-6 text-sm leading-relaxed text-brand-ink-soft">
        Want to reword the question? Reply to your receipt today, before it is
        written.
      </p>
    </div>
  );
}

function YearFulfillment({
  birthday,
  token,
  year,
  extra,
  email,
}: {
  birthday: string;
  token: string;
  year: YearBlueprint | null;
  extra: string;
  email: string;
}) {
  const yearHref = token ? `/blueprint?token=${encodeURIComponent(token)}` : "";
  return (
    <div className="text-center">
      <Kicker className="mb-4">Your year</Kicker>
      {yearHref ? (
        <>
          <DeepDiveDeliveredBeacon placement="checkout-success" />
          <h2 className="type-h2 text-brand-ink">It&rsquo;s unlocked.</h2>
          <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
            Your 52xSeven Blueprint was built from the birth date you entered at
            checkout. Open it full-screen and save it to your phone — the same
            sign-in link is in your email.
          </p>
          <div className="mx-auto mt-6 flex max-w-[24em] flex-col gap-3">
            <LinkButton href={yearHref} variant="accent" size="large">
              Open My Year
            </LinkButton>
          </div>
          <p className="mt-4 text-xs text-brand-ink-soft">
            The link works for 12 months.
            {email ? (
              <>
                {" "}
                A copy was emailed to <strong>{email}</strong>.
              </>
            ) : null}
          </p>
          {year ? (
            <div className="mx-auto mt-10 max-w-[420px]">
              <YearBlueprintApp data={year} mode="full" framed />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="type-h2 text-brand-ink">Check your email.</h2>
          <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
            {extra || deepDiveSuccessCopy(birthday)}
          </p>
        </>
      )}
    </div>
  );
}

function DigitalFulfillment({
  product,
  token,
}: {
  product: SiteProduct;
  email: string;
  token: string;
}) {
  const downloadHref = token
    ? `/api/download/${product.slug}?token=${encodeURIComponent(token)}`
    : "";

  return (
    <div className="text-center">
      <Kicker className="mb-4">Your e-book</Kicker>
      <h2 className="type-h2 text-brand-ink">{product.name}</h2>
      <p className="mt-2 text-sm text-brand-ink-soft">
        {product.deliverable}
      </p>
      {downloadHref ? (
        <div className="mt-6">
          <LinkButton
            href={downloadHref}
            variant="accent"
            size="large"
          >
            Download {product.name} &mdash; PDF
          </LinkButton>
        </div>
      ) : (
        <p className="mt-6 border border-brand-oxblood p-4 text-sm text-brand-ink">
          Payment is confirmed, but the secure download link could not be
          prepared. Reply to your receipt email so we can restore access.
        </p>
      )}
      <p className="mt-3 text-xs text-brand-ink-soft">
        Your download link is good for 30 days. Need it again? Reply
        to your receipt email.
      </p>

    </div>
  );
}

function VoiceFulfillment({
  product,
}: {
  product: SiteProduct;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
        <p className="font-serif text-lg text-brand-bronze">01</p>
        <h2 className="type-h3 mt-2 text-brand-ink">
          Use your checkout number.
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          Your access is tied to the phone number you entered at
          checkout. The reader recognizes that number when you call.
        </p>
      </div>
      <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
        <p className="font-serif text-lg text-brand-bronze">02</p>
        <h2 className="type-h3 mt-2 text-brand-ink">
          Watch for activation instructions.
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          Payment confirmation does not prove the phone line has
          recognized your access yet. Wait for the start-here email
          before calling.
        </p>
      </div>
      <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
        <p className="font-serif text-lg text-brand-bronze">03</p>
        <h2 className="type-h3 mt-2 text-brand-ink">
          Then call the reading line.
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          Your session covers up to{" "}
          {"durationMinutes" in product
            ? product.durationMinutes
            : 15}{" "}
          minutes. Start it within{" "}
          {"accessDays" in product ? product.accessDays : 30} days.
        </p>
      </div>
    </div>
  );
}

function activationInstructions(product: SiteProduct): string {
  if ("accessType" in product && product.accessType === "season_pass") {
    return "We are linking your 90-day pass to the phone number you used at checkout. Wait for the start-here email before calling.";
  }
  return `We are linking this reading to the phone number you used at checkout. Wait for the start-here email before calling; after activation, you have ${"accessDays" in product ? product.accessDays : 30} days to begin.`;
}
function ReportFulfillment({
  reportToken,
  spreadsHref,
}: {
  reportToken: string;
  spreadsHref?: string;
}) {
  if (!reportToken) {
    return (
      <div className="text-center">
        <Kicker className="mb-4">Your Blueprint</Kicker>
        <h2 className="type-h2 text-brand-ink">One step left.</h2>
        <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
          Your payment went through, but the birth date from checkout
          didn&rsquo;t reach us. Reply to your receipt email with your birth
          date (YYYY-MM-DD) and we&rsquo;ll send your report link.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <Kicker className="mb-4">Your Blueprint</Kicker>
      <h2 className="type-h2 text-brand-ink">It&rsquo;s ready.</h2>
      <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
        Your report was generated from the birth date you
        entered at checkout. Open it now — the same link is in your email.
      </p>
      <div className="mt-6">
        <LinkButton
          href={`/blueprint?token=${reportToken}`}
          variant="accent"
          size="large"
        >
          Open my report
        </LinkButton>
      </div>
      {spreadsHref && (
        <div className="mt-3">
          <LinkButton href={spreadsHref} variant="outline" size="large">
            Download The 90 Spreads &mdash; PDF
          </LinkButton>
        </div>
      )}
      <p className="mt-3 text-xs text-brand-ink-soft">
        Keep the emailed link — it re-opens your report for 12 months. Save a PDF to keep it.
        {spreadsHref ? " The 90 Spreads link is good for 30 days; a backup copy is in your email." : ""}
      </p>
    </div>
  );
}
