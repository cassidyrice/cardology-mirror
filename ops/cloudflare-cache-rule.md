# Cloudflare cache rule

The `cardblueprints.com` zone has one active Cache Rule named
`Cache prerendered SEO pages`. It makes only known public, clean-URL SEO
responses eligible for Cloudflare's cache. The response must still provide a
cacheable `Cache-Control` header, so `public/_headers` remains the source of
truth for Next/Pages TTLs and the external Worker remains in control of its own
TTLs.

## Match expression

```text
(http.host eq "cardblueprints.com" and http.request.method in {"GET" "HEAD"} and http.request.uri.query eq "" and not has_key(http.request.headers, "rsc") and (http.request.uri.path in {"/" "/about" "/videos" "/readings" "/try" "/blog" "/birth-card" "/birth-card-calculator" "/52-day-period-meaning-tool" "/birth-card-compatibility-calculator" "/cardology-compatibility" "/what-is-cardology" "/cartomancy-vs-tarot" "/how-to-read-playing-cards" "/playing-card-spreads" "/52-card-astrology-explained" "/birth-card-vs-ruling-card" "/methodology" "/editorial-policy" "/contact" "/shadow-karma-guide" "/privacy-policy" "/refund-policy" "/terms-of-service" "/robots.txt" "/sitemap.xml" "/feed.xml" "/born-on" "/compatibility" "/sitemap-cardology.xml" "/sitemap-compatibility.xml"} or starts_with(http.request.uri.path, "/birth-card/") or starts_with(http.request.uri.path, "/blog/") or starts_with(http.request.uri.path, "/playing-card-spreads/") or starts_with(http.request.uri.path, "/born-on/") or starts_with(http.request.uri.path, "/compatibility/")))
```

## Settings

- Cache eligibility: `Eligible for cache`
- Edge TTL: `Use cache-control header if present, bypass cache if not`
- All other settings: platform defaults

The empty-query and absent-`RSC` checks prevent App Router component responses
from sharing the HTML cache key. App, checkout, API, and date-sensitive routes
are outside the path whitelist. Do not replace this with a zone-wide "cache
everything" rule.

## Verification

After a production deploy, request a canonical card page twice from the same
Cloudflare location. The first response should be `MISS` (or `EXPIRED`) and the
second should be `HIT`, with the one-day `s-maxage` from `public/_headers`.
`/access`, `/card-of-the-day`, and a request containing `?_rsc=...` must remain
`DYNAMIC`.
