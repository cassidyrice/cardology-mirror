# Compatibility Offer Alignment Design

## Objective

Make the Worker-rendered `/compatibility/` SEO library congruent with the current Card Blueprints homepage offer. Phone-reading products are retired and must not appear on public compatibility pages.

## Scope

The change applies to the shared presentation used by:

- `/compatibility/`
- the 52 `/compatibility/<card>` hubs
- the 1,378 `/compatibility/<card>-and-<card>` pairing pages

The Worker bundle is maintained separately from the Next.js application. The recovered bundle is available at `/Users/main/cardblueprints-content/ops/seo-multi-agent/wave3-impl/cardology-unlock-bundle/cardology-unlock-index.js`; it is not the original Worker source and must not be deployed without explicit approval.

## Content Design

The shared header CTA will become “Get Your Personal Blueprint — $13” and link to `/products/personal-card-blueprint`.

The shared promotional block will:

- describe the Personal Card Blueprint as an instant personalized written report built from a birth date;
- use “Get Your Personal Blueprint — $13” as the primary CTA;
- use the free compatibility calculator at `/birth-card-compatibility-calculator` as the secondary CTA;
- contain no phone number, calling instruction, voice-reading claim, trial offer, or retired phone-product language.

Compatibility-specific editorial content remains unchanged.

## SEO Requirements

- Preserve every compatibility URL and canonical URL.
- Preserve the existing page titles, descriptions, crawl directives, internal card links, breadcrumbs, CollectionPage data, FAQ data, and ItemList data.
- Do not redirect or noindex the compatibility index or its child pages.
- Keep the CTA relevant to search intent by pairing the paid Blueprint action with the free compatibility calculator.

## Verification

- Run a static regression scan against the compatibility rendering surface for the retired phone number and phone-offer phrases.
- Assert the new Blueprint URL and $13 CTA appear in the shared header and promotional block.
- Render or exercise the compatibility index, one card hub, and one pair page if the recovered bundle exposes a safe local test path.
- Confirm unrelated phone constants used for historical paid-order fulfillment in the Next.js application remain untouched.

## Deployment Boundary

Implementation may patch and verify the recovered Worker bundle locally. Production deployment requires separate explicit approval because the bundle documentation warns that bindings and secrets live only in Cloudflare and the original source is unavailable.
