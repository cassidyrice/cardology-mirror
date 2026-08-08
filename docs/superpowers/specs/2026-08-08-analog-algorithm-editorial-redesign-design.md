# The Analog Algorithm — Editorial Redesign Design Specification

**Date:** 2026-08-08  
**Status:** Approved visual direction; awaiting written-spec review  
**Product:** *The Analog Algorithm* by Cassidy Rice  
**Commercial format:** Paid PDF e-book, currently listed at $27 and not yet available  
**Document source:** `/Users/main/cardblueprints-content/ebooks/analog-algorithm`  
**Site and companion source:** `/Users/main/cardology-mirror`  

## 1. Executive decision

Redesign the existing 71-page *The Analog Algorithm* PDF as a Card Blueprints editorial atlas. The deliverable is the **e-book**, not a separate promotional or cinematic website.

The approved system is a controlled mix:

- **B — Algorithmic Atlas** leads the cover and the book's visual identity.
- **B1 — Essay + Technical Rail** is the default long-form chapter template.
- **B2 — Full Visual Plate** carries formulas, diagrams, worked proofs, and four optional course-snippet invitations.
- **B3 — Modular Field Notes** is reserved for worksheets, quick references, and practice appendices.
- The visual identity is inherited from `cardblueprints.com`: cream paper, dark ink, oxblood, bronze, editorial serif typography, hairline rules, restrained dot-grid texture, and plexus geometry.
- Course snippets are accessed through clickable links and QR codes leading to four unlisted, no-signup Card Blueprints companion pages. Video is **not** embedded as fragile rich media inside the PDF.

The redesign also repairs the current document's content-truth, structural, metadata, and consistency defects. It must not merely place a new cover over the existing merged build.

## 2. Goals

1. Make the e-book feel authored in the same world as Card Blueprints without printing website UI into the book.
2. Make the mechanical promise of “algorithm” visible through clear diagrams, formulas, and annotated worked examples.
3. Preserve comfortable long-form reading through a calm B1 chapter rhythm.
4. Use B2 visual plates only where visual explanation materially improves comprehension.
5. Make worksheets and quick-reference pages genuinely usable through B3 modular layouts.
6. Add four optional course-video touchpoints without requiring signup or weakening offline readability.
7. Remove obsolete offers, literal placeholders, accidental blank pages, numbering resets, and supplement seams.
8. Ship a professional PDF with correct metadata, embedded fonts, internal navigation, functional links, and print-safe rendering.

## 3. Non-goals

- Rebuilding `cardblueprints.com` as part of the e-book.
- Turning the PDF into an interactive web app.
- Embedding MP4 files or Acrobat Rich Media annotations directly in the PDF.
- Requiring a free-course signup, login, or second purchase to understand the book.
- Replacing the book's explanations with video.
- Publishing the paid PDF under a permanent public URL.
- Rewriting verified mechanics or inventing new Cardology formulas.
- Launching checkout or changing the product's `available: false` state during the design phase.
- Inflating the page count with forced breaks, header-only pages, or “padding” chapters.

## 4. Authoritative baseline

### Current product truth

The current site catalog at `lib/products.ts` is authoritative for commerce:

- Product name: **The Analog Algorithm**
- Slug: `analog-algorithm`
- Kind: `digital_download`
- Price: **$27**
- File name: `The-Analog-Algorithm.pdf`
- Current availability: `false`
- Current sales route: `/products/analog-algorithm`

The product remains unavailable until the redesigned PDF and fulfillment path pass their launch gates.

### Current document truth

The real artifact is:

`/Users/main/cardblueprints-content/ebooks/analog-algorithm/out/The-Analog-Algorithm-FULL.pdf`

The current source is split across:

- `build_analog_algorithm.py`
- `build_supplement.py`
- `build_supplement2.py` through `build_supplement6.py`
- `brand.py`

The existing PDF is 71 letter-size pages, assembled from the base document and several supplements.

### Known defects to correct

The redesign must explicitly repair the audited baseline:

- Dark cover does not match the current cream-paper Card Blueprints identity.
- Ten pages contain only running furniture or effectively no content.
- Figure and spread instructions still appear as literal placeholders.
- Supplement page numbers restart instead of forming one continuous book.
- Supplemental sections look appended rather than designed as one artifact.
- Merged PDF metadata does not reliably preserve the product title and author.
- Old voice/phone-reading promotions and obsolete routes remain in copy.
- The author material contains legacy brand references that require current-truth review.
- Generic Helvetica/Times styling does not express the approved editorial system.
- Diagrams, tables, callouts, and worksheets do not share one consistent visual grammar.
- Some supplement code describes content as “padding”; page count has taken priority over editorial necessity.

