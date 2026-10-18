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

Report HTML and PDF use navy `#0b1430`, gold `#d9b968` / `#e6c675`, suit dividers, and Cormorant Garamond embedded directly in the document. The font's OFL license is in `ui/fonts/OFL.txt`. Card faces are the site's CC0 English-pattern deck (`ui/cards/`, license in `ui/cards/ATTRIBUTION.txt`), downscaled by `node prepare-card-faces.mjs` from `../public/share-cards/faces`; each face a report uses is embedded once as a data URL. No font server, image server, account, model, or API is needed at runtime.

The report structure, copy rules, and the two review passes behind them are in `REPORT-WRITING-REVIEW.md`. Section headings and part names still come from `OFFERS` in `src/offer-model.mjs`; the framing copy, position glosses, and reflection questions live in `src/offer-render.mjs`.

The **Professional reference report** option preserves the older single-person report. Version 1 drafts migrate into that option. Current offer drafts use version 2 and store inputs and writing only; calculations and report HTML are regenerated when opened.

## Local files and development

```sh
npm start
npm test
npm run package
```

Packaging reuses the locally cached Electron ZIP and uses the bundled Node 24 runtime when Node 26's ZIP reader stalls. Reports, QA output, source, and design references are excluded from the packaged app. The app is unsigned for local use.

The desktop folder was already excluded by this checkout's `.git/info/exclude`; all changes remain local. No website, offer price, checkout, deployment, or customer delivery was changed.

## Verification

- `npm test`: 11 passing engine/report tests, including all supported birthdays, all 90 boards, leap dates, fixed cards, 12-month continuity, exact connection evidence, plain-text escaping, and draft migration.
- `node qa-report.mjs`: Playwright + installed Chrome, because the Browser plugin was unavailable. Desktop 1440×1000 and mobile 390×844, preview, writing, switching offers without losing writing, review status, engine export, draft round trip, stale export prevention, Joker errors, no overflow, no console errors, and no external report requests.
- `node qa-offer-layout.mjs`: every print section checked for overflow, page height, and footer collisions for all three offers, identical-family birthdays, and maximum-length writing. Fixtures contain 18, 11, 21, 34, and 52 pages respectively.
- `node qa-report-native.mjs`: native Electron save/open and PDF/HTML export, including file mode 0600. Also run against the actual packaged executable.
- Final PDF rendered with Poppler; every page inspected in a contact sheet and the cover and dense pages checked at higher resolution. Font inventory confirms embedded Cormorant Garamond.

## Visual verification ledger

The user-supplied guide and navy-and-gold PDF supersede the initial light-blue report concept in `design/report-concept.png`.

| Comparison | Reference and final result |
| --- | --- |
| App layout | Retained white/navy/teal desktop chrome, left editor, page toolbar, and document preview; added Details/Writing tabs for multiple people. |
| Typography | Embedded Cormorant Garamond in the report, system font for controls; checked both preview and PDF. |
| Palette | Navy and gold match the guide; red suits use a muted coral from the supplied PDF. |
| Brand and cover | MY CARD BLUEPRINT wordmark, suit row, personal cards, and suit dividers checked against the sample cover. |
| Content | All three offer names and four section names transcribed from the supplied listing images. |
| Paper and footer | A4 with navy to the page edge; footer positions and every report section checked in print. |
| Responsive behavior | Mobile controls wrap, editor stacks above preview, and the paper scales without horizontal overflow. |

Intentional differences: fictional sample people; full 12-month coverage rather than only the current birthday year; generated connection evidence and review record; writing placed on separate pages; A4 paper; title wrapping adapts to the available width. Above-the-fold copy is limited to the implemented report workflow, with the original report's cover replaced by the user's supplied offer reference. No material clipping or layout mismatch remains in the verified fixtures.
