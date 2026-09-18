# Birthday and compatibility price alignment

Published September 17, 2026 following the user instruction to point these pages to the $13 offer.

- Worker: `cardology-unlock`
- Live version: `7bcb1504-572f-4a9c-9334-5bd9941bbe9d`
- Previous version: `da24f699-4b1f-4473-a218-82a8eff38988`
- Local source: `/Users/main/cardblueprints-content/ops/seo-multi-agent/wave3-impl/cardology-unlock-bundle`, commit `c52a5d5`.
- Source was recovered from the exact live deployment, including its HTML module; preserved backup was not edited.
- Only six literal `$47` to `$13` replacements in the deployed JavaScript. All links retain `/products/one-question-reading`. No checkout or payment logic changed.
- Deployed script SHA256: `d4c51ca131d98c30a7af36cc6d6f8d7c5261ed518403e4252b5dc4ccdb03a83b`.
- Attached patch applies to the retrieved previous live script SHA256 `30fb9a3901573e397612685754945b31f816a40c3841a8952f4e46b4e42eb614`.
- Syntax, existing offer guard, dry run and seven local HTTPS page checks passed before release. Existing resource bindings, secret names and runtime configuration are preserved.
- No main Pages application redeploy; it remains at `999dfe6`.
- Evidence: `/Users/main/cardblueprints-ops/outputs/price-alignment-2026-09-17/`.

Current public product page and checkout review page advertise $13. No purchase or Stripe price mutation was made as part of this label/link alignment.
