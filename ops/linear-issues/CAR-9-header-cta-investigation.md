# CAR-9: quiet header action

Cass reversed the first-pass stop: the missing product action was **not** a decision to keep. This PR restores one quiet header treatment.

## Treatment

- Single `HeaderDeepDiveCta` in `SiteHeader` (`source="site-header"`).
- Paper-button outline, not oxblood. Oxblood stays on the calculator / product-page conversion.
- Short label `Ask — $13` below `sm`; full `Ask your question — $13` from 640px up.
- Lands on `/checkout/deep-dive` and stores `site-header` for `growth-report.sh`.
- 360px: wordmark shrinks, TikTok hides below 420px, action stays on one row.

## Not changed

Footer, homepage body, Stripe, Cloudflare. No merge, no deploy.
