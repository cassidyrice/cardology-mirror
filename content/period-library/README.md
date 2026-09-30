# Card Blueprints complete writing library

Use `period-artifacts.json` for the complete 52 card by 7 planet library. Each ID is the current card bible slug, a dot, and the lowercase planet. The card code uses the engine's Unicode suit glyph. The four suit files are the authored source; the combined file and manuscripts are reproducible exports.

Each period record contains the title, omen line, paragraph array for the long reading, shadow watch, practical action, reflection question, yearly context, court person or posture clause, significance and source references. The omen is a reflective opening line. It does not predict an event. Long-reading word bands follow the recovered commission: 400 to 600 for Aces, Sixes and Nines; 250 to 350 for Twos, Fours and Tens; 150 to 250 for the other ranks.

Use `yearly-artifacts.json` for the five yearly positions. Its 260 records cover 52 possible card meanings in each position. Select only the actual cards assigned by the engine. An Environment or Displacement record does not create an assignment where the calculated packet has none. The Joker remains outside the app's supported 52 card map.

`supporting-copy.json` contains seven chapter introductions and closing reflections, 56 notification variants, 18 reviewed connectors, onboarding, integrity and share copy. Notification and connector variables are intentional runtime substitutions, with explicit prerequisites. No notification system, subscription or new service is enabled by this writing. Render no unresolved variable and fabricate no date, echo or yearly card.

`MANUSCRIPT.md` is the complete editable manuscript. `MANUSCRIPT.html` provides an offline readable version with suit, planet, library and text filters. The preview's download button serves the verified ZIP from the same local folder. `engine-derived-example.json` uses a synthetic birthday and the unchanged engine to demonstrate a real seven-period arc; it replaces the report's illustrative card sequence with calculated assignments.

## Reproduce and verify

Run these commands from the isolated project root:

```
bun run test:period-library
bun scripts/build-period-manuscript.ts
python3 scripts/bundle-period-library.py
```

The validator checks exact pair coverage, field completeness, depth, source references, prohibited wording, embedded dates, literal duplicate paragraphs, repeated 14 word spans, duplicate short fields and paragraphs differing only by card or planet names. Independent editorial review checks conceptual overlap, specific meanings and voice in the scope documented under `qa/`. Literal uniqueness alone does not prove literary quality.

The library and its reviews were produced with AI assistance. The review report states actual sample coverage; it does not claim human approval or a line edit of every paragraph. The source report, prototype and newer guidance are preserved under `sources/`, with hashes in `manifest.json`.

The local app selector sends seven actual period readings and the assigned yearly text to the browser. It adds no model call and changes no calculation, access rule or payment setting. The original app remains available through More cards. The free calculator and One Question Reading are outside this change.

DOCX export is unavailable because the delegated thread's workspace document dependency loader does not support this execution context. No DOCX is included or claimed to be render-verified. Markdown and HTML remain fully editable on the Mac.

Canonical integration, public release, sales, billing and deployment require their separate authorized release process. This work stops at a verified local library and preview.
