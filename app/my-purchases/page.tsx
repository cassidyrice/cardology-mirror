import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { LinkButton } from "@/components/ui";
import { BLUEPRINT_REPORT_SLUG, CONSULT_SLUG, consultationHref } from "@/lib/blueprint-report";
import { birthdateFromCheckoutSession } from "@/lib/birthdate";
import { isInstantReport, productBySlug } from "@/lib/products";
import { mintReportToken } from "@/lib/report-token";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My purchases", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function MyPurchasesPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const sessionId = (await searchParams).session_id || "";
  let order: { name: string; reportHref: string; consultation: boolean; blueprint: boolean } | null = null;
  let unavailable = false;
  if (/^cs_(?:live|test)_[A-Za-z0-9_]{8,220}$/.test(sessionId)) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const product = productBySlug(session.metadata?.offer_slug || "");
      const email = session.customer_details?.email || session.customer_email || "";
      if (session.status === "complete" && session.payment_status === "paid" && product && email) {
        let reportHref = `/checkout/success?session_id=${encodeURIComponent(sessionId)}`;
        if (isInstantReport(product)) {
          // A receipt opens only this purchase; the browser never chooses its owner or tier.
          const token = await mintReportToken(email, product.reportSlug, sessionId, birthdateFromCheckoutSession(session));
          reportHref = `/blueprint?token=${encodeURIComponent(token)}`;
        }
        order = { name: product.name, reportHref, consultation: product.slug === CONSULT_SLUG, blueprint: isInstantReport(product) && product.reportSlug === BLUEPRINT_REPORT_SLUG };
      }
    } catch { unavailable = true; }
  }
  return <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "My purchases", href: "/my-purchases" }]}>
    <h1 className="type-display mb-6">My purchases</h1>
    {order ? <section className="max-w-xl space-y-5" data-sensitive>
      <h2 className="type-h2">{order.name}</h2>
      <p>This private receipt link opens this purchase. Keep it to return here. For another purchase, use the link in that purchase&apos;s email.</p>
      <div><LinkButton href={order.reportHref} variant="primary">{order.blueprint ? "Open my report" : "Open my purchase"}</LinkButton></div>
      {order.blueprint && <>
        <div><LinkButton href={`${order.reportHref}#deal-it-yourself`} variant="outline">Open the deal-it-yourself guide</LinkButton></div>
        <p className="text-sm">The guide is included inside your report. Use your browser&apos;s Print or Save as PDF to keep a copy.</p>
      </>}
      {order.consultation && <div>
        <LinkButton href={consultationHref(sessionId)} variant="outline">Arrange my consultation</LinkButton>
        <p className="mt-3 text-sm">Share what you want to explore and your time zone. Cass will contact you to arrange your 45-minute call.</p>
      </div>}
    </section> : <section className="max-w-xl space-y-4">
      <p role="status">{unavailable ? "We cannot check your purchase right now. Please reload this page shortly." : sessionId ? "This link did not verify a paid purchase. Use the private My purchases link in your purchase email." : "Open the private My purchases link in your purchase email to see your report and any included consultation. No password is needed."}</p>
      <p>Cannot find your email, or has your report link expired? Reply to your receipt or <Link className="underline" href="/contact">contact Cass</Link> with the email you used to buy. He can help you recover access.</p>
    </section>}
  </SeoShell>;
}
