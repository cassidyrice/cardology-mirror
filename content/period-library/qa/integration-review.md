# Local period-library integration review

Reviewed 2026-09-30 against `3165524`. No concrete integration regression found in the reviewed changes.

- `/blueprint` verifies the signed report token, rejects invalid access, and enters the card app only for `CARD_APP_SLUG` before calling `appReadingLibrary`. The existing report and legacy paths remain unchanged.
- The public product sample still builds only the fixed July 14, 1988 birthday and fixed sample connection. Its accepted query parameter is the bounded local calendar date; it does not expose buyer inputs or token access.
- The selector matches the engine's seven actual birth-stream card/planet pairs. It includes Long Range, Pluto and Result, plus Environment and Displacement only when assigned. No ruling-stream, other-year or full-corpus selection is passed.
- Runtime manuscript imports occur in the selector, reached from the two server routes. `PeriodApp.tsx` imports only the reading types and receives the selected object. Reading text is rendered as React text, with no HTML injection or model call.
- The native `details` element is keyed by reading ID, so changing readings replaces and closes it. Leaving the period screen unmounts it; returning provides a closed, reopenable reading. Existing period navigation, engine dates, selected-period reset on current-period/birthday-year changes, `LocalDateSync`, and the original `CardAppView` path are preserved.
- `CARD_APP_ON_SALE = false`, checkout behavior, entitlement code and the existing app's data remain unchanged. Added CSS is scoped to the title and expandable reading.

Validation performed: source/diff inspection, repository-wide import search, actual token verifier and route control-flow inspection, and review of the new and existing targeted tests. No implementation files were edited, no commits or external calls were made.

Validation limits: the final 21 Clubs entries were still being authored at handoff. Missing readings are expected authoring state and are not reported as regressions. Targeted tests, complete-corpus checks, production build/client-bundle inspection and interactive browser checks were not run by this reviewer. Static rendering tests do not prove native expand/collapse, keyboard behavior or client state transitions. Root/editor owns final source counts and post-completion tests.
