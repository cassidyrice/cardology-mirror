# Private professional reading builder

Run from the canonical repository with Bun. No server, API, model call, new dependency, checkout integration or deployment is needed.

```sh
bun scripts/professional-reading/cli.ts "Cass" 1991-02-17 2026-09-01 --out scripts/professional-reading/private-sample
```

Inputs are client name (1–60 characters), birth date, reading date (both YYYY-MM-DD), and an output directory. Choose a **new private directory for each run**. Existing files are never replaced. The command writes `reading.html`, then `reading.pdf` if the installed Playwright Chromium can launch. Use `--html-only` to deliberately skip PDF. `--help` explains inputs. Output files use mode 0600; newly created output directories use 0700. Every destination inside the Git worktree is rejected except `scripts/professional-reading/private-sample/` and its descendants. Paths outside the worktree remain allowed. Both lexical and resolved paths are checked, including symlink aliases and missing descendants. Do not share client reports in Git.

Open the HTML locally to read or print. All styles and meanings are embedded; optional reference links are not runtime dependencies. On a browser launch failure the command reports HTML-only completion; it does not claim a PDF was created. Chromium installation or a machine permission fix is an operator action, never attempted by this tool. Export errors after browser startup fail the command.

Cass's private sample is ignored by Git. To reproduce without replacing it, choose `--out /private/tmp/cass-professional-reading-2026-09-01` or another fresh directory.

## Verification

```sh
bun test scripts/professional-reading
bun run test:cardology
npx tsc --noEmit --incremental false
# The project tsconfig excludes scripts: check the tool explicitly too.
npx tsc --noEmit --strict --target ES2023 --module esnext --moduleResolution bundler --resolveJsonModule --esModuleInterop --skipLibCheck --types node scripts/professional-reading/builder.ts scripts/professional-reading/render.ts scripts/professional-reading/cli.ts scripts/professional-reading/probe.ts
bun run test
bun scripts/professional-reading/probe.ts scripts/professional-reading/private-sample/reading.html
```

The browser probe is specifically for the documented Cass fixture. It checks every board against the engine, external requests, print-page height, footer overlap and horizontal overflow. It writes page screenshots, `layout.json`, and a PDF to `browser-evidence/` beside the HTML. The evidence directory must not exist: the probe reserves it with mode 0700 before browser launch and refuses reuse, including after a failed probe. JSON, PNG and PDF files use exclusive creation and mode 0600. Use a fresh report directory for another run. A failed browser launch is a failed probe, not a skipped pass.

If PyMuPDF is available, inspect the actual PDF (including all glyphs) as follows:

```sh
python3 - <<'PY'
import fitz
from pathlib import Path
root = Path('scripts/professional-reading/private-sample')
doc = fitz.open(root / 'reading.pdf')
text = ''.join(page.get_text() for page in doc)
for glyph in '☿♀♂♃♄♅♆♇✦':
    assert glyph in text, f'Missing PDF glyph: {glyph}'
for i, page in enumerate(doc):
    assert 'Cards are coordinates.' in page.get_text(), f'Missing footer: {i+1}'
    page.get_pixmap(matrix=fitz.Matrix(1.3,1.3)).save(root / f'pdf-page-{i+1:02}.png')
print(f'{len(doc)} pages; glyph and footer checks passed. Inspect every PNG for clipping.')
PY
```

The report uses `buildReading` for its base reading, the engine lookup for every PRC, and `cardsFrom`/`getSpread` for annual walks and cycles. Annual Environment/Displacement reduces age mod 90 before calling the engine. Ages 90+ are explicitly canonical projections. Long Range slots include all seven ages, not seven simultaneous annual influences. Full boards include spread 0 for annual comparisons; coincident indexes render once.

The date layer follows `calculateAge`'s February 28 anniversary for non-leap years. It does not reuse the engine's DST-sensitive active-period calculation. It builds inclusive UTC calendar ranges and marks the active range from the requested date. No card math or permutation is duplicated.

This is a deterministic preparation tool for the private $199 concierge reading, not a claim that a generic report replaces Cass's personal review. No public offer or price was changed. See HANDOFF.md for witnessed RED/GREEN results and actual verification limits.
