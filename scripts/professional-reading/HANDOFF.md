# Professional reading builder — verified

Spec: `/Users/main/cardblueprints-ops/plans/professional-reading-builder-2026-09-19.md`.
Implementation is contained in `scripts/professional-reading/`. Nothing was pushed or deployed; checkout, prices, the engine, secrets, and customer data were untouched.

## Final verification

- Independent final review: **passed** with no security concerns or logic errors.
- Focused tool suite: **17 pass, 0 fail, 3026 assertions**.
- Cardology authority suite: **38 pass, 0 fail, 5894 assertions**.
- Project TypeScript and explicit strict tool TypeScript: **pass**.
- Full `bun run test`: **pass**, including local D1 concurrency verification.
- Cass fixture: `1991-02-17` on `2026-09-01`; age 35; Birth Card 8♦; PRC 5♣; Long Range Q♠; annual Environment K♣; annual Displacement 3♠.
- Final Cass PDF: `/Users/main/cardblueprints-ops/outputs/professional-reading-builder-2026-09-19/cass-age-35-final/reading.pdf`.
- Chromium probe: **20 page sections, 4 exact 52-card boards, no external requests, no overflow or footer overlap**.
- PyMuPDF: **20 pages; all nine planetary/result glyphs and the footer appear on every page**.
- Full-resolution visual checks: cover, annual walk, board diagrams, references, and final 60-character-name stress cover are clean.
- Accepted 60-character unbroken name: real PDF generated and Chromium A4 probe passed after compact-cover styling.
- Year-9999 boundary, every PRC including three-card dates, Fixed cards, leap days, projections, exact repeats, annual badge seats, private paths, symlink aliases, and no-clobber behavior have regression coverage.

## Boundaries

This is a private deterministic preparation tool for Cass's $199 concierge reading. It does not call a model, publish a product, send a report, or replace Cass's personal review. Client outputs are rejected inside the Git worktree except the ignored `private-sample/` subtree; external private output paths are allowed.

## Changes

- render.ts: Environment only on the annual board; Displacement only on spread 0. Both remain on the deduplicated board when annual index is 0.
- builder.test.ts: explicit assertions for every board, anchor and annual badge, including exact seats and ages 0 and 90.
- private-output.ts, cli.ts, cli.test.ts, private-output.test.ts: reject app/, public/, .git/, .next/, .vercel/ and out/ destinations, including resolved symlink aliases and nonexistent descendants. Check before creating output.
- probe.ts, probe.test.ts: require a fresh 0700 evidence directory before browser launch; JSON, PNG and PDF writes use exclusive creation (wx), mode 0600. Existing evidence is never overwritten.
- README.md and this handoff: current safety behavior and verification.

## Witnessed strict RED / GREEN

Each failing test ran before its corresponding production fix. Excerpts below preserve the actual assertion output and summary counts; timing and stack traces omitted.

1. `bun test scripts/professional-reading/builder.test.ts -t 'annual badges'`

RED, exit 1:
```text
error: expect(received).toEqual(expected)

- []
+ [
+   "K♣",
+ ]

 0 pass
 7 filtered out
 1 fail
 1 expect() calls
```

GREEN, exit 0:
```text
 1 pass
 7 filtered out
 0 fail
 36 expect() calls
```

2. `bun test scripts/professional-reading/cli.test.ts -t 'rejects resolved'`

RED, exit 1:
```text
error: expect(received).toContain(expected)

Expected to contain: "Private output destination is forbidden"
Received: "EEXIST: file already exists, mkdir '/Users/main/cardology-elroy-qa/app/page.tsx'\n"

 0 pass
 2 filtered out
 1 fail
 2 expect() calls
```

The test used existing files so the unfixed command failed without creating files in forbidden roots.

GREEN, exit 0:
```text
 1 pass
 2 filtered out
 0 fail
 6 expect() calls
```

3. `bun test scripts/professional-reading/probe.test.ts`

RED, exit 1:
```text
error: expect(received).toContain(expected)

Expected to contain: "EEXIST"
```
Instead, the probe tried launching Chromium and received `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.6347: Permission denied (1100)`. The sentinel evidence remained unchanged.

```text
 0 pass
 1 fail
 3 expect() calls
```

GREEN, exit 0:
```text
 1 pass
 0 fail
 3 expect() calls
```

## Post-fix verification actually run

