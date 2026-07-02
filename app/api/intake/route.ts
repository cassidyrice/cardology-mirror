import { NextRequest, NextResponse } from "next/server";

import { sendIntakeEmail } from "@/lib/email";
import { offerBySlug } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST /api/intake
// Receives the post-checkout intake form, emails Cass, redirects back to the
// success page in its submitted state. No DB — email is the persistence layer
// until the auto-generated reading pipeline (card-blueprint-api) is wired in.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const get = (k: string) => (form.get(k) ?? "").toString().trim();

  const email = get("email");
  const subjectBirthdate = get("subject_birthdate");
  const otherBirthdate = get("other_birthdate");
  const question = get("question");
  const notes = get("notes");
  const sessionId = get("session_id");
  const offerSlug = get("offer_slug");
  const offerName = get("offer_name");
  const offer = offerSlug ? offerBySlug(offerSlug) : undefined;

  if (!email || !subjectBirthdate) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  const to = process.env.INTAKE_EMAIL;
  if (!to) {
    console.warn("[intake] INTAKE_EMAIL not set; intake received but not delivered", {
      sessionId,
      offerSlug,
    });
  } else {
    const subject = `New reading intake: ${offer?.priceLabel ?? ""} ${offerName || offerSlug || "reading"} — ${email}`;
    const text = [
      `Customer email: ${email}`,
      `Offer: ${offer?.priceLabel ?? ""} ${offerName || offerSlug || "(unknown)"}`,
      `Stripe session: ${sessionId || "(none)"}`,
      "",
      `Subject birth date: ${subjectBirthdate}`,
      otherBirthdate ? `Other person birth date: ${otherBirthdate}` : "",
      "",
      question ? `Question / focus:\n${question}` : "",
      notes ? `\nAdditional notes:\n${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await sendIntakeEmail({ to, subject, text, replyTo: email });
    } catch (e) {
      console.error("[intake] email send failed", e);
    }
  }

  const redirect = new URL("/checkout/success", SITE_URL);
  if (sessionId) redirect.searchParams.set("session_id", sessionId);
  if (offerSlug) redirect.searchParams.set("offer", offerSlug);
  redirect.searchParams.set("intake", "ok");
  return NextResponse.redirect(redirect, 303);
}
