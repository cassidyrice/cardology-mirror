import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import { deepDiveSuccessCopy } from "@/lib/deep-dive";
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
import { ALL_90_SPREADS_FILE, isJokerBirthdate, type DeepDiveFile } from "@/lib/deep-dive";
import {
  deepDiveFilesForBirthday,
  deepDiveCardPdfForBirthday,
} from "@/lib/deep-dive-card-pdf";
import { getStripe } from "@/lib/stripe";
import { birthdateFromCheckoutSession } from "@/lib/birthdate";
import { getReading } from "@/lib/engine";
import { PLANET_ORDER } from "@/lib/types";

type LifePathRow = {
  planet: string;
  card: string;
  meaning: string;
  balanced: string;
};

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
  const deepDiveBirthday = deepDive ? birthdateFromCheckoutSession(session2) : "";
  const digital = product && isDigitalDownload(product) && !deepDive;
  const voice = product && isVoiceReading(product);
  const instantReport = product && isInstantReport(product);

  // Instant report: birth date from our review picker (session metadata)
  // or an older Stripe custom field. Then mint the report token.
  let reportToken = "";
  if (instantReport && confirmed) {
    const birthdate = birthdateFromCheckoutSession(session2);
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate) && customerEmail) {
      try {
        reportToken = await mintReportToken(
          customerEmail,
          product!.slug,
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
  if (instantReport && confirmed && customerEmail) {
    try {
      const dl = await mintDownloadToken(customerEmail, ALL_90_SPREADS_FILE.slug, 30);
      spreadsDownloadHref = `/api/download/${ALL_90_SPREADS_FILE.slug}?token=${encodeURIComponent(dl)}`;
    } catch (e) {
      console.error("[checkout/success] 90 spreads token mint failed", e);
    }
  }

  let downloadToken = "";
  if (confirmed && customerEmail && isDigitalDownload(product!)) {
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

  // Deep Dive: mint the same HMAC download tokens the webhook emails, so
  // "instant download links + email backup" is true on this page too.
  // Mint failure falls back to the email-only story — never a blank page.
  let deepDiveLinks: { label: string; href: string }[] = [];
  let deepDiveExtra = "";
  if (deepDive && confirmed && customerEmail) {
    try {
      const days = 30;
      const files: DeepDiveFile[] = deepDiveFilesForBirthday(deepDiveBirthday);
      const minted: { label: string; href: string }[] = [];
      for (const file of files) {
        const token = await mintDownloadToken(customerEmail, file.slug, days);
        minted.push({
          label: file.label,
          href: `/api/download/${file.slug}?token=${encodeURIComponent(token)}`,
        });
      }
      deepDiveLinks = minted;
      if (
        !isJokerBirthdate(deepDiveBirthday) &&
        !deepDiveCardPdfForBirthday(deepDiveBirthday)
      ) {
        deepDiveExtra =
          "Your card PDF could not be resolved from the birthday on this order. Reply to your receipt email with your birth date (YYYY-MM-DD) and we will send the card file.";
      }
    } catch (e) {
      console.error("[checkout/success] deep dive token mint failed", e);
      deepDiveLinks = [];
    }
  }

  // Deep Dive on-screen bonus: the birth card plus the seven 13-year
  // life-path period cards that build the personality. Engine failure just
  // hides the section — the PDF links above are the contracted fulfillment.
  let deepDiveBirthCard = "";
  let deepDiveLifePath: LifePathRow[] = [];
  if (
    deepDive &&
    confirmed &&
    deepDiveBirthday &&
    !isJokerBirthdate(deepDiveBirthday)
  ) {
    try {
      const r = await getReading(deepDiveBirthday);
      deepDiveBirthCard = r.archetype.birth_card;
      deepDiveLifePath = PLANET_ORDER.map((planet) => {
        const d = r.deep_dive.life_path.periods[planet];
        return {
          planet,
          card: d?.card ?? "",
          meaning: d?.interpretation?.name ?? "",
          balanced: d?.interpretation?.sweet_spot ?? "",
        };
      }).filter((row) => row.card);
    } catch (e) {
      console.error("[checkout/success] deep dive life path failed", e);
      deepDiveLifePath = [];
    }
  }

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        {
          label: voice ? "Legacy order support" : "Personal Card Blueprint",
          href: digital
            ? "/products/analog-algorithm"
            : voice
              ? "/contact"
              : "/products/personal-card-blueprint",
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
          {confirmed && deepDive
            ? deepDiveLinks.length > 0
              ? "Your files are ready."
              : "Check your email."
            : confirmed && digital
            ? "Your e-book is ready for download."
            : confirmed && instantReport
              ? "Payment confirmed. Your Blueprint is ready."
              : confirmed && voice
                ? "Payment confirmed. Your access is being activated."
                : "We could not confirm this purchase yet."}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          {confirmed && deepDive
            ? deepDiveLinks.length > 0
              ? isJokerBirthdate(deepDiveBirthday)
                ? "Payment confirmed. December 31 is the Joker — your complete System Guide is ready below. There is no card-level Deep Dive PDF for this date."
                : "Payment confirmed. Your 7-page Deep Dive and complete System Guide are ready below. Backup copies were also emailed."
              : deepDiveSuccessCopy(deepDiveBirthday)
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

      {confirmed ? (
        <section className="border-y border-brand-line py-8">
          {deepDive ? (
            <DeepDiveFulfillment
              birthday={deepDiveBirthday}
              links={deepDiveLinks}
              extra={deepDiveExtra}
              email={customerEmail}
              birthCard={deepDiveBirthCard}
              lifePath={deepDiveLifePath}
            />
          ) : digital ? (
            <DigitalFulfillment
              product={product!}
              email={customerEmail}
              token={downloadToken}
            />
          ) : instantReport ? (
            <ReportFulfillment reportToken={reportToken} spreadsHref={spreadsDownloadHref} />
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
            <LinkButton href="/products/personal-card-blueprint" variant="primary">
              View Personal Card Blueprint
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
          {deepDive
            ? "If the Deep Dive files don't arrive, reply to your receipt email or"
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

function DeepDiveFulfillment({
  birthday,
  links,
  extra,
  email,
  birthCard,
  lifePath,
}: {
  birthday: string;
  links: { label: string; href: string }[];
  extra: string;
  email: string;
  birthCard?: string;
  lifePath?: LifePathRow[];
}) {
  return (
    <div className="text-center">
      <Kicker className="mb-4">Your Deep Dive</Kicker>
      {links.length > 0 ? (
        <>
          <h2 className="type-h2 text-brand-ink">Download your files.</h2>
          <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
            {deepDiveSuccessCopy(birthday)}
          </p>
          <div className="mx-auto mt-6 flex max-w-[24em] flex-col gap-3">
            {links.map((link) => (
              <LinkButton
                key={link.href}
                href={link.href}
                variant="accent"
                size="large"
              >
                Download {link.label} &mdash; PDF
              </LinkButton>
            ))}
          </div>
          {extra ? (
            <p className="mx-auto mt-4 max-w-[32em] text-sm text-brand-ink">
              {extra}
            </p>
          ) : null}
          <p className="mt-4 text-xs text-brand-ink-soft">
            Links are good for 30 days.
            {email ? (
              <>
                {" "}
                Backup copies were emailed to <strong>{email}</strong>.
              </>
            ) : null}
          </p>
          {lifePath && lifePath.length > 0 && (
            <div className="mx-auto mt-10 max-w-[34em] border-t border-brand-line pt-8 text-left">
              <h3 className="type-h3 text-center text-brand-ink">
                {birthCard ? `${birthCard} — ` : ""}your seven 13-year period cards
              </h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-brand-ink-soft">
                The birth card is the engine; these seven life-path cards are the
                ~13-year chapters that build the personality around it, in order.
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {lifePath.map((row) => (
                  <li key={row.planet} className="rounded-[3px] border border-brand-line p-3">
                    <p className="font-semibold text-brand-ink">
                      {row.planet} &middot; {row.card}
                      {row.meaning ? ` — ${row.meaning}` : ""}
                    </p>
                    {row.balanced && (
                      <p className="mt-1 leading-relaxed text-brand-ink-soft">
                        Balanced: {row.balanced}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="type-h2 text-brand-ink">Check your email.</h2>
          <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
            {deepDiveSuccessCopy(birthday)}
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
        Your Personal Card Blueprint was generated from the birth date you
        entered at checkout. Open it now — the same link is in your email.
      </p>
      <div className="mt-6">
        <LinkButton
          href={`/blueprint?token=${reportToken}`}
          variant="accent"
          size="large"
        >
          Open My Personal Blueprint
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
        Keep the emailed link — it re-opens your report anytime.
        {spreadsHref ? " The 90 Spreads link is good for 30 days; a backup copy is in your email." : ""}
      </p>
    </div>
  );
}
