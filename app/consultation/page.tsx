import type { Metadata } from "next";
import { verifiedConsultation } from "@/lib/consultation";
import { ConsultationRequestForm } from "@/components/checkout/ConsultationRequestForm";
import { SeoShell } from "@/components/seo/SeoShell";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Arrange my consultation", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const sessionId = (await searchParams).session_id || "";
  let verified = false;
  let unavailable = false;
  try { verified = Boolean(await verifiedConsultation(sessionId)); }
  catch { unavailable = true; }
  return <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Consultation", href: "/consultation" }]}>
    <h1 className="type-display mb-6">Arrange my consultation</h1>
    {verified ? <ConsultationRequestForm sessionId={sessionId} /> :
      <p role="alert">{unavailable ? "We cannot check your purchase right now. Please reload this page shortly." : "Open this page from your paid consultation receipt. We could not verify a paid consultation with this link."} If you need help, reply to your receipt email.</p>}
  </SeoShell>;
}
