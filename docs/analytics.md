# Card Blueprints funnel analytics

Card Blueprints uses two privacy-conscious Cloudflare layers:

- Cloudflare Web Analytics for page traffic and Core Web Vitals.
- Workers Analytics Engine dataset `cardblueprints_funnel` for conversion
  events.

The custom stream records pseudonymous, tab-scoped funnel IDs in
`sessionStorage`. It does not use analytics cookies and does not store names,
email addresses, phone numbers, birthdays, calculated cards, full referrer
URLs, arbitrary query strings, IP addresses, user agents, access codes, or
Stripe session tokens.

## Events

| Event | Meaning | Source of truth |
| --- | --- | --- |
| `organic_landing` | A session arrived from a recognized search engine or `utm_medium=organic` | Browser landing |
| `calculator_started` | First calculator interaction per placement in the tab | Browser interaction |
| `calculator_completed` | A valid result was calculated | Browser calculation |
| `readings_viewed` | The paid-reading comparison page was viewed | Browser route |
| `offer_selected` | A valid checkout review page was viewed | Browser route |
| `checkout_started` | Stripe returned a usable Checkout Session URL | Server checkout route |
| `purchase_completed` | A signed Stripe webhook confirmed paid or no-payment-required completion | Stripe webhook |

A free-call click is intent, not proof that the call connected. Call-start and
call-completion events require a separate lifecycle signal from the voice or
telephony provider.

## Analytics Engine columns

The ordered fields written by `lib/analytics-server.ts` are:

| Column | Meaning |
| --- | --- |
| `index1` | Traffic channel |
| `blob1` | Event name |
| `blob2` | Anonymous tab session ID |
| `blob3` | Event ID; Stripe webhook events use the Stripe event ID |
| `blob4` | Current path |
| `blob5` | Landing path |
| `blob6` | Referrer hostname only |
| `blob7` | Traffic channel |
| `blob8` | UTM source |
| `blob9` | UTM medium |
| `blob10` | UTM campaign |
| `blob11` | Offer slug |
| `blob12` | CTA placement |
| `blob13` | Outcome |
| `blob14` | Currency |
| `blob15` | Browser or server source |
| `blob16` | Cloudflare Pages branch |
| `blob17` | Cloudflare Pages commit |
| `double1` | Value in cents |
| `double2` | Schema version |

Analytics Engine retains data for three months. Query it through Cloudflare's
SQL API with an API token limited to `Account Analytics: Read`.

## Useful queries

Event counts over the last 30 days:

```sql
SELECT
  blob1 AS event_name,
  count(DISTINCT blob3) AS unique_events,
  count(DISTINCT blob2) AS sessions
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob16 = 'main'
GROUP BY event_name
ORDER BY unique_events DESC
```

Organic funnel totals:

```sql
SELECT
  blob1 AS event_name,
  count(DISTINCT blob2) AS organic_sessions
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob7 = 'organic'
  AND blob16 = 'main'
GROUP BY event_name
```

Offer performance:

```sql
SELECT
  blob11 AS offer_slug,
  blob1 AS event_name,
  count(DISTINCT blob2) AS sessions,
  count(DISTINCT blob3) AS unique_events,
  sum(_sample_interval * double1) / 100 AS value_usd
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob11 <> ''
  AND blob16 = 'main'
GROUP BY offer_slug, event_name
ORDER BY offer_slug, event_name
```

Analytics Engine does not support joins and may sample high-volume data. The
event-ID distinct count prevents Stripe webhook retries from inflating the
purchase total. Keep the `blob16 = 'main'` filter in production reports so
preview and QA traffic do not enter the live funnel.

## Metric cutover — 2026-08-01

`trackClientFunnelEventOnce` now keys its once-guard on **event name +
`blob12` placement**, not the event name alone. Before this change the first
placement to fire an event in a tab silently suppressed every other placement
for the rest of that tab, so per-placement counts were undercounted by an
unknown amount and CTA comparisons were not meaningful.

`calculator_completed` is also now non-once on the search-prefill path,
matching the form path and the per-calculation definition above.

When comparing across this date, split on `blob12` and count DISTINCT `blob2`
sessions rather than raw event totals. Pre-cutover per-placement series are
not comparable to post-cutover ones.
