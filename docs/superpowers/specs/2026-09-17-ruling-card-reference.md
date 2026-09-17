# Planetary ruling card reference: design and implementation plan

Goal: improve the existing /planetary-ruling-card page with an auditable, searchable 366-date reference and useful explanation. User authorized discretionary implementation and requested Apify research.

Evidence: Apify run ZuL7Y6gIARPRxhsY9 processed 12 US mobile queries on 2026-09-17, costing $0.031. Specific ruling-card searches return relevant birthday charts. Broad glossary queries returned medical cardiology results. These are SERP observations, not keyword volume or difficulty measurements. Evidence is in ../outputs/authority-2026-09-17/.

Scope: one existing route; 366 rows, including February 29 and December 31; full ruling-card arrays; name and month filtering; downloadable CSV; permanent birthday anchors; original explanations and examples; matching Article/FAQPage/Dataset markup; internal links and truthful reviewed dates. Keep the current calculator available. Match the paper-and-ink visual design. Avoid invented zodiac derivations: the actual lookup reads the existing date table. Distinguish calculation from interpretation. No per-date new HTML pages.

Architecture: server builds table rows through calculateBirthCard(month, day). A client chart receives serialized card labels/links and provides filters. Native month disclosures retain the full content in initial HTML and remain usable without JavaScript. CSV is generated from the same function through a static route. Page copy and examples use that same data. No new dependency or changes to engine, billing, analytics, or Worker.

Source: isolated clone of preserved main, fast-forwarded to current origin/main 2f0a40a. September 16 backup stays untouched. Existing repo instructions reserve production publishing for Claude and the old canonical path no longer exists; prepare a clean reviewed commit and release handoff, with any production approval requested only after checks.

## Task 1: Auditable data and CSV
- Create lib/ruling-card-reference.ts: export RulingCardReferenceRow type with month, day, dateLabel, id, birthCard {code,label,href}, rulingCards array, and buildRulingCardReference() returning chronological rows. Card labels use parseCard, href uses birthCardSlug with explicit Joker handling.
- Create app/data/planetary-ruling-card-chart.csv/route.ts: force-static GET returns BOM-prefixed UTF-8 CSV, one row per date with separate primary/secondary/third ruling columns; named attachment. The text describes data as Card Blueprints lookup conventions.
- Add scripts/ruling-card-reference.test.ts: assert all 366 unique valid days, exact calculator parity, 47 multi-card dates, 2 triple dates, February 29 and December 31; parse CSV for complete rows and consistent column counts.

## Task 2: Visitor page and discoverability
- Create components/seo/PlanetaryRulingCardChart.tsx: accessible search and month selector, result count, reset, native month details and three-column tables. All birthdays in SSR HTML. Empty results explained. Preserve full words for suit labels. Add URL anchors to birthdays and reveal target on load/hashchange.
- Rewrite app/planetary-ruling-card/page.tsx with descriptive title/description, clear chart CTA, examples pulled from data, transparent method, multiple-card and boundary explanations, FAQs, static free CSV link and current calculator. Serialize schema safely through existing helper.
- Relabel link in components/explore/ExploreDirectory.tsx; add specific chart link in app/birth-card-vs-ruling-card/page.tsx. Update only affected PAGE_UPDATED_DATES.
- Update outdated literal-title test in scripts/ruling-card-cotd.test.ts.

## Task 3: Review and verification
- Run bun run test, focused reference/schema tests, TypeScript check, production build.
- Probe local production page at 390px and desktop: no overflow, valid metadata/schema, all 366 initial HTML rows, filtering, empty/reset, deep-link opening, CSV download, calculator, internal links, no-JS table use. Save screenshots and results.
- Independent review of correctness, reader claims, SEO, accessibility and tests. Fix actionable issues and rerun relevant checks.
- Commit only task files; write release handoff with source commit and verification boundaries. No ranking, indexing, revenue or live-release claims without evidence.