## 5. Locked identity and product text

### Identity

- Publisher: **Card Blueprints**
- Logo lockup: production plexus mark plus lowercase **card blueprint** wordmark
- Author: **Cassidy Rice**
- Edition: **First Edition · 2026**
- Product price: **$27** unless the live catalog is deliberately changed in a separate approved operation

### Cover title

**The Analog Algorithm**

### Approved cover subtitle

**A visual proof of the 52-card calendar and a practical manual for reading its output.**

This subtitle is part of the selected Algorithmic Atlas cover. If adopted on the sales page or PDF metadata during implementation, it must be changed consistently rather than creating multiple competing subtitles.

### Claim stance

Every substantive Cardology claim uses one of these meanings:

- **Verified / consistent:** recomputable mechanics confirmed by the engine, tables, or fixtures.
- **Interpretive:** symbolic or reflective language, not mathematical consequence.
- **Speculative:** historical, astronomical, or metaphysical claims without conclusive evidence.
- **Legal:** entertainment and self-reflection; not medical, psychological, legal, or financial advice.

The engine and Cardology System Brain win any conflict with narrative copy.

## 6. Brand translation into editorial design

The e-book inherits the site's identity anchors but not its navigation, buttons, checkout controls, or desktop layout.

### Palette

- Paper: `#f6f1e8`
- Deeper paper panel: `#efe8dc`
- Ink: `#14110d`
- Muted ink: `#5b5148`
- Oxblood: `#8e321f`
- Bronze/brown: `#b8893f` / `#71551f`
- Hairline rule: approximately `#d7cdbd`

The dominant field is warm paper. Ink carries most content. Oxblood marks emphasis and system relationships. Bronze is secondary and must not compete with oxblood.

### Typography

- Display and long-form editorial serif: **Iowan Old Style**, available on the production Mac; **Palatino** is the controlled fallback.
- Technical labels, running furniture, tables, and annotations: system sans or a metrically stable embedded sans.
- Formulas and code-like mechanics: a legible monospace with zero ambiguity between `0/O` and `1/l`.
- Wordmark: use the production vector logo asset rather than depending on Montserrat being installed in the PDF build environment.
- Display headings use regular weight, tight tracking, and generous negative space; they must not become heavy sans headlines.
- Body target: approximately 10.5–11 pt with 15–16 pt leading at US Letter size.
- Small labels may use uppercase tracking, but no essential content may fall below a comfortable print/read threshold.

All non-core fonts must be embedded or safely converted to vector outlines where appropriate. A font substitution that visibly changes hierarchy is a build failure.

### Surface and motif

- Restrained paper/dot-grid texture at low contrast.
- Hairline grids, radial maps, and plexus nodes establish technical continuity.
- Texture must disappear gracefully in grayscale and must not reduce body-text contrast.
- No neon, cyberpunk, glossy 3D, occult cliché, or generic black-and-gold luxury treatment.

## 7. Cover — B: Algorithmic Atlas

The selected cover uses the following composition:

1. Warm paper field with a restrained dot-grid surface.
2. Top rule containing the production logo at left and `AA / 01` at right.
3. Large serif title, left aligned:
   - `The Analog`
   - `Algorithm`
4. Approved subtitle beneath the title.
5. Central square grid containing:
   - a radial 52-position diagram,
   - concentric oxblood/bronze rings,
   - eight directional nodes,
   - `52` at center,
   - `CARDS / WEEKS` as a technical label.
6. Formula strip containing:
   - `solar = 55 − (2m + d)`
   - `S(y) = Pʸ(S₀)`
   - `4 suits × 13 ranks`
   - `90-year permutation`
7. Footer metadata with **Cassidy Rice** and **Card Blueprints**.

The cover must remain legible as a small storefront thumbnail. At thumbnail scale, the product name, central `52`, and oxblood geometry must still read; small formulas may become texture but must not turn into visual noise.

## 8. Book-wide page system

### Page format

- US Letter, portrait: 8.5 × 11 inches.
- Digital-first and home-printable.
- Safe margins approximately 0.75–0.85 inches, with extra allowance where binding or printer clipping makes it useful.
- Continuous folios across the entire final artifact.
- Running furniture is quiet and subordinate to content.

