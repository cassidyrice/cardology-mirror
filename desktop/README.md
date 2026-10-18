# My Card Blueprint Reports

Open `dist/My Card Blueprint Reports-darwin-arm64/My Card Blueprint Reports.app` on this Apple Silicon Mac. The app starts in the report builder. See [REPORT-BUILDER.md](REPORT-BUILDER.md) for the offer workflow, file formats, and verification.

The existing spread explorer remains available from the sidebar. The report builder is local-only and saves drafts only when requested.

# Card Blueprints desktop

Offline macOS application powered by the mirror's unchanged deterministic engine.

Open `dist/Card Blueprints-darwin-arm64/Card Blueprints.app` on an Apple Silicon Mac. Enter a birthday and reading date, then choose **Generate spread**. No server, account, or API key is required. Birthdays are held in memory and are not saved automatically.

## Included output

- Birth card, primary planetary ruling card, and secondary ruling card when present.
- Annual, Life (board 0), and Spirit (board 1) personal positions: Mercury through Neptune, Pluto, Result, Environment, and Displacement.
- Annual Long Range and personal daily sub-period cards.
- Seven-year cycle and weekly weekday positions for each anchor.
- Lifetime Gift and Challenge, with absent fixed-card karma shown explicitly.
- Complete 49-seat grid plus three crown seats; explore every board from 0 through 89.
- Stored three-lens card interpretations, native printing, and full JSON export including all 90 boards.

Annual calculations use the core's `age + 1` navigation rule, cycling every 90 boards. This differs from the website's age-clamped reading wrapper. Reading dates use local noon to avoid DST day-boundary drift. Board planetary columns read right to left; numeric row and crown labels describe actual seats without invented position meanings.

December 31 is the Joker. The repository has no defined Joker spread, so the app reports this limitation instead of returning a King of Spades reading. Invalid dates and reading dates before birth are rejected. Years 0100–9999 are accepted.

## Development

From this directory, with Node and pnpm installed:

```sh
pnpm install
pnpm start
pnpm test
pnpm package
```

If pnpm reports ignored Electron/esbuild build scripts, run `pnpm approve-builds` and allow those two packages, then reinstall. `build.mjs` bundles the existing engine and card interpretation data into the renderer. Electron uses a sandboxed renderer with context isolation and narrow save/print IPC methods.

The local bundle is unsigned; it is intended for local use. Distribution to other Macs requires Apple code signing and notarization.

## Verification

Engine tests check every supported day in a leap year against core output, all 90 complete decks, invalid inputs, Joker refusal, and age 126. Native Electron testing checks spread navigation, ruling-card tabs, board 89, card details, 52 visible seats, date changes, responsive layout, and no renderer errors.

The visual concept is `design/concept.png`. Implementation retains the white/navy/teal palette, sidebar, serif heading, two summary panels, anchor tabs, personal position rows, and adjacent board. Intentional changes: real computed text replaces example copy; typographic cards replace illustration art; unsupported invented row meanings and settings/help are omitted; daily sub-period positions are added; crown cards are shown separately above the grid.
