# The Analog Algorithm Visual Redesign

**Date:** 2026-08-08  
**Status:** Approved visual direction; implementation not started  
**Product:** The Analog Algorithm by Cassidy Rice  
**Brand:** Card Blueprints  
**Source project:** `~/cardblueprints-content/ebooks/analog-algorithm/`

## 1. Goal

Rebuild the existing 71-page PDF as a polished paid e-book that visibly belongs to `cardblueprints.com`, explains the deterministic mechanics clearly, and is ready for a later manuscript-verification and launch pass.

This stage redesigns the cover, page system, diagrams, worksheets, and production structure. It does not silently rewrite the book's claims or make the product publicly purchasable.

## 2. Approved direction

The approved system combines three selected visual directions:

1. **Cover B — Algorithmic Atlas**
   - Diagram-forward technical cover.
   - Warm paper rather than the existing dark felt cover.
   - The title, formulas, and central 52-position system graphic communicate the book's mechanical promise immediately.
2. **Interior B1 — Essay + Technical Rail**
   - A calm, readable narrative column.
   - A right-side rail for formulas, claim labels, worked values, legends, and miniature diagrams.
   - Full-width plates remain available when a concept cannot be explained clearly in the rail.
3. **Diagram D1 — Precision Grid**
   - Thin coordinate lines, numbered nodes, consistent legends, and one oxblood focal path.
   - Diagrams behave like instrument drawings rather than decoration.

Supporting patterns are deliberately limited:

- Use **B2 Full Visual Plate** for approximately 8–12 concepts that need a full-page visual explanation.
- Use **B3 Modular Field Notes** only for worksheets, quick-reference pages, and formula sheets.
- Borrow recognizable card tiles from **D2 Card Map** only when card identity matters.
- Use **D3 Layered Flow** only for the birth-card lookup, annual-permutation overview, and nine-card extraction process.

## 3. Current-state findings

The existing build is real and valuable, but it is not a launch candidate:

- `out/The-Analog-Algorithm-FULL.pdf` contains 71 PDF pages.
- The first 38 pages come from the main build; later supplements restart their displayed page numbering.
- Ten pages contain only the running header and footer: PDF pages 4, 9, 17, 23, 25, 28, 31, 33, 35, and 37.
- The table of contents has no resolved page numbers.
- The cover uses a dark felt, gold, and oxblood treatment that no longer matches the live cream-paper website.
- Part openers are extremely pale and low contrast.
- The base manuscript uses Times and Helvetica; supplements use slightly different sizing and rhythm.
- Page 32 still prints literal spread placeholders instead of diagrams.
- Retired phone/voice-reading material remains in the book, including the phone number, `/readings`, Season Pass language, and AI voice-reading references.
- The merged PDF loses useful title/author metadata and reports `pypdf` as its producer.
- The source is split across one main script and six supplement scripts rather than one coherent document architecture.

The redesign must preserve usable manuscript material while removing these production defects.

## 4. Brand system

### 4.1 Palette

Use the live Card Blueprints paper identity:

| Token | Value | Use |
|---|---:|---|
| Paper | `#f6f1e8` | Primary page and cover field |
| Paper deep | `#efe8dc` | Rails, callouts, worksheet fields, quiet panels |
| Ink | `#14110d` | Primary text and structural rules |
| Oxblood | `#8e321f` | Focal paths, active nodes, claim accents, short rules |
| Brown | `#71551f` | Kicker text, secondary labels, quiet metadata |
| Structural line | `#d7cdbd` | Grids, dividers, table rules |

Rules:

- Do not return to a black or dark-felt cover.
- Oxblood is a focal color, not a page-filling background except for small controlled modules.
- Dot-grid texture may appear on the cover, part openers, and selected plates at low contrast. It must not reduce body-text clarity.
- Do not introduce neon, generic occult gradients, faux parchment edges, or glossy 3D card art.

### 4.2 Logo

- Use the approved lowercase `card blueprint` wordmark with the oxblood plexus/network mark.
- Keep the logo compact and quiet on the cover, title page, copyright page, and running matter.
- Montserrat is reserved for the wordmark; it is not the book's body or heading typeface.

### 4.3 Typography

Embed fonts so the PDF renders consistently on every device:

| Role | Typeface | Target size |
|---|---|---:|
| Cover and part titles | Source Serif 4 | 34–48 pt |
| Chapter titles | Source Serif 4 | 24–28 pt |
| Section headings | Source Serif 4 Semibold | 15–18 pt |
| Body | Source Serif 4 | 10.75–11 pt with 15–16 pt leading |
| Utility labels and captions | Inter | 7.5–9 pt |
| Formulas and coordinates | Source Code Pro | 8–10 pt |
| Logo wordmark | Montserrat | As required by the existing asset |

