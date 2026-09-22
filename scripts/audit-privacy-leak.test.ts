import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildGaSnippetHtml,
  buildGtagBootstrapSnippet,
  sanitizeGaEventParams,
  sanitizeGaPageLocation,
} from "../lib/ga4";
import {
  resolvePosthogHost,
  resolvePosthogKey,
  sanitizePosthogPageUrl,
  sanitizePosthogProperties,
} from "../lib/posthog";
import { PERSONAL_CHECKOUT_PATH } from "../lib/personal-checkout";
import { buildConsentDefaultSnippet } from "../lib/consent";

const iso = "1990-08-15";

assert.equal(
  sanitizeGaPageLocation(
    `https://cardblueprints.com/checkout/personal-card-blueprint?bd=${iso}`,
  ),
  "/checkout/personal-card-blueprint",
);
assert.equal(
  sanitizeGaPageLocation(
    `https://cardblueprints.com/birth-card-calculator?birthdate=${iso}&utm_source=google`,
  ),
  "/birth-card-calculator",
);
assert.equal(
  sanitizeGaPageLocation("/checkout/personal-card-blueprint?dob=2000-01-15"),
  "/checkout/personal-card-blueprint",
);
assert.doesNotMatch(sanitizeGaPageLocation(`/x?q=${iso}`), /\d{4}-\d{2}-\d{2}/);

const cleaned = sanitizeGaEventParams({
  placement: "calculator-form",
  bd: iso,
  dob: iso,
  birth_date: iso,
  note: `born ${iso}`,
});
assert.equal(cleaned.placement, "calculator-form");
assert.equal(cleaned.bd, undefined);
assert.equal(cleaned.dob, undefined);
assert.equal(cleaned.birth_date, undefined);
assert.equal(cleaned.note, undefined);

const boot = buildGtagBootstrapSnippet("G-25K69MTQ4L");
assert.match(boot, /consent',\s*'default'/);
assert.match(boot, /analytics_storage:\s*'denied'/);
assert.match(boot, /ad_storage:\s*'denied'/);
assert.match(boot, /allow_google_signals:\s*false/);
assert.match(boot, /allow_ad_personalization_signals:\s*false/);
assert.ok(
  boot.indexOf("consent") < boot.indexOf("config"),
  "consent defaults must precede config",
);

const worker = buildGaSnippetHtml("G-25K69MTQ4L");
assert.match(worker, /page_path: location\.pathname/);
assert.doesNotMatch(worker, /location\.search/);

const consent = buildConsentDefaultSnippet();
assert.match(consent, /analytics_storage:\s*'denied'/);

const birthCalc = readFileSync("components/seo/BirthCardCalculator.tsx", "utf8");
assert.doesNotMatch(birthCalc, /\?bd=/);
assert.match(birthCalc, /storeCheckoutBirthdate/);
assert.doesNotMatch(birthCalc, /buy\.stripe\.com\/[^"'\s]+\?/);

const compat = readFileSync("components/seo/CompatibilityCalculator.tsx", "utf8");
assert.doesNotMatch(compat, /\?bd=/);
assert.match(compat, /storeCheckoutBirthdate/);

const checkoutPage = readFileSync("app/checkout/[offer]/page.tsx", "utf8");
assert.doesNotMatch(checkoutPage, /bd\?:/);
assert.doesNotMatch(checkoutPage, /sanitizeBirthdateISO\(bd\)/);

const sessionRoute = readFileSync("app/checkout/[offer]/session/route.ts", "utf8");
assert.doesNotMatch(sessionRoute, /\?bd=/);
// cancel_url branches (the reading returns to its review page, where the tab
// still holds the date and the question draft) but must stay a clean path with
// no birthdate, question, or query payload on either branch.
assert.match(sessionRoute, /cancel_url: cancelUrl/);
assert.match(sessionRoute, /`\$\{SITE_URL\}\/checkout\/\$\{product\.slug\}`/);
assert.match(sessionRoute, /`\$\{SITE_URL\}\$\{DEEP_DIVE_REVIEW_PATH\}`/);
assert.doesNotMatch(sessionRoute, /cancelUrl[^\n]*question/);
assert.doesNotMatch(sessionRoute, /cancelUrl[^\n]*(\?|birthdate)/);

const layout = readFileSync("app/layout.tsx", "utf8");
assert.doesNotMatch(layout, /birthdate=\{birthdate\}/);
assert.doesNotMatch(layout, /calculator\?birthdate=/);

const analytics = readFileSync("components/analytics/AnalyticsCapture.tsx", "utf8");
assert.doesNotMatch(analytics, /document\.cookie = `\$\{FUNNEL_COOKIE\}/);

const gaBoundary = readFileSync(
  "components/analytics/GoogleAnalyticsBoundary.tsx",
  "utf8",
);
assert.match(gaBoundary, /readPrivacyConsent|PrivacyConsentGate|consent/);

const posthogBoundary = readFileSync(
  "components/analytics/PostHogBoundary.tsx",
  "utf8",
);
assert.match(posthogBoundary, /readPrivacyConsent/);
assert.match(posthogBoundary, /disable_session_recording:\s*true/);
assert.doesNotMatch(posthogBoundary, /phx_[A-Za-z0-9]{8,}/);
assert.doesNotMatch(
  readFileSync("lib/posthog.ts", "utf8"),
  /phx_[A-Za-z0-9]{8,}/,
);
assert.equal(
  sanitizePosthogPageUrl(
    `https://cardblueprints.com/birth-card-calculator?birthdate=${iso}&utm_source=google`,
  ),
  "https://cardblueprints.com/birth-card-calculator",
);
const posthogCleaned = sanitizePosthogProperties({
  $current_url: `https://cardblueprints.com/checkout/personal-card-blueprint?bd=${iso}`,
  placement: "calculator-form",
  email: "a@b.c",
  birth_date: iso,
  note: `born ${iso}`,
});
assert.equal(
  posthogCleaned.$current_url,
  "https://cardblueprints.com/checkout/personal-card-blueprint",
);
assert.equal(posthogCleaned.placement, "calculator-form");
assert.equal(posthogCleaned.email, undefined);
assert.equal(posthogCleaned.birth_date, undefined);
assert.equal(posthogCleaned.note, undefined);
assert.equal(
  sanitizePosthogProperties({
    distinct_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    $session_id: "11111111-2222-3333-4444-555555555555",
    token: "phc_sfewE8AhhqBfV8vCkMtjMRqdvoDvbeG3ygkZCTTBKVZ5",
  }).distinct_id,
  "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
);
assert.match(resolvePosthogKey("not-a-key"), /^phc_/);
assert.equal(resolvePosthogHost("https://us.i.posthog.com/"), "https://us.i.posthog.com");

assert.equal(PERSONAL_CHECKOUT_PATH, "/checkout/personal-card-blueprint");

// Period tools stay in the browser. A period-change email would need the
// birthday stored, which /privacy-policy and the calculator microcopy forbid.
const yearView = readFileSync("components/seo/YourYearView.tsx", "utf8");
assert.doesNotMatch(yearView, /TODO\(privacy\)/);
assert.doesNotMatch(yearView, /type="email"/);
assert.doesNotMatch(yearView, /free-course\/signup|buttondown\.com/);
assert.match(yearView, /Your birthday is never stored on our servers/);

console.log("PASS: audit privacy leak — no birth dates in URLs or GA locations");