### B1 — Essay + Technical Rail

B1 is the default for narrative and explanatory chapters.

Structure:

- Running title and folio separated by a hairline.
- Oxblood/bronze chapter label.
- Large regular-weight serif chapter title.
- Main reading column in editorial serif.
- Narrow technical rail for formulas, labels, mini-diagrams, worked values, confidence markers, and definitions.
- Rail content remains concise; long explanations stay in the main column.

Use B1 for most of Parts I–III and for ordinary explanation around visual plates.

### B2 — Full Visual Plate

B2 is the high-impact teaching language and the dominant accent system selected by the user.

Structure:

- One concept per plate.
- Diagram first, compressed explanation second.
- Clear caption and figure/plate number.
- Explicit separation between “what the mechanics prove” and “what they do not prove.”
- Confidence labels adjacent to the relevant claim, not buried elsewhere.
- Strong enough for a standalone screenshot while still belonging to a book spread.

Use B2 for approximately 8–12 concepts that materially benefit from visual proof, including:

- 52-card / 52-week calendar map.
- Solar Value formula and deck-position mapping.
- Year 0 state-machine arrangement.
- Fixed permutation and annual progression.
- Planetary-period timeline.
- Environment, displacement, and long-range relationship.
- A complete worked example.
- Number × Suit × Planet grammar.
- Under / Sweet Spot / Over state model.
- Course-snippet invitation plates described below.

B2 must not occupy every page; repetition would make the book feel like a whitepaper or slide deck.

### B3 — Modular Field Notes

B3 is reserved for action and lookup.

Structure:

- Compact bordered modules.
- Formula, example, caution, and “try it” blocks.
- Generous writable fields.
- Quick-reference tables with clear row rules.
- Print-friendly checkboxes and labels.
- No dense dashboard styling in narrative chapters.

Use B3 for:

- Birth-card quick reference.
- Fill-in worksheets.
- Blank spread templates.
- Formula sheet.
- Glossary and field-reference pages.
- Practice prompts following the fourth course snippet.

## 9. Page-type requirements

The final system must include coherent treatments for:

1. Cover.
2. Copyright, license, disclaimer, and confidence-label key.
3. Linked table of contents.
4. Part openers.
5. Chapter openers.
6. Ordinary B1 body pages.
7. B2 visual plates.
8. Worked examples.
9. Tables and quick references.
10. B3 worksheets and write-in pages.
11. Spread diagrams with real geometry, not prose placeholders.
12. Figure captions and cross-references.
13. Further-study/source pages.
14. About-the-author and closing pages.

Part and chapter openers may borrow the Atlas grid and radial geometry, but they must not replicate the cover at full density.

## 10. Course-snippet companion layer

### Decision

The e-book will contain **linked course snippets**. It will not contain MP4 payloads or Acrobat Rich Media.

Access is:

- no signup,
- no login,
- no purchase-token check,
- no autoplay,
- unlisted from primary navigation,
- excluded from the public sitemap,
- marked `noindex`,
- hosted on the Card Blueprints domain.

“Unlisted” is a convenience boundary, not a security boundary. The clips are intentionally short excerpts and may be shared.

### Four placements

| E-book placement | Source course module | Current full-module duration | Companion role |
|---|---|---:|---|
| Chapter 4 — Solar Value and Your Birth Card | Foundations & Find Your Birth Card | 3:22 | Demonstrate the calendar premise and birth-card calculation |
| Chapter 10 — Product Grammar | Read Rank + Suit | 4:01 | Demonstrate how rank and suit combine into plain-language meaning |
| Chapter 11 — Under / Sweet Spot / Over | States & Self-Reflection | 4:10 | Demonstrate balanced, under-expressed, and over-expressed states |
| Part IV — Practice Appendices | Pattern Builder & Next Steps | 2:23 | Demonstrate how to construct a responsible reflection statement |

Each derivative excerpt targets **30–90 seconds** and must begin and end on complete thoughts. Exact timecodes are selected during implementation from the existing authored voice-over, using transcript and scene review—not arbitrary duration slicing.

### Stable companion routes

Use stable Card Blueprints pages rather than direct MP4 links:

- `/analog-algorithm/companion/foundations`
- `/analog-algorithm/companion/rank-and-suit`
- `/analog-algorithm/companion/states`
- `/analog-algorithm/companion/pattern-builder`

