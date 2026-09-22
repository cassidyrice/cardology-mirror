# Site record

This file is the in-repo home for §3. It is not a reconstruction of the 2026-09-21 audit. Palette tracking stays in `docs/CAR-13-palette-migration.md`. The Checkout session-field warning stays in `docs/SECURITY.md`.

## 3. Stripe webhooks

The legacy `cardology-unlock` Worker still serves `POST /webhook/stripe` (Cloudflare route `cardblueprints.com/webhook/stripe*` in `ops/cardology-unlock-routes.jsonc`; an unsigned POST still answers `400` `bad signature`), and that URL was intentionally left unregistered in Stripe on 2026-09-19, when only `https://cardblueprints.com/api/checkout/webhook` was updated to accept `checkout.session.async_payment_succeeded`. Registering a Stripe endpoint for `/webhook/stripe` would send those same Checkout events to the Worker as well as to Pages and double-fire fulfilment. The Worker source is a separate repo and was not changed; the handler is still live, so this note does not call for deleting it.
