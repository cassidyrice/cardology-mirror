import { NextRequest, NextResponse } from "next/server";
import { CONSULT_SUCCESS_COPY } from "@/lib/blueprint-report";
import { consultationFields, verifiedConsultation } from "@/lib/consultation";
import { sendEmail, classifyEmailError } from "@/lib/email";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" };
const reply = (body: object, status: number) => NextResponse.json(body, { status, headers });

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) return reply({ error: "Please submit this form from our site." }, 403);
  if (!req.headers.get("content-type")?.startsWith("application/json")) return reply({ error: "Invalid request." }, 415);
  const limit = rateLimit(rateLimitKey(req, "consultation"), { limit: 10, windowMs: 600_000 });
  if (!limit.ok) return NextResponse.json({ error: "Please wait a few minutes, then retry." }, { status: 429, headers: { ...headers, "retry-after": String(limit.retryAfterSec) } });
  // Bound the stream, not just Content-Length, before parsing untrusted JSON.
  const reader = req.body?.getReader();
  if (!reader) return reply({ error: "Complete the form and try again." }, 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  let fields: ReturnType<typeof consultationFields>;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16_384) { await reader.cancel(); return reply({ error: "Your request is too long." }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    fields = consultationFields(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return reply({ error: "Complete the form and try again." }, 400); }
  if (!fields) return reply({ error: "Add what you want to explore (3–1500 characters), your time zone, and an optional note of up to 1000 characters." }, 400);
  try {
    const buyer = await verifiedConsultation(fields.sessionId);
    if (!buyer) return reply({ error: "We could not verify a paid consultation. Open the link in your receipt or contact support." }, 403);
    const sessionLimit = rateLimit(`consultation-session:${fields.sessionId}`, { limit: 5, windowMs: 600_000 });
    if (!sessionLimit.ok) return reply({ error: "Please wait a few minutes before retrying this request." }, 429);
    const to = process.env.INTAKE_EMAIL;
    if (!to) return reply({ error: "Requests are temporarily unavailable. Your details are still here. Please retry shortly or reply to your receipt email." }, 503);
    // ponytail: Resend deduplicates this purchase's identical request for 24 hours.
    // The disabled submit button and per-session brake cover normal repeat clicks.
    // Add a durable request ledger if requests need editing or lifetime deduplication.
    await sendEmail({
      to,
      subject: "ACTION: arrange a paid 45-minute consultation",
      replyTo: buyer.email,
      idempotencyKey: `consultation-request/${fields.sessionId}`,
      text: [
        "A paid Blueprint Report + Consultation buyer has requested their call.",
        `Name: ${buyer.name}`, `Email: ${buyer.email}`,
        `Stripe session: ${fields.sessionId}`, "",
        `What they want to explore:\n${fields.topic}`, "",
        `Time zone: ${fields.timeZone}`, `Extra note: ${fields.note || "None"}`, "",
        "Contact the buyer to arrange the 45-minute call. No appointment has been booked.",
      ].join("\n"),
    });
    return reply({ message: CONSULT_SUCCESS_COPY }, 200);
  } catch (error) {
    console.error("[consultation] request not confirmed", { code: classifyEmailError(error) });
    return reply({ error: "We could not confirm your request. Your details are still here. Retry with the same details, or reply to your receipt if you need to change a request already sent." }, 503);
  }
}