Rules:

- Body text remains serif-led and book-like.
- Utility labels use restrained uppercase tracking.
- Formula type must support the required mathematical and suit glyphs without substitution boxes.
- No essential text may be smaller than 7.5 pt.

## 5. Page architecture

### 5.1 Format

- Retain US Letter (`8.5 × 11 in`) for screen reading and home printing.
- Use approximately `0.75 in` left/right margins and enough bottom clearance for the footer.
- The default content grid is `5.2 in` main text + `0.25 in` gutter + `1.55 in` technical rail.
- Full-width figures and tables may span the full `7 in` live width.
- Do not force part or chapter starts onto odd pages in the digital edition; that behavior caused the current header-only pages.

### 5.2 Running matter

- Use one thin ink rule at the top.
- Left: `The Analog Algorithm`.
- Right: current part/chapter label and continuous PDF page number.
- Use a quiet bottom rule with `cardblueprints.com` only where it does not compete with worksheets.
- Cover, title, copyright, and part-opener pages do not use the standard running header.

### 5.3 Page types

1. **Cover**
   - Cream dot-grid field.
   - Compact wordmark and edition code in the top band.
   - Large two-line title.
   - Central 52-position circular/grid graphic.
   - Four short mechanical facts near the foot.
   - Author and publisher at the bottom.
2. **Title and copyright**
   - Minimal title page.
   - License, disclaimer, edition, URL, and metadata consolidated without a decorative CTA.
3. **Table of contents**
   - Generated page numbers and clickable entries.
   - Four parts visually separated with oxblood rules and quiet utility labels.
4. **Part opener**
   - Strong contrast, large serif title, one meaningful system graphic, and a compact chapter index.
   - No nearly invisible cream-on-white typography.
5. **Default chapter page (B1)**
   - Narrative in the main column.
   - Technical rail for formula, claim status, examples, and mini-diagrams.
6. **Full visual plate (B2)**
   - One central diagram with a title, short explanatory copy, legend, and caption.
7. **Worksheet/reference page (B3)**
   - Modular but restrained; optimized for printing and handwriting.
8. **End matter**
   - Glossary, further study, author note, license, and current Card Blueprints paths only.

## 6. Diagram system

### 6.1 House rules

Every figure must:

- Teach one mechanical relationship.
- Be vector-first wherever possible.
- Include a figure number, specific title, legend when needed, and one-sentence caption.
- Use structural lines between `0.35–0.6 pt` and oxblood focal lines around `1.5–2 pt`.
- Use coordinates or position numbers consistently.
- Distinguish active and inactive states through label, shape, or line treatment as well as color.
- Avoid unlabeled decorative networks that do not explain the text.

### 6.2 Required figure set

1. **Deck and solar-year correspondence**
   - 52 cards, 52 weeks, four suits, four seasons, thirteen ranks.
   - Clearly label the historical-intent claim as speculative.
2. **Solar-value lookup**
   - Month/day input, formula, normalized result, suit/rank lookup.
3. **Year 0 spread**
   - Real 7×7 field plus three crown positions.
   - No placeholder text.
4. **Annual permutation**
   - Show fixed positions, card movement, cycle lengths `45, 2, 2, 1, 1, 1`, and the 90-year repeat.
5. **Planetary-period timeline**
   - Seven birthday-anchored periods and the Neptune remainder.
6. **Environment and displacement pair**
   - Show the inverse positional lookup without relying on metaphor.
7. **Nine-card extraction path**
   - Mercury through Result, with numbered traversal order.
8. **Worked-example system map**
   - Date → solar value → birth card → age/year → spread → period cards.

### 6.3 Supporting diagram patterns

- Use miniature playing cards only where suit and rank must be read directly.
- Use process arrows only for transformations with a true before/after sequence.
- The blank-spread appendix must contain printable 7×7 grids and three crown boxes, not instructions to insert them later.

## 7. Claim labels and evidence hierarchy

Retain the book's distinction between mechanical and interpretive material, but make it quieter and more systematic:

- **V · Verified** — deterministic mechanics or recomputable facts.
- **I · Interpretive** — symbolic or reflective reading language.
- **S · Speculative** — historical or metaphysical claims without conclusive evidence.

Rules:

- Labels appear in the technical rail or a full-width callout, not as repeated decoration on every paragraph.
- Letter badges ensure meaning survives grayscale printing and color-vision differences.
- A claim label never upgrades the underlying evidence; the later manuscript review must verify the label itself.

## 8. Source and build architecture

Replace the current main-script-plus-supplements arrangement with one build entry point and focused modules:

