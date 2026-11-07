# Homepage: critique rounds

Format from tasteskill `references/critique.md` §4. Scores out of 10, Awwwards weighting (design 40, usability 30, creativity 20, content 10).

## Before (main @ c78dcff)

Measured: 14 FAIL tasteskill (eyebrows, 28 hairlines, gradient, 3 shadows at rest, 14px body, 30 text blocks under 13px, 18 font sizes, headlines over two lines at every width, a still page), 73 FAIL hallmark (54 eyebrows, 67 tracked caps, 48 colour literals, 63 glued arrows, 38i the italic clause in the h1).

Read: a competent template. A serif headline with an italic second clause over a dimmed film, a calculator in an ivory card, a four-column offer grid with icon bullets, three article cards with 01/02/03 labels. Nothing in it was decided; the film was the only thing that belonged to this subject and it sat behind a scrim.

Score: design 5.5 · usability 7 · creativity 4 · content 7 → 5.8.

## Round 1 (after the split stage build)

Looked at: 1920, 1280, 768, 390 fold and full page, the reveal state at 1280 and 390, the open readings menu, the mobile menu.

Top three problems, fixed:
1. The h1 ran to three lines at 1920 and 1280 (the column's measure, not the words). Pulled the display clamp to 3.4rem and widened the block to 40rem.
2. The offers were the only section without a picture on desktop (the product shots lived on the stage, which the inspector cannot see change). Put the shot back in each row at 14rem, so the menu reads as a menu with its plates.
3. "Compare with the person you're thinking about" wrapped on a 320px phone; the order buttons carried the full product names and clipped. Reworded to "Compare it with theirs" and "Order on Stan" (the product name stays in the row and in the accessible label).

Also: field edge contrast 1.54:1 → the field border is `--ink-faint` (4.96:1); the skip-ahead line moved above the form so no label sits over the giant name; the closed disclosure panels are taken out of layout (Chrome keeps them boxed and they read as a sideways-scrolling row).

Measured after: tasteskill 0 FAIL 0 WARN at all four widths; hallmark 0 FAIL, 1 REFLEX (72, the plus sign 9px from the bar's edge, then padded), 5 waived on the record (47b the film frame, 77 the 40rem free column, 49b the live product names, 79 the name along the fold), 2 answered (F8, F15).

## Round 2 (wide screens and the fold)

Looked at: 1920 fold, 1280 full page, 390 full page, the reveal at 390.

1. At 1920 the reading column hugged the stage and left air on the right. The column now carries the container's own right inset, and the slip, readings and hero block centre in the half.
2. At 390 the sample title wrapped to four lines; its minimum size dropped to 1.6rem (two lines).
3. The 404 was unstyled: its rules lived in the homepage stylesheet. Moved to the shared chrome sheet.

Score now: design 8 · usability 8.5 · creativity 8 · content 7.5 → 8.0. What still falls short: the slip's dot leaders are the one ornament on the page (the sheet asked for them; they carry the receipt idea, so they stay); the product shots are maroon on a blue sheet and will look better once the owner reshoots them on the drafting paper.

## The idea, checked

"On this page, the one card your birthday pins to the drafting sheet becomes the half of the screen that never moves." A stranger reading the first screen for five seconds sees real playing cards, a seven-word headline, one sentence, a birthday field and a button. Typing a birthday turns the card to face them. That is the page.