- `bun test scripts/professional-reading`: exit 0.
```text
 13 pass
 0 fail
 2993 expect() calls
Ran 13 tests across 4 files. [1145.00ms]
```
- `bun run test:cardology`: exit 0.
```text
 38 pass
 0 fail
 5894 expect() calls
Ran 38 tests across 3 files. [34.00ms]
```
- `./node_modules/.bin/tsc --noEmit --incremental false`: exit 0, no output.
- `./node_modules/.bin/tsc --noEmit --strict --target ES2023 --module esnext --moduleResolution bundler --resolveJsonModule --esModuleInterop --skipLibCheck --types node scripts/professional-reading/builder.ts scripts/professional-reading/render.ts scripts/professional-reading/cli.ts scripts/professional-reading/probe.ts`: exit 0, no output. The imported private-output.ts is included.

## Remaining limits

Post-fix Chromium/PDF/visual verification was not completed: Chromium cannot launch in this sandbox. The focused PDF test exercised the honest HTML-only fallback. Regenerate Cass into a fresh private output directory and rerun the probe in the parent session before treating the revised PDF as visually verified. Existing parent evidence was not overwritten.

Full `bun run test` was not rerun during this bounded fix; its successful local D1 result above is the supplied parent pre-fix result. No engine, checkout, price, secret, external-system or queue edits. No staging, commit, push or deployment.


## Second-fix changes and witnessed RED/GREEN

Changed files: builder.ts, builder.test.ts, private-output.ts, private-output.test.ts, README.md, HANDOFF.md. All are under scripts/professional-reading/. No renderer/CSS change was necessary: the existing unbroken-name wrapping remains; validation now caps names at the reviewed 60-character boundary.

- Date formatting retains the full ISO date component, including +010000-02-16. Active period uses UTC timestamps. Four-digit input validation through 9999 is unchanged.
- Client names accept 60 characters and reject 61.
- Private destinations reject the whole worktree except private-sample and its descendants, on both lexical and canonical paths. Tests cover root, scripts, docs, lib, prefix lookalikes, missing descendants, outside paths, and symlink aliases. Existing forbidden-root tests remain.

Each RED ran before its corresponding implementation. Exact assertion/summary excerpts follow (returned report dump, stack traces and timings omitted).

`bun test scripts/professional-reading/builder.test.ts -t 'year 9999'`

RED exit 1:
```text
error: expect(received).toBe(expected)

Expected: "+010000-02-16"
Received: "+010000-02"

 0 pass
 8 filtered out
 1 fail
 1 expect() calls
```
GREEN exit 0:
```text
 1 pass
 8 filtered out
 0 fail
 15 expect() calls
```

`bun test scripts/professional-reading/builder.test.ts -t 'client name'`

RED exit 1:
```text
error: expect(received).toThrow(expected)

Expected substring: "Client name must be 1 to 60 characters"

Received function did not throw
```
```text
 0 pass
 9 filtered out
 1 fail
 3 expect() calls
```
GREEN exit 0:
```text
 1 pass
 9 filtered out
 0 fail
 3 expect() calls
```

`bun test scripts/professional-reading/private-output.test.ts -t 'worktree destinations'`

RED exit 1:
```text
Expected promise that rejects
Received promise that resolved: Promise { <resolved> }

 0 pass
 1 filtered out
 1 fail
 1 expect() calls
```
GREEN exit 0:
```text
 1 pass
 1 filtered out
 0 fail
 11 expect() calls
```

Second-fix regression commands:

- `bun test scripts/professional-reading`: exit 0.
```text
 16 pass
 0 fail
 3022 expect() calls
Ran 16 tests across 4 files. [1191.00ms]
```
- `bun run test:cardology`: exit 0, 38 pass, 0 fail, 5894 expect() calls.
- Explicit strict TypeScript command documented above: exit 0, no output.
- `./node_modules/.bin/tsc --noEmit --incremental false`: exit 0, no output.
- `bun run test`: did not pass. It reached the local D1 integration after the mocked fulfillment checks passed, then reported `error: Failed to start server. Is port 0 in use?` and stalled. Interrupted with Ctrl-C; final output: `error: script "test:fulfillment" exited with code 130` and `error: script "test" exited with code 130`. The earlier parent full-suite success is historical, not a second-fix pass.
- A direct in-memory Chromium A4 cover probe using 60 unbroken W characters could not launch: `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.8725: Permission denied (1100)`. The focused CLI PDF test therefore exercised the HTML-only fallback.

No staging, commit, push, deploy, engine/checkout/price/secret/external-system edits, or queue edits. The user's narrower directory-only scope overrides the standing external queue-edit instruction. Parent evidence was read only and not overwritten.