The PDF's QR codes and links point to these routes. Media filenames may change without invalidating printed books.

### E-book callout anatomy

Each course invitation appears as a branded B2-adjacent plate or half-page block containing:

- Module poster still.
- Small play indicator.
- Label: **Watch the lesson**.
- Specific lesson title.
- Excerpt duration.
- One-sentence reason to watch.
- Clickable linked area.
- Printed short URL.
- QR code with a sufficient quiet zone and print size.
- A two-to-four-sentence transcript takeaway.
- Label explaining that the video is optional.

The takeaway must teach the essential point without requiring connectivity. The book remains complete when printed or read offline.

### Companion-page anatomy

Each unlisted page includes:

- Card Blueprints header/wordmark treatment.
- Exact excerpt title.
- Poster and native video controls.
- No autoplay.
- Captions via `.vtt` or equivalent.
- Readable transcript beneath the player.
- Short “What to notice” summary matching the e-book callout.
- Link back to the e-book product page or Card Blueprints learning surface.
- No signup form or forced lead capture.

The pages use the website design system because they are web surfaces; the e-book translates the same identity into editorial grammar.

### Failure and fallback behavior

- If video cannot play, the companion page still shows the poster, transcript, and takeaway.
- If a QR scan fails, the printed short URL remains available.
- If the reader is offline, all required instruction remains in the PDF.
- The e-book must never display a blank box where remote media would have been.
- No essential explanation, formula, or worksheet instruction may exist only in a clip.

## 11. Content and structural cleanup

### Remove or rewrite

- Retired phone-reading references, phone numbers, and obsolete “call the line” language.
- Legacy routes or offers that no longer match the live product ladder.
- `cardologypro.com` references unless current product truth explicitly requires them.
- Literal “insert diagram,” “see placeholder,” or unbuilt-figure instructions.
- “Coming soon” language inside the final sold file.
- Copy whose only purpose is to pad page count.
- Duplicate explanations created by merging supplements.

### Replace with real editorial assets

- Year 0 grid and crown.
- Spread templates.
- Annual-permutation map.
- Planetary-period timeline.
- Deck-position map.
- Confidence-label legends.
- Complete worked examples checked against the engine.

### Structural unification

- One continuous page-number sequence.
- One coherent table of contents matching final folios.
- One running-title system.
- No repeated title pages or supplement headings.
- No accidental blank or header-only pages.
- No orphaned headings, clipped tables, or isolated one-line paragraphs.
- Supplements are integrated by editorial role rather than appended in build order.

## 12. Production architecture

### PDF workstream

Canonical source remains under:

`/Users/main/cardblueprints-content/ebooks/analog-algorithm/`

The implementation should converge on shared reusable modules rather than seven independently styled generators. The exact file split may change, but the architecture must provide:

- One source of brand tokens.
- One font-registration layer.
- One family of page templates.
- Reusable B1, B2, and B3 components.
- Reusable confidence badges.
- Reusable figure, caption, QR, course-callout, table, and worksheet components.
- One final assembly step that writes title/author metadata after all pages are combined.

The commercial PDF remains outside `cardology-mirror/public/` and is delivered only through the existing secure-download architecture.

### Course-media workstream

Source modules currently live under:

`/Users/main/cardology-mirror/public/free-course/media/`

Create derivative excerpt assets without changing the original full modules. Each companion lesson should have:

- MP4 excerpt.
- Poster JPG/WebP.
- Caption VTT.
- Transcript text.
- Stable slug and route.
- Source-module reference and selected time range in a small manifest.

The website implementation should consume one typed manifest so page copy, poster, video, transcript, duration, and route cannot drift independently.

### Link and QR generation

- Generate QR codes from the canonical absolute companion URLs.
- QR codes must be vector or high-resolution monochrome assets.
- Use dark ink on cream/white with an unbroken quiet zone.
- Link annotations must cover the visible poster/callout and the printed URL.
- Do not encode temporary deployment URLs, signed tokens, query-string tracking identifiers, or direct media paths.

## 13. Accessibility and print behavior

