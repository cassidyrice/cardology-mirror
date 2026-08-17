import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildGaSnippetHtml,
  buildGtagBootstrapSnippet,
  sanitizeGaEventParams,
  sanitizeGaPageLocation,
} from "../lib/ga4";
import { PERSONAL_CHECKOUT_PATH } from "../lib/checkout-birthdate";
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
assert.match(birthCalc, /prefetch=\{false\}/);
assert.match(birthCalc, /PERSONAL_CHECKOUT_PATH|personalCheckoutHref/);

const compat = readFileSync("components/seo/CompatibilityCalculator.tsx", "utf8");
assert.doesNotMatch(compat, /\?bd=/);
assert.match(compat, /storeCheckoutBirthdate/);

const checkoutPage = readFileSync("app/checkout/[offer]/page.tsx", "utf8");
assert.doesNotMatch(checkoutPage, /bd\?:/);
assert.doesNotMatch(checkoutPage, /sanitizeBirthdateISO\(bd\)/);

const sessionRoute = readFileSync("app/checkout/[offer]/session/route.ts", "utf8");
assert.doesNotMatch(sessionRoute, /\?bd=/);
assert.match(sessionRoute, /cancel_url: `\$\{SITE_URL\}\/checkout\/\$\{product\.slug\}`/);

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

assert.equal(PERSONAL_CHECKOUT_PATH, "/checkout/personal-card-blueprint");

console.log("PASS: audit privacy leak — no birth dates in URLs or GA locations");
