# Card Blueprints writing completion and local QA

Completed on 2026-09-30 in the isolated Mac checkout at `/Users/main/Documents/Codex/2026-09-30/task/card-app-local`.

## Delivered writing

- 364 unique card × planet period readings, covering 52 cards and seven periods, with 93,306 words in their long-reading fields (163–452 words per entry). Every original depth band passes: 84 Ace/Six/Nine entries at 400–600, 84 Two/Four/Ten entries at 250–350, and 196 others at 150–250.
- 260 yearly-card readings, one for every card in each of the five yearly positions. Environment and Displacement copy is selected only when the existing engine assigns those positions.
- Seven chapter introductions and closing reflections, 56 notification variants across seven planets/four moments/two voices, 18 reviewed connective clauses, onboarding/integrity/share copy and an editorial style guide. Runtime prerequisites are stated; these assets do not send notifications.
- Stable-key JSON sources, combined `period-artifacts.json`, JSON schema, editable `MANUSCRIPT.md`, readable offline `MANUSCRIPT.html`, preserved source copies and a synthetic engine-derived example.

The writing is AI assisted and was independently reviewed by another AI editor. It offers symbolic reflection and practical choices. Card assignments and dates come from the existing engine; text asserts no scientific prediction. The original report and newer voice guidance are preserved under `content/period-library/sources/`.

## Content QA

`bun scripts/validate-period-library.ts` passed: 364 distinct pairs, complete fields, required word lengths, 260 yearly entries, 56 notifications and seven chapters. It found zero missing pairs, duplicate long paragraphs, card/planet-name-masked template paragraphs, duplicate short fields or repeated fourteen-word passages. Two flagged uses of “treatment” refer to handling a draft/idea, not medical treatment. The final four suit hashes match `qa/automated-report.json`.

The independent editor read all 364 omen/shadow/practice sets, all 84 court person/posture clauses, 40 complete readings spanning every suit and planet and difficult Saturn combinations, 20 complete yearly readings spanning all five roles/four suits, plus all 56 notification pairs. Required revisions were verified; no editorial blocker remains. Exact samples, corrections and limits are in `content/period-library/qa/editorial-review.md`. This was not a line edit of all 364 long readings or all 260 yearly readings.

## App and export QA

- `bun run test` passed every stage: six reported test groups with 393 passing tests and zero failures, plus the suite's integration, privacy and sitemap checks. The first sandbox run could not bind a temporary mock server; the authorized full rerun with local socket access passed. The suite uses synthetic Stripe/Resend data and local mock services.
- `bunx tsc --noEmit --incremental false` passed. `bun run build` passed with Next's existing informational Edge-runtime/static-generation warning. `git diff --check` passed. Standalone `next lint` is not configured and was not run; the production build performed its built-in lint/type validity step.
- In the user's Mac Codex in-app browser, the 2026-09-30 public sample showed the selected Six of Clubs/Venus reading. Its full text opened. Next/current navigation reset it to the correct reading; keyboard Enter reopened it; This year/Period and More cards/People/back worked. The original People experience remains accessible. The viewport had no horizontal overflow at 320, 390 or 1280 pixels and reported no browser console errors.
- A synthetic signed local app token opened the new reading; an invalid token showed the invalid-link page and no reading. Automated tests covered 52 birth-card selections and birthday/leap-day/age-cycle boundaries. A browser-supplied `?date=` is intentionally synchronized back to the Mac's current local calendar date; the boundary cases were verified by tests rather than claimed as manually viewed.
- The manuscript's live browser showed 364 period entries, 91 per suit, 52 per planet, 260 yearly entries and supporting copy. Search, empty result, reset and filters worked at 320, 390 and 1280 pixels without overflow or console errors. The ZIP downloaded in the Mac browser and matched the source SHA-256 exactly.
- The 28-member ZIP passed archive CRC and byte-for-byte comparison against every source. SHA-256: `fa98b56b77183bf8a9c811597212aedf81c084b75d7c56c5763a04de55c3d1d3`. The bundle contains the automated and editorial reports. The present QA status file sits beside the project so the verified ZIP remains unchanged during delivery.

## Local review and release boundary

Readable manuscript: `http://127.0.0.1:3590/`  
Verified ZIP: `http://127.0.0.1:3590/card-blueprints-writing.zip`  
App sample: `http://127.0.0.1:3589/products/card-blueprint-app`

The local servers bind to `127.0.0.1`; their availability depends on the Mac session continuing. The app remains off sale. No canonical integration, push, deployment, pricing, Stripe or subscription change was made. Before public release, a maintainer must review the final copy and local app changes, integrate into the canonical checkout through its normal review path, rerun gates there and decide separately on release. The optional DOCX was not generated because the delegated workspace document dependency loader is unsupported; editable Markdown and HTML are supplied. Native Library delivery is being handled by a separate read-only delivery diagnostic and is not claimed here.