- Body text remains readable at 100% on a common laptop and tablet.
- Text contrast meets accessible expectations against paper fields.
- Claim meaning never depends only on color; use label text and distinct marks.
- Diagrams include captions and explanatory prose.
- Companion videos include captions and transcripts.
- QR blocks include human-readable URLs.
- Worksheets provide practical writing space.
- All important content remains understandable in grayscale.
- Suit symbols are paired with text where ambiguity matters.
- Decorative geometry is tagged or flattened so it does not pollute reading order where PDF accessibility tooling supports it.

## 14. Metadata and navigation

The final PDF must include:

- Title: `The Analog Algorithm`
- Author: `Cassidy Rice`
- Subject/description consistent with the approved subtitle.
- Publisher/brand: `Card Blueprints` where supported.
- First Edition · 2026.
- Linked table of contents.
- PDF bookmarks for parts, chapters, and appendices.
- Functional internal cross-references.
- Functional external course-companion links.

Final metadata is applied to the merged artifact, not only to individual source PDFs.

## 15. Verification and acceptance gates

### Content truth

- No retired phone number or phone-reading CTA.
- No obsolete route or unsupported product claim.
- Product title and price match `lib/products.ts`.
- No `TODO`, `TBD`, “insert figure,” “coming soon,” or placeholder copy.
- Verified formulas and at least three worked dates match the canonical engine.
- Interpretive and speculative material is labeled correctly.

### Structural PDF checks

- Expected final range is approximately **70–82 pages**, driven by content and visual plates rather than padding.
- Zero accidental blank or header-only pages.
- Continuous folios.
- Table of contents and bookmarks match final page positions.
- No clipped tables, orphaned headings, or broken internal references.
- Correct final title/author metadata.
- Fonts embedded or safely vectorized.
- Reasonable file size for paid digital delivery.

### Visual checks

Render and inspect at minimum:

1. Cover at full size and storefront-thumbnail size.
2. Contents.
3. Part opener.
4. B1 chapter opener and ordinary body page.
5. B2 formula/proof plate.
6. B2 course-snippet callout.
7. Worked example.
8. Quick-reference table.
9. B3 worksheet.
10. Spread diagram.
11. Closing/author page.

Check screen rendering at 100%, common mobile/tablet PDF viewing, grayscale, and a home-printer sample where practical.

### Course-companion checks

- All four canonical routes return HTTP 200.
- Pages are `noindex` and absent from sitemap/navigation.
- No route asks for signup or login.
- Video controls work without autoplay.
- Range requests work for MP4 playback.
- Poster, captions, transcript, and takeaway exist for every clip.
- Clip durations are 30–90 seconds and begin/end cleanly.
- Printed QR codes scan from a real page at normal size.
- Printed short URLs match the QR destinations.
- A failed or blocked video still leaves a useful page.

### Cross-surface consistency

- Product title, author, price, cover, description, checkout, receipt, and downloaded filename remain consistent.
- The redesigned PDF is never added to a public static directory.
- Existing full free-course signup/watch flow continues to work; the unlisted excerpts are a separate no-signup path.

## 16. Delivery sequence

1. User approves this written specification.
2. Create an implementation plan covering PDF and companion-page workstreams.
3. Consolidate the editorial source architecture and build representative pages first.
4. Verify the representative contact sheet against this specification.
5. Produce the full redesigned PDF and run content/structure gates.
6. Produce the four excerpt assets and unlisted companion pages.
7. Verify links and printed QR codes end to end.
8. Run commerce regressions without changing product availability.
9. Present final PDF and visual evidence for launch approval.
10. Enable availability only through a separate explicit launch decision.

## 17. Approved decision record

- Deliverable is the e-book, not a standalone website.
- Cover direction: **B — Algorithmic Atlas**.
- Interior direction: controlled mix of **B1 + B2 + B3**.
- B2 provides the standout teaching and diagram language.
- B1 remains the default readable chapter system.
- B3 is limited to worksheets and references.
- Brand must follow Card Blueprints identity without copying website UI literally.
- Course integration uses linked thumbnail + QR + transcript takeaway.
- Course access is unlisted and requires no signup.
- Literal video embedding inside the PDF is rejected.

## 18. Definition of done

The redesign is complete only when the resulting e-book:

- visibly belongs to Card Blueprints,
- matches the approved Algorithmic Atlas system,
- reads comfortably as a real book,
- teaches key mechanics visually,
- remains complete without video,
- links reliably to four optional course excerpts,
- contains no obsolete or placeholder content,
- behaves as one continuous artifact rather than a merged stack,
- passes PDF, course-page, and commerce regression gates,
- and receives explicit launch approval.
