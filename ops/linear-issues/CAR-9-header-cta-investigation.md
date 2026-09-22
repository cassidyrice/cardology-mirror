# CAR-9 investigation: header CTA was removed on purpose

Stopped before any header UI change. Linear: [CAR-9](https://linear.app/cardblueprints/issue/CAR-9/products-are-invisible-in-the-site-header).

## Finding

The missing header product action is **not an accident**. Two Cass-authored commits on 2026-09-04 removed it, and tests still pin the absence.

Do **not** restore `HeaderDeepDiveCta` or add a new header product link unless Cass explicitly reverses those decisions.

## Timeline

| Date | Commit | What happened |
|---|---|---|
| 2026-08-29 | `8ae16f9` *fix(conversion): … honest header Deep Dive* | Added `HeaderDeepDiveCta` (`placement="site-header"` / `source="site-header"`) to `SiteHeader`. |
| 2026-09-04 | `93b92c6` *Home: content front page …* | **Deliberately replaced** `HeaderDeepDiveCta` with `Get a Reading` → `/karma-reading`. Comment in the same commit: “home header now points to Reading Day.” Tests flipped to `expect(header).not.toContain("HeaderDeepDiveCta")`. |
| 2026-09-04 | `ad9dd4d` *Reading Day off: waitlist page, no CTAs* | **Deliberately removed** the Reading Day header button. File comment: “Reading Day CTA removed (S0).” Tests flipped to `expect(header).not.toContain("Get a Reading")`. |
| 2026-09-05 | `88be51b` *Audit A1: Cardology journey first* | Header nav reduced to Explore. Paid action stayed out. |

Current header (`57e8272`): Explore, YouTube, TikTok icon. No product.

## What still exists (unused)

- `components/seo/HeaderDeepDiveCta.tsx` — still the `site-header` funnel wrapper.
- `lib/deep-dive.ts` `DEEP_DIVE_SOURCES` still includes `"site-header"`.
- `DeepDiveCta` still has a compact `placement === "site-header"` path.
- **Nothing imports `HeaderDeepDiveCta`.** Tests only assert the file exists and that `SiteHeader` does **not** use it.

## Tests that would fail if this were reverted

- `scripts/calculator-deep-dive.test.ts`: `header` must not contain `HeaderDeepDiveCta` or `Get a Reading`.
- `scripts/site-navigation.test.ts`: shared header must not contain `Get a Reading`.

## Not done

- No UI change.
- Footer and homepage untouched.
- No merge, deploy, Stripe, or Cloudflare work.
- `docs/SITE-RECORD.md` and `~/cardblueprints-ops/plans/` were not in this environment.
- `bun run test` / `test:seo:browser` not run (no visitor-facing change).
