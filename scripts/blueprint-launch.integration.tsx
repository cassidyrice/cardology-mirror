// Real handlers with synthetic Stripe/Resend HTTP. No external calls or charges.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import React from "react";
import { mock } from "bun:test";
mock.module("@cloudflare/next-on-pages", () => ({ getOptionalRequestContext: () => undefined }));
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
Object.assign(globalThis, { React });
Object.assign(process.env, {
  STRIPE_SECRET_KEY: "sk_test_synthetic", STRIPE_WEBHOOK_SECRET: "whsec_synthetic",
  REPORT_TOKEN_SECRET: "synthetic-report-secret", DOWNLOAD_TOKEN_SECRET: "synthetic-download-secret",
  STRIPE_PRICE_BLUEPRINT_REPORT: "price_report_synthetic", STRIPE_PRICE_BLUEPRINT_REPORT_CONSULT: "price_consult_synthetic",
  RESEND_API_KEY: "synthetic", INTAKE_FROM_EMAIL: "reader@example.test", INTAKE_EMAIL: "cass@example.test",
});
let session: any = { id: "cs_test_blueprint_integration", status: "complete", payment_status: "paid", amount_total: 29700, currency: "usd", created: Date.parse("2026-09-01T12:00:00Z") / 1000, customer_details: { email: "buyer@example.test", name: "Buyer" }, metadata: { offer_slug: "blueprint-report-consult", birthdate: "1991-02-17" } };
let created: URLSearchParams | undefined, stripeFail = false, emailFail = false;
const emails: any[] = [], accepted = new Map<string, string>();
let wireCalls = 0;
globalThis.fetch = (async (url: any, init: any) => {
  const href = String(url);
  if (href.startsWith("https://api.stripe.com/v1/checkout/sessions")) {
    if (stripeFail) return Response.json({ error: { message: "Unavailable" } }, { status: 503 });
    if (init?.method?.toUpperCase() === "POST") { created = new URLSearchParams(init.body); return Response.json({ id: "cs_test_created", url: "https://checkout.stripe.com/synthetic" }); }
    return Response.json(session);
  }
  if (href === "https://api.resend.com/emails") {
    wireCalls++;
    if (emailFail) return Response.json({ message: "Unavailable" }, { status: 503 });
    const key = init.headers["Idempotency-Key"];
    if (key && accepted.has(key)) {
      if (accepted.get(key) !== init.body) return Response.json({ message: "Idempotency payload conflict" }, { status: 409 });
      return Response.json({ id: "duplicate" });
    }
    if (key) accepted.set(key, init.body);
    emails.push({ ...JSON.parse(init.body), key });
    return Response.json({ id: "synthetic" });
  }
  throw new Error("Forbidden network: " + href);
}) as typeof fetch;
const { POST: checkout } = await import("../app/checkout/[offer]/session/route");
const { POST: webhook } = await import("../app/api/checkout/webhook/route");
const { POST: consultation } = await import("../app/api/consultation/route");
const { GET: report } = await import("../app/report/route");
const { default: purchasesPage } = await import("../app/my-purchases/page");
const { default: successPage } = await import("../app/checkout/success/page");
const { verifyReportToken, mintReportToken } = await import("../lib/report-token");
const { CONSULT_SUCCESS_COPY } = await import("../lib/blueprint-report");
let checks = 0;
const ok = (value: unknown, message: string) => { assert.ok(value, message); checks++; };
let ip = 0;
function req(path: string, body: unknown, overrides = {}) {
  return new NextRequest(`https://example.test${path}`, { method: "POST", headers: { origin: "https://example.test", "content-type": "application/json", "cf-connecting-ip": `test-${ip++}`, ...overrides }, body: JSON.stringify(body) });
}
async function event() {
  const body = JSON.stringify({ id: "evt_synthetic", type: "checkout.session.completed", data: { object: session } });
  const t = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET!).update(`${t}.${body}`).digest("hex");
  return webhook(new NextRequest("https://example.test/api/checkout/webhook", { method: "POST", body, headers: { "stripe-signature": `t=${t},v1=${signature}` } }));
}
for (const slug of ["blueprint-report", "blueprint-report-consult"]) {
  for (const date of ["1990-12-31", new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)]) {
    created = undefined;
    const result = await checkout(req(`/checkout/${slug}/session`, { birthdate: date }), { params: Promise.resolve({ offer: slug }) });
    ok(result.status === 400 && !created, `${slug}: refuse unsupported/future date before Stripe`);
  }
  const result = await checkout(req(`/checkout/${slug}/session`, { birthdate: "1991-02-17" }), { params: Promise.resolve({ offer: slug }) });
  ok(result.status === 200 && created?.get("metadata[offer_slug]") === slug, `${slug}: checkout uses its own tier`);
  ok(created?.get("line_items[0][price]") === (slug.endsWith("consult") ? "price_consult_synthetic" : "price_report_synthetic"), "configured price used");
  session.metadata.offer_slug = slug;
  emails.length = 0;
  ok((await event()).status === 200, "signed paid webhook accepted");
  const email = emails.find(e => e.to === "buyer@example.test");
  ok(email && !email.text.includes("Your bundled download"), "new tiers receive no legacy PDF bundle");
  const token = decodeURIComponent(email.text.match(/\/blueprint\?token=(\S+)/)[1]);
  ok((await verifyReportToken(token))?.slug === "blueprint-report", "email token points at shared report");
  ok(email.text.includes("Arrange my consultation") === slug.endsWith("consult"), "only consult email includes request route");
  const markup = renderToStaticMarkup(await successPage({ searchParams: Promise.resolve({ session_id: session.id }) }));
  const successToken = markup.match(/\/blueprint\?token=([^"&]+)/)![1];
  ok((await verifyReportToken(successToken))?.slug === "blueprint-report", "success-page token points at shared report");
  ok(markup.includes("Arrange my consultation") === slug.endsWith("consult"), "only paid consultation success page offers form");
  ok(!markup.includes("Download The 90 Spreads"), "no new-tier bonus on success page");
  const purchases = renderToStaticMarkup(await purchasesPage({ searchParams: Promise.resolve({ session_id: session.id }) }));
  ok(purchases.includes("Open my report") && purchases.includes("Open the deal-it-yourself guide"), "purchases opens report and included guide");
  ok(purchases.includes("Arrange my consultation") === slug.endsWith("consult"), "purchases respects consultation tier");
  ok(!purchases.includes("deck-kit") && !purchases.includes("attacker@example.test"), "purchases exposes no draft or chosen buyer identity");
  const doc = await report(new NextRequest(`https://example.test/report?token=${token}`));
  const html = await doc.text();
  ok(doc.status === 200 && (html.match(/<section class="page"/g) || []).length === 22, "Cass fixture has 22 report pages");
  ok(html.includes("2026-09-01") && !html.includes("every seat is shared by seven"), "purchase date and corrected prose");
  ok(html.includes("top left corner") && html.includes("packet intact"), "dealing matches printed orientation");
  stripeFail = true;
  ok((await report(new NextRequest(`https://example.test/report?token=${token}`))).status === 503, "lookup failure cannot drift report date");
  stripeFail = false;
}
for (const invalid of ["", "cs_test_invalid_short"]) {
  const old = session; session = { ...session, payment_status: "unpaid" };
  const closed = renderToStaticMarkup(await purchasesPage({ searchParams: Promise.resolve({ session_id: invalid }) }));
  ok(!closed.includes("Open my report") && !closed.includes("Open the deal-it-yourself guide"), "invalid/unpaid purchase has no protected content links");
  session = old;
}
let body = { sessionId: session.id, topic: "Help me read the boards", timeZone: "Mountain Time", note: "", email: "attacker@example.test", name: "Spoof" };
for (const change of [{ payment_status: "unpaid" }, { status: "open" }, { metadata: { offer_slug: "blueprint-report" } }, { payment_status: "no_payment_required", amount_total: 0 }]) {
  const previous = session; session = { ...session, ...change };
  ok((await consultation(req("/api/consultation", body))).status === 403, "wrong tier/unpaid/incomplete refused");
  session = previous;
}
ok((await consultation(req("/api/consultation", body, { origin: "https://evil.test" }))).status === 403, "cross-origin refused");
ok((await consultation(req("/api/consultation", { ...body, topic: "x" }))).status === 400, "short topic refused");
ok((await consultation(req("/api/consultation", null))).status === 400, "null JSON refused");
ok((await consultation(req("/api/consultation", { ...body, note: "x".repeat(20_000) }))).status === 413, "body bound enforced");
emails.length = 0; emailFail = true;
ok((await consultation(req("/api/consultation", body))).status === 503 && emails.length === 0, "send failure cannot claim success");
emailFail = false;
const sent = await consultation(req("/api/consultation", body));
ok(sent.status === 200 && (await sent.json()).message === CONSULT_SUCCESS_COPY, "success only after provider acceptance");
ok(emails.length === 1 && emails[0].reply_to === "buyer@example.test" && !emails[0].text.includes("attacker@example.test"), "identity comes only from verified purchase");
ok(emails[0].text.includes(body.topic) && emails[0].text.includes(body.timeZone) && !emails[0].text.includes("1991-02-17"), "Cass gets topic/time zone without birthday");
ok((await consultation(req("/api/consultation", body))).status === 200 && emails.length === 1, "duplicate retry uses same provider idempotency key");
ok((await consultation(req("/api/consultation", { ...body, topic: "A changed request" }))).status === 503 && emails.length === 1, "changed duplicate gives recoverable error without new email");
// Legacy tokens retain their original slug and normal validation.
const legacy = await mintReportToken("legacy@example.test", "personal-card-blueprint", "cs_test_legacy_test", "1991-02-17");
ok((await verifyReportToken(legacy))?.slug === "personal-card-blueprint", "legacy token unchanged");
console.log(`PASS: ${checks} launch checks; real route handlers; synthetic Stripe and Resend only; no external calls, purchases or messages.`);
