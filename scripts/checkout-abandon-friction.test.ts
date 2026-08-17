import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  analyticsMetadata,
  FUNNEL_COOKIE_NAME,
  funnelContextFromCookie,
  mergeFunnelContext,
} from "../lib/analytics";
import { birthdateFromCheckoutSession, sanitizeBirthdateISO } from "../lib/birthdate";
import { instantReportBySlug } from "../lib/products";

const analyticsSessionId = "ab119959-a913-4da6-9f50-a0378c613582";

assert.equal(sanitizeBirthdateISO("1990-05-15"), "1990-05-15");
assert.equal(sanitizeBirthdateISO("1990-02-30"), "");
assert.equal(sanitizeBirthdateISO("not-a-date"), "");
assert.equal(sanitizeBirthdateISO("1899-01-01"), "");

assert.equal(
  birthdateFromCheckoutSession({ metadata: { birthdate: "1991-07-04" } }),
  "1991-07-04",
);
assert.equal(
  birthdateFromCheckoutSession({
    metadata: {},
    custom_fields: [{ key: "birthdate", text: { value: "1988-12-01" } }],
  }),
  "1988-12-01",
);
assert.equal(
  birthdateFromCheckoutSession({
    metadata: { birthdate: "1991-07-04" },
    custom_fields: [{ key: "birthdate", text: { value: "1988-12-01" } }],
  }),
  "1991-07-04",
);
assert.equal(FUNNEL_COOKIE_NAME, "cb_funnel_v1");

assert.deepEqual(
  funnelContextFromCookie(
    encodeURIComponent(
      JSON.stringify({
        sessionId: analyticsSessionId,
        landingPath: "/birth-card-calculator",
        referrerHost: "www.google.com",
        trafficChannel: "organic",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
      }),
    ),
  ),
  {
    sessionId: analyticsSessionId,
    landingPath: "/birth-card-calculator",
    referrerHost: "www.google.com",
    trafficChannel: "organic",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
  },
);

assert.deepEqual(
  mergeFunnelContext(
    { sessionId: "", landingPath: "", trafficChannel: "unknown" },
    {
      sessionId: analyticsSessionId,
      landingPath: "/birth-card-calculator",
      trafficChannel: "organic",
    },
    {
      path: "/checkout/personal-card-blueprint",
      offerSlug: "personal-card-blueprint",
    },
  ),
  {
    sessionId: analyticsSessionId,
    landingPath: "/birth-card-calculator",
    referrerHost: undefined,
    trafficChannel: "organic",
    utmSource: undefined,
    utmMedium: undefined,
    utmCampaign: undefined,
    path: "/checkout/personal-card-blueprint",
    offerSlug: "personal-card-blueprint",
  },
);

assert.deepEqual(
  analyticsMetadata({
    sessionId: analyticsSessionId,
    landingPath: "/birth-card-calculator",
    path: "/checkout/personal-card-blueprint",
    offerSlug: "personal-card-blueprint",
    trafficChannel: "organic",
  }),
  {
    analytics_session_id: analyticsSessionId,
    analytics_landing_path: "/birth-card-calculator",
    analytics_traffic_channel: "organic",
    analytics_path: "/checkout/personal-card-blueprint",
    analytics_offer: "personal-card-blueprint",
  },
);

const sessionRoute = readFileSync("app/checkout/[offer]/session/route.ts", "utf8");
assert.match(sessionRoute, /sharedMeta\.birthdate/);
assert.match(sessionRoute, /status=need-date/);
assert.match(sessionRoute, /funnelContextFromCookie/);
assert.match(sessionRoute, /sanitizeBirthdateISO/);
assert.doesNotMatch(sessionRoute, /YYYY-MM-DD/);
assert.doesNotMatch(sessionRoute, /custom_fields/);
assert.doesNotMatch(sessionRoute, /console\.(log|info|debug)\([^)]*birthdate/i);

const continueForm = readFileSync(
  "components/checkout/CheckoutContinueForm.tsx",
  "utf8",
);
assert.match(continueForm, /disabled=\{pending\}/);
assert.match(continueForm, /getCheckoutAnalyticsFields/);
assert.match(continueForm, /type="date"/);
assert.match(continueForm, /needsBirthdate/);

const reviewPage = readFileSync("app/checkout/[offer]/page.tsx", "utf8");
assert.match(reviewPage, /needsBirthdate=\{isReport\}/);
assert.match(reviewPage, /plus applicable tax/);
assert.match(reviewPage, /Wrong date, duplicate charge/);

const birthCalc = readFileSync(
  "components/seo/BirthCardCalculator.tsx",
  "utf8",
);
assert.doesNotMatch(birthCalc, /bd=\$\{encodeURIComponent\(birthdate\)\}/);
assert.match(birthCalc, /storeCheckoutBirthdate/);
assert.match(birthCalc, /instantReportBySlug/);

const pcb = instantReportBySlug("personal-card-blueprint");
assert.ok(pcb);
assert.equal(pcb.price, 13);
assert.equal(pcb.priceLabel, "$13");

console.log(
  "PASS: checkout abandon friction — birthdate sanitize, funnel cookie merge, session route prefill, continue single-flight, PCB price source",
);
