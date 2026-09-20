import type Stripe from "stripe";
import { CONSULT_SLUG } from "./blueprint-report";
import { getStripe } from "./stripe";

/** The unguessable Stripe session ID is a bearer receipt, as on checkout/success.
 * Always recheck payment and tier on the server, including on every submission. */
export async function verifiedConsultation(sessionId: string) {
  if (!/^cs_(?:live|test)_[A-Za-z0-9_]{8,220}$/.test(sessionId)) return null;
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  return consultationBuyer(session);
}

export function consultationBuyer(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email || session.customer_email || "";
  if (session.status !== "complete" || session.payment_status !== "paid" ||
      session.metadata?.offer_slug !== CONSULT_SLUG || !session.amount_total ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, name: session.customer_details?.name?.trim() || "Reader" };
}

export function consultationFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const field = (key: string, min: number, max: number) => {
    const v = body[key];
    if (typeof v !== "string") return null;
    const text = v.trim();
    return text.length >= min && text.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) ? text : null;
  };
  const sessionId = field("sessionId", 1, 240);
  const topic = field("topic", 3, 1500);
  const timeZone = field("timeZone", 2, 100);
  const note = body.note == null ? "" : field("note", 0, 1000);
  if (!sessionId || !topic || !timeZone || note === null || /[\r\n]/.test(timeZone)) return null;
  return { sessionId, topic, timeZone, note };
}
