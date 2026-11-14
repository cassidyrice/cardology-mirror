# Report writing and design: adversarial review

Reviewed: Chemistry Check (12 pp), 12-Month Timing Map (19 pp), Family Snapshot (24 pp), rendered from `src/offer-render.mjs` with sample people on 2026-10-15.

The question asked of every page: would a paying reader turn to the next page because they want to, or because it's next?

## Verdict

Before this pass, the report read like an engine log with nice fonts. The data underneath was strong and the framing around it was weak. Most pages answered "what card is this?" and never got to "so what about my life?" No page posed a question, so the reader was never asked to think anything.

## Writing: findings

| # | Problem | Where | Why it costs attention |
|---|---|---|---|
| W1 | **The machine is talking.** "Jordan Reyes's ruling card appears in Maya Chen's birth card spread as Long Range." | Connections | Reads like a SQL row. The reader has to translate it before they can feel anything. |
| W2 | **The reader is addressed in third person.** "Maya Chen's birth card…" appears in a report written *for* Maya. | Connections, overlaps | The guide says "speak to the buyer as you." The copy doesn't. |
| W3 | **Labels without stakes.** "Long Range", "Pluto", "Result", "Environment", "Displacement" are shown bare. | Yearly theme | Jargon is not mystique. Without one line on what each position *does*, the cards float. |
| W4 | **Only the flattering third of the data gets used.** Periods show `sweet_spot` only. `under`, `over`, `gifts`, `shadow`, `life_direction` are never shown. | Everywhere except page 2 | Flattery is forgettable. Tension makes a reading stick, and the engine already provides it. |
| W5 | **Nothing is asked.** There are zero reflection prompts across 55 pages. | All | "Thought-stimulating" needs a question the reader can't answer in one second. |
| W6 | **Headers are inventory.** "Period table / Maya Chen", "Calculation and review record", "Your yearly theme / age 35". | Back matter, yearly theme | A label tells the reader what a page holds. A headline gives them a reason to read it. |
| W7 | **Empty results apologise.** "No identical birth or ruling cards appear between these people." | Identity links | This is a finding: they are built differently. The copy should say so, as a fact. |
| W8 | **The cover undersells.** "A personal reading prepared for review." | Cover | That's the internal workflow state, printed on the customer-facing hero. It belongs in the footer, which already carries it. |
| W9 | **No "you are here".** The current period is buried in a table at the back. | Whole doc | The most urgent information, *what's happening now*, never gets its own moment. |

## Design: findings

| # | Problem | Fix applied |
|---|---|---|
| D1 | Every page uses the same layout (H2 + stacked rows), and pages often sit 50–60% empty. | Each section now has its own layout: chapter openers, a face-off spread, a year dashboard, a timeline band, a crossings ledger, and numbered seasons. |
| D2 | The two "Parts" don't feel like parts. | Full chapter-opener pages: a large suit glyph, a part numeral, a one-line hook, and the questions the part answers. |
| D3 | There's no map of the year. You need 8 table rows to see the shape. | A 12-month timeline band per person, coloured by planet, with a "you are here" marker. All people are stacked so overlaps show at a glance. |
| D4 | Cards are typographic only, and the same size in every context. | A drawn card tile (bordered, suit-coloured corner indices) for hero moments. Inline codes stay for tables. |
| D5 | Writing pages are a narrow 36-character column flush left, which looks broken. | That constraint is now a deliberate editorial layout: the column has a gold rule, the margin carries a suit glyph and section label, and the first line is set as a lead. Pagination is unchanged, so it stays overflow-safe. |
| D6 | The table of contents is missing. | A "How to read this" spread: contents with page numbers plus a key to the positions. |

## Visual pass (second round, real card faces)

Reviewed the redesigned pages again, this time against the question: does every page look finished and deliberate?

| # | Problem | Fix applied |
|---|---|---|
| V1 | The drawn card tiles were typographic stand-ins. A reading about cards showed no actual cards. | The site's 52 CC0 English-pattern faces (`public/share-cards/faces`) are downscaled to 360px by `prepare-card-faces.mjs` into `ui/cards/` and embedded in the report. Each face used is embedded once as a CSS class, so a report grows by the cards it uses (roughly 0.3–1 MB), not per appearance. |
| V2 | Real faces on navy needed depth to read as objects, not stickers. | White card with rounded corners, a soft two-layer shadow and a hairline gold ring. |
| V3 | The timeline's first month label ("OCT") collided with "NOV" when the window started late in a month. | Labels closer than 5% of the year to their neighbour are dropped. |
| V4 | Short first seasons (a 20-day remainder) clipped the card code inside the band. | Segments under 7% of the year drop the planet abbreviation and shrink the code. |
| V5 | The crossing detail line had fallen to 10px caption styling and was unreadable. | It is now 15.5px italic body copy. |
| V6 | In the Family Snapshot, "Right now" spilled the fourth person onto a page that was otherwise empty. | All people fit on one page (max four per offer). |
| V7 | The cover sat top-heavy with an empty lower third. | The cover block is vertically centred, like the part openers. |
| V8 | Court-card art at the smallest tile size (46×64) is a smudge. | Accepted. It still reads as "a card", and the code is in the adjacent text. |

Checked after the pass: print layout QA on all five fixtures (overflow, page height, footer collisions), the app UI QA (preview, writing, exports, no console errors, no network requests), and the unit tests.

## Third pass: one visual system

The three offers used a navy-and-gold design while the professional reference report used paper, ink and bronze. Two brands in one product. The offers now use the professional report's system exactly: its colour tokens, type stack, running heads (`CARD BLUEPRINTS / <offer>` and `+ 01 +`), the ink top bar, the Life Spread brand lockup on the cover, the FIXED / PATTERN / YOURS vocabulary, `YOURS · question` reflection blocks with a writing line, bordered tables, and the "Cards are coordinates" footer. The chaptered structure, the timeline, the dossiers, the questions and the real card faces are unchanged; they just sit on paper now. Dropping the embedded Cormorant file also takes about 1 MB off every report.

## Rules for the rewrite

1. Address the buyer as "you". Name other people by first name.
2. Every position gets one line that says what it does in plain terms.
3. Show the fork: the best version of the card, then how it goes wrong (`under` / `over`).
4. End every major section with one question the reader has to sit with.
5. Report empty results as findings, never as apologies.
6. Invent no outcomes and no scores. Every card, date and meaning still comes from the engine JSON.
