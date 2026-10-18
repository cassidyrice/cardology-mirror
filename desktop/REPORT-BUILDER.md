# Local report builder

Open `dist/My Card Blueprint Reports-darwin-arm64/My Card Blueprint Reports.app`.

1. Choose **The Chemistry Check** (2 people), **Your 12-Month Timing Map** (3 people), or **The Family Snapshot** (4 people).
2. Enter each person's actual name, birth date, and relationship to the buyer. The startup example is fictional; replace all its people. The reading date starts the 12-month report window.
3. Select **Update preview**. Use the page selector to review the entire report.
4. Export **Engine JSON** to inspect the calculated facts. **Writing** provides four fields with the section names from the current offer listings, plus optional notes. Your writing becomes separate pages next to the relevant section. The sourced patterns and calculated tables remain intact.
5. Update the preview after edits. Exports are disabled while the preview is stale. Mark the review checkbox when you have reviewed the writing, cards, and dates; substantive edits clear it again.
6. Save a draft to continue later. Export HTML for a standalone offline document, or **Save PDF** for a native Mac save dialog. These actions do not send anything to customers.

The sample PDF in `reports/sample-reading.pdf` contains fictional people and is a preparation draft, not a completed personal reading.

## Calculation and content

The reference is `/Users/rice/Downloads/HOW-TO-BUILD-A-READING.md`, supplemented by the three offer description images and the sample Timing Map PDF in Downloads. The original cloud `make.py` and `stan/gen.py` were not available locally. This implementation follows the supplied workflow using the existing source engine; no binary decompilation or REA analysis was needed.

`src/offer-model.mjs` uses the existing `buildProfessionalReading` adapter. Each person has current and upcoming birthday-year snapshots as needed to cover the complete 12 months. All annual walks, ruling anchors (including multiple ruling cards), Long Range, Environment, and Displacement come from the existing engine. Neptune continues through the eve of the next birthday, and leap birthdays use the adapter's February 28 anniversary rule. December 31, invalid dates, future births, and a reading date before any person's birth are explicitly rejected.

The engine export includes every person, cycle, visible period, identity card, exact cross-person identity match, identity-to-position appearance, intersecting identical birth-anchor period card, and sourced meaning used in the document. Connection windows are clipped to the report window. It does not infer relationship scores or outcomes. Freeform writing still needs the reader's factual review.

All four reports share the professional reference report's visual system (`scripts/professional-reading/render.ts`): paper `#eef3f8`, ink `#123a63`, bronze eyebrows, the ink top bar, the Life Spread brand lockup, `CARD BLUEPRINTS / <offer>` running heads, the FIXED / PATTERN / YOURS vocabulary with writing lines, bordered tables, and the system serif stack (Iowan Old Style, Palatino, Georgia). No font is embedded; `ui/fonts/` is kept only for the older navy-and-gold layout's license history. Card faces are the site's CC0 English-pattern deck (`ui/cards/`, license in `ui/cards/ATTRIBUTION.txt`), downscaled by `node prepare-card-faces.mjs` from `../public/share-cards/faces`; each face a report uses is embedded once as a data URL. No font server, image server, account, model, or API is needed at runtime.

The report structure, copy rules, and the three review passes behind them are in `REPORT-WRITING-REVIEW.md`. Section headings and part names still come from `OFFERS` in `src/offer-model.mjs`; the framing copy, position glosses, and reflection questions live in `src/offer-render.mjs`.

The **Professional reference report** option preserves the older single-person report. Version 1 drafts migrate into that option. Current offer drafts use version 2 and store inputs and writing only; calculations and report HTML are regenerated when opened.

## Local files and development

```sh
npm start
npm test
npm run package
```

Packaging reuses the locally cached Electron ZIP and uses the bundled Node 24 runtime when Node 26's ZIP reader stalls. Reports, QA output, source, and design references are excluded from the packaged app. The app is unsigned for local use.

The desktop source, card assets, tests, and documentation are tracked in Git. Dependencies, built JavaScript, packaged apps, and generated reports remain ignored. The desktop changes can be reviewed independently of the storefront's offer and price changes.

The repository's current `.github/workflows/deploy.yml` deploys production on a push to `main`. Publishing a feature branch or opening a draft PR does not trigger that workflow; merging to `main` does. Review and authorize that production step separately. Packaging or running this local app does not deploy the website or deliver reports to customers.

## Verification (integration checked 2026-10-18)

- `npm test`: 11 passing engine/report tests, including all supported birthdays, all 90 boards, leap dates, fixed cards, 12-month continuity, exact connection evidence, plain-text escaping, and draft migration.
- `node qa-report.mjs`: Playwright + installed Chrome, because the Browser plugin was unavailable. Desktop 1440×1000 and mobile 390×844, preview, writing, switching offers without losing writing, review status, engine export, draft round trip, stale export prevention, Joker errors, no overflow, no console errors, and no external report requests.
- `node qa-offer-layout.mjs`: every print section checked for overflow, page height, and footer collisions for all three offers, identical-family birthdays, and maximum-length writing. Fixtures contain 23, 17, 25, 34, and 56 pages respectively.
- `qa-report-native.mjs` assertions: native Electron save/open and PDF/HTML export, including file mode 0600, passed against the packaged executable using a dedicated test profile. Save/open dialogs are stubbed to select test paths; this checks the export handlers, not manual interaction with macOS dialogs.
- Desktop, mobile, and exported-report cover screenshots were inspected. Layout checks cover every page of the five fixtures; the source uses the system serif stack without embedding a font file in the report HTML.
- The integrated repository also passed `bun run test` and `bun run build` without changing storefront offers, prices, checkout, or deployment configuration.

## Visual verification ledger

The third review pass supersedes the earlier navy-and-gold design. All reports now share the professional reference report's paper, ink, and bronze visual system.

| Comparison | Reference and final result |
| --- | --- |
| App layout | Retained white/navy/teal desktop chrome, left editor, page toolbar, and document preview; added Details/Writing tabs for multiple people. |
| Typography | System serif stack for reports and system font for controls; no font file embedded in report HTML. |
| Palette | Paper `#eef3f8`, ink `#123a63`, bronze accents, and real card faces. |
| Brand and cover | Life Spread lockup, `CARD BLUEPRINTS / <offer>` running head, and the buyer's and other people's card faces. |
| Content | All three offer names and four section names transcribed from the supplied listing images. |
| Paper and footer | A4 paper with an ink top bar; footer positions and every fixture section checked in print. |
| Responsive behavior | Mobile controls wrap, editor stacks above preview, and the paper scales without horizontal overflow. |

Intentional differences: fictional sample people; full 12-month coverage rather than only the current birthday year; generated connection evidence and review record; writing placed on separate pages; A4 paper; title wrapping adapts to the available width. No overflow or footer overlap remains in the verified fixtures. Human review of each real client's writing and calculated facts remains required.
