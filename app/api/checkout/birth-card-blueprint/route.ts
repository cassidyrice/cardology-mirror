import { recordFunnelEvent } from "@/lib/analytics-server";
import { canonicalCalendarDate } from "@/lib/birthdate";
import { stripePublishableKey } from "@/lib/deep-dive";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { readingDb } from "@/lib/reading-service";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const merchant = "acct_1U1a1dChx1yAVyrs";
type Order = {
  id: string;
  birth_month: number | null;
  birth_day: number | null;
  stripe_session_id: string | null;
  created_at: number;
  paid_at: number | null;
};
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function reply(body: Record<string, string>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
const unavailable = () => reply({ error: "Checkout is temporarily unavailable." }, 503);

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  if (origin !== SITE_URL || req.headers.get("origin") !== origin) {
    return reply({ error: "Invalid checkout origin." }, 403);
  }
  const publishableKey = stripePublishableKey();
  const live = publishableKey.startsWith("pk_live_");
  const secretMode = /^(sk|rk)_(test|live)_/.exec(process.env.STRIPE_SECRET_KEY ?? "")?.[2];
  const priceId = process.env.STRIPE_BIRTH_CARD_BLUEPRINT_PRICE_ID;
  if (process.env.CARD_BLUEPRINT_EMBEDDED_CHECKOUT !== "1" || !priceId?.startsWith("price_") ||
      !process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") ||
      (!live && !publishableKey.startsWith("pk_test_")) || secretMode !== (live ? "live" : "test") ||
      (live !== (origin === "https://cardblueprints.com"))) return unavailable();

  if (!rateLimit(rateLimitKey(req, "blueprint-checkout"), { limit: 12, windowMs: 600_000 }).ok) {
    return reply({ error: "Too many attempts. Please try again later." }, 429);
  }
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return reply({ error: "Expected a JSON request." }, 415);
  }
  // Bound chunked requests too. The three checkout fields fit comfortably in 1 KiB.
  let remaining = 1024;
  const bounded = req.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      remaining -= chunk.byteLength;
      if (remaining < 0) throw new RangeError("Checkout request too large");
      controller.enqueue(chunk);
    },
  }));
  const body = await new Response(bounded).json().catch(() => null);
  if (remaining < 0) return reply({ error: "Checkout request too large." }, 413);
  const { month, day, attemptId } = body ?? {};
  if (!Number.isInteger(month) || !Number.isInteger(day) || !canonicalCalendarDate(`2000-${month}-${day}`) ||
      typeof attemptId !== "string" || !uuidV4.test(attemptId)) {
    return reply({ error: "Enter a valid birth month and day, then try again." }, 400);
  }

  try {
    const db = await readingDb();
    const stripe = getStripe();
    const [account, price] = await Promise.all([stripe.accounts.retrieveCurrent(), stripe.prices.retrieve(priceId)]);
    const expectedAccount = live ? merchant : process.env.STRIPE_BIRTH_CARD_BLUEPRINT_TEST_ACCOUNT_ID || merchant;
    if (account.id !== expectedAccount || price.id !== priceId || price.livemode !== live || !price.active ||
        price.type !== "one_time" || price.currency !== "usd" || price.unit_amount !== 1300) return unavailable();

    // The unique attempt and Stripe idempotency key keep double taps and partially failed requests on one order.
    const order = await db.prepare(`INSERT INTO blueprint_checkout_orders (id, attempt_id, birth_month, birth_day)
      VALUES (?, ?, ?, ?) ON CONFLICT(attempt_id) DO UPDATE SET attempt_id = excluded.attempt_id
      RETURNING id, birth_month, birth_day, stripe_session_id, created_at, paid_at`).bind(crypto.randomUUID(), attemptId, month, day)
      .first<Order>();
    if (!order) return unavailable();
    // Stripe retains idempotency keys for at least 24 hours. Retire attempts before that boundary.
    if (order.birth_month !== month || order.birth_day !== day || order.paid_at !== null ||
        order.created_at <= Date.now() / 1000 - 23 * 3600) {
      return reply({ error: "This checkout attempt has ended. Start a new checkout." }, 409);
    }
    const session = order.stripe_session_id
      ? await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      : await stripe.checkout.sessions.create({
          mode: "payment", ui_mode: "embedded_page", redirect_on_completion: "never",
          integration_identifier: "birth_card_blueprint_qhrntkfa", adaptive_pricing: { enabled: false },
          line_items: [{ price: price.id, quantity: 1 }],
          metadata: { offer_slug: "birth-card-blueprint", blueprint_order_id: order.id },
        }, { idempotencyKey: `blueprint-order-${order.id}` });
    if (session.status !== "open" || session.payment_status !== "unpaid") {
      return reply({ error: "This checkout session has ended." }, 409);
    }
    if (!session.client_secret || session.livemode !== live || session.currency !== "usd" || session.amount_total !== 1300 ||
        session.metadata?.blueprint_order_id !== order.id || session.metadata.offer_slug !== "birth-card-blueprint") return unavailable();
    if (!order.stripe_session_id) {
      const bound = await db.prepare(`UPDATE blueprint_checkout_orders SET stripe_session_id = ?
        WHERE id = ? AND stripe_session_id IS NULL AND paid_at IS NULL RETURNING id`)
        .bind(session.id, order.id).first();
      if (bound) {
        recordFunnelEvent({ name: "checkout_started", source: "server", eventId: `checkout:${session.id}`,
          path: "/birth-card-calculator", placement: "birth-card-calculator-result", offerSlug: "birth-card-blueprint",
          currency: "usd", valueCents: 1300 });
      } else {
        const sameSession = await db.prepare("SELECT id FROM blueprint_checkout_orders WHERE id=? AND stripe_session_id=? AND paid_at IS NULL")
          .bind(order.id, session.id).first();
        if (!sameSession) return unavailable();
      }
    }
    return reply({ clientSecret: session.client_secret, publishableKey });
  } catch {
    // Provider errors can contain customer or configuration details; keep them out of the response and logs.
    return unavailable();
  }
}