```text
ebooks/analog-algorithm/
├── build_analog_algorithm.py
├── brand.py
├── content/
│   ├── front_matter.py
│   ├── part_1.py
│   ├── part_2.py
│   ├── part_3.py
│   ├── appendices.py
│   └── end_matter.py
├── figures/
│   ├── solar_value.py
│   ├── year_zero.py
│   ├── permutation.py
│   ├── periods.py
│   └── extraction.py
├── layout/
│   ├── document.py
│   ├── page_templates.py
│   └── styles.py
├── assets/
│   ├── fonts/
│   └── brand/
├── tests/
└── out/
```

Build behavior:

- One document object controls all page templates and continuous numbering.
- Page breaks are explicit and do not create hidden double breaks.
- Table-of-contents entries and PDF bookmarks resolve from the same chapter registry.
- Title, author, subject, keywords, edition, and publisher metadata survive final output.
- A preview build uses `out/The-Analog-Algorithm-redesign-preview.pdf`.
- The commercial filename becomes `The-Analog-Algorithm.pdf` only after visual, content, and fulfillment QA.
- Do not place the commercial PDF in `cardology-mirror/public/`.

## 9. Content cleanup allowed in this stage

The redesign may change text only where required to produce an honest, complete layout:

- Remove the retired phone number.
- Remove AI voice-reading, Season Pass, live-call, and `/readings` promotions.
- Remove statements that frame the e-book as a companion to the retired phone service.
- Replace literal placeholders with completed figures or worksheets.
- Update author/end-matter branding to Card Blueprints and `cardblueprints.com`.
- Use the Personal Card Blueprint only as an optional, current cross-sell in the final end matter.

All other substantive edits, mechanical-accuracy claims, historical claims, examples, and ontology language remain subject to a dedicated manuscript review before launch.

## 10. Accessibility and output quality

- All body text must remain selectable and extractable.
- Add clickable links and document bookmarks.
- Do not encode essential labels only inside raster images.
- Use embedded fonts with complete suit, math, punctuation, and symbol coverage.
- Render raster assets at a minimum effective resolution of 300 dpi; keep diagrams vector whenever possible.
- Verify readability at 100% on desktop and at fit-width on a phone-sized viewport.
- Do not claim PDF/UA compliance unless the eventual toolchain and a separate audit prove it.

## 11. Verification plan

### 11.1 Automated checks

- Build from a clean command using `uv` and declared dependencies.
- Open the result with `pypdf` and verify page count, metadata, bookmarks, and links.
- Extract all text and fail if it contains:
  - the retired phone number or its digit-only form,
  - `/readings`,
  - `Season Pass`,
  - `AI voice reading`,
  - placeholder phrases such as `Insert grid`, `Second grid`, `TODO`, or `coming soon`.
- Detect pages below a minimum text/graphic threshold and allowlist only the cover, title page, and deliberate part openers.
- Confirm displayed page numbers progress continuously.
- Confirm every table-of-contents destination exists.
- Confirm required font glyphs render without missing-character boxes.

### 11.2 Visual checks

Render every page to images and inspect:

- cover and title page,
- all part openers,
- every chapter's first page,
- all nine required diagrams,
- tables and quick-reference pages,
- every worksheet,
- end matter.

Reject the build for clipped text, overlapping flowables, orphan headings, weak contrast, inconsistent rails, illegible grids, broken suit glyphs, unintended blank pages, or supplement-style numbering restarts.

### 11.3 Acceptance build

The redesign is ready for manuscript review when:

- B + B1 + D1 is visible across the full document.
- All required figures are complete.
- No literal placeholders remain.
- No retired phone/voice product promotion remains.
- Page numbering and table-of-contents references are correct.
- The PDF carries correct title/author/publisher metadata and bookmarks.
- A full contact-sheet review and representative 100% zoom review pass.

## 12. Non-goals

This visual-redesign stage does not:

- publish or expose the paid PDF on a public path,
- enable Stripe checkout or secure download fulfillment,
- perform a complete claim-by-claim manuscript accuracy review,
- invent new Cardology mechanics,
- rewrite the product positioning or price,
- deploy changes to `cardblueprints.com`.

## 13. Final launch gates after redesign

The redesigned preview still requires three separate approvals before sale:

1. **Manuscript gate** — mechanics, examples, historical statements, and claim labels verified against the Cardology System Brain and live engine.
2. **Commercial gate** — final price, product-page images, Stripe product/price, secure tokenized delivery, receipt email, and refund language verified.
3. **Release gate** — final PDF hash recorded, authenticated download tested, product availability enabled, and canonical purchase flow verified end to end.
