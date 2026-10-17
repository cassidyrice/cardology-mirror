export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST /checkout/[offer]/session
// All site checkout offers were retired in Oct 2026; the readings in
// lib/readings.ts are sold on Stan Store. Stripe webhooks for past orders are
// handled separately (app/api/checkout/webhook) and keep working.
export async function POST(): Promise<Response> {
  return Response.json({ error: "This offer has been retired." }, { status: 410 });
}
