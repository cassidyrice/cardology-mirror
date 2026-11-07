# Motion spec

One principle per interaction, with its numbers, and the vault note each rule came from. The vault is the Kinetic Typography & Animation Vault (`python3 ~/.local/share/kinetic-animation-vault/search_vault.py search "<need>" --json`). Queried once per need on 2026-11-07: hero headline reveal, card flip reveal, scroll choreography, page transition, result reveal, button micro-interaction, reading hold, easing curves. Only notes that matched are cited.

## The layer

CSS animations and transitions driven by tokens, plus one 40-line client component (`components/motion/InView.tsx`) that sets `data-in` when a section enters the viewport. No GSAP, no Framer on marketing pages. Everything moves on `transform` and `opacity` only; nothing animates `width`, `height`, `top`, `left`, `margin` or `padding`; nothing uses `transition: all`. Every animation has a `prefers-reduced-motion: reduce` fallback that keeps the content and drops the travel, and every reveal is visible with scripting off (hidden states exist only under `html.js`).

## Tokens

```css
--dur-micro:  120ms;  /* press, hover tone, focus never (focus is instant) */
--dur-short:  220ms;  /* menus, tab panels in */
--dur-arrive: 480ms;  /* a heading or a picture settling into place */
--dur-turn:   720ms;  /* the card turning to face you */
--dur-swap:   400ms;  /* the stage changing its picture */
--dur-exit:   180ms;  /* anything leaving: 40–50% shorter than its arrival */

--ease-arrive: cubic-bezier(0.16, 1, 0.3, 1);        /* expo.out: 80% of the distance in the first 20% of the time */
--ease-exit:   cubic-bezier(0.55, 0.055, 0.675, 0.19); /* power3.in: accelerates out in one motion */
--ease-move:   cubic-bezier(0.65, 0, 0.35, 1);        /* power3.inOut: a stage reposition or a crossfade */
--ease-settle: cubic-bezier(0.34, 1.28, 0.64, 1);     /* ≈ back.out(1.2), damping ratio ≈ 0.78: one 3–6% overshoot, then still */
--stagger: 80ms;
```

Sources: role-based easing table and the exit rule (`01-kinetic-typography/04-motion-physics-easings-and-spring-math.md` §1); the damping ladder, where ζ 0.70–0.85 "reads premium" and ζ 1.0 is the Apple-keynote settle (§2.1); the opacity and colour spring ban, which is why `--ease-settle` is used on rotation and scale only and never on opacity (§2.1 warning).

## The card turns to face you (the signature)

Principle: the stage never cuts. The ground stays; one object changes state on it. The verdict is a pause, a turn, and a landing.

1. Submit. The form leaves: `opacity 1 → 0`, `translateY(0 → −8px)`, `--dur-exit`, `--ease-exit`. Nothing else moves.
2. Hold. 350ms dead still with the deck still face down on the stage. (Pre-payoff micro-hold of 0.30–0.75s before a verdict, `01-kinetic-typography/01-psychophysics-and-retention-mechanics.md` §3.3.)
3. Turn. The card rotates `rotateY(180deg → 0)` over `--dur-turn` with `--ease-settle`, scaling `0.96 → 1` on the same curve; the film behind it fades to 35% over `--dur-swap` with `--ease-move`; a shadow under the card goes `0 → 1` in opacity, linear, because it only exists while the card is off the table. `perspective: 1200px` on the stage, `backface-visibility: hidden` on both faces. (Object becomes the world and carry-across continuity, `06-advanced-animation-domains/05-causal-scene-transitions-and-speed-graph-camera-rigs.md` §1 rows 2 and 4; the stage that never cuts, row 9.)
4. Land. At 60% of the turn the card's name arrives (`translateY(16px → 0)`, opacity, `--dur-arrive`, `--ease-arrive`), then the two statements at `+--stagger` each, then the 52-day line, then the actions at `+2 × --stagger`. Start the next element when the previous is 30–50% through its arrival (`04-motion-physics…` §3.1 overlap rule), which with a 480ms arrival is the 160–220ms band `--stagger` ×2 sits in.
5. Reading hold. Nothing auto-advances on a web page, so the hold equation governs delay, not duration: the name (3 words) needs 0.5 + 0.3 × 3 = 1.4s before the eye is ready for a paragraph, which is why the statements rise after the name and never with it, and why the primary action is last. (`01-psychophysics…` §3.2.)

Reduced motion: the form is replaced by the verdict in one frame; the card face appears without rotation; the film is already a poster.

Change the birthday: the verdict exits upward in `--dur-exit`, the card turns back to the deck over `--dur-turn`, the form returns in `--dur-arrive`.

## Hero arrival

Principle: frame 0 is the hero. Nothing fades in from black and nothing waits for an animation to be readable.

The h1, the sentence and the form are visible on first paint. Under `html.js` they settle: `translateY(12px → 0)` and `opacity 0.001 → 1`, `--dur-arrive`, `--ease-arrive`, the sentence at +180ms and the form at +360ms (35–50% overlap of a 480ms arrival, `04-motion-physics…` §3.1). The name along the bottom does not animate in; it is there. (Frame 0 is both the thumbnail and the hook, `01-psychophysics…` §2.1.)

## Scroll choreography

Principle: a section's parts arrive once, in reading order, and then hold still.

`InView` sets `data-in` on a section when 15% of it is visible (rootMargin −10% bottom). Its parts (`[data-rise]`: the heading, then the text, then the picture or list) go `translateY(16px → 0)` and `opacity 0 → 1`, `--dur-arrive`, `--ease-arrive`, staggered by `--stagger`. Per-item stagger for list rows is 60ms (`04-motion-physics…` §3.1 standard intervals: list items 40–80ms). Never a stagger across a whole page of prose: on the long reading pages only the title block rises; paragraphs are static.

No parallax. No scrub on anything but the two wordmarks below. No pinned story.

## The scaling wordmark (the dealt signature move)

Principle: the monument is heavy. As the first screen leaves, the name along its bottom scales `1 → 0.94` on a scroll-linked timeline (`animation-timeline: view()`, `animation-range: exit 0% exit 100%`), and the name at the top of the footer grows `0.94 → 1` as the footer enters (`animation-range: entry 0% entry 100%`). Travel under 8%. `transform-origin` at the right edge so the right margin holds. Under `@supports not (animation-timeline: view())` the names are static at 1. Scroll-linked motion is linear by construction: the scroll is the easing, and linear is only right when constant velocity is the literal subject (`04-motion-physics…` §1, last row).

## The stage changes its picture

Principle: the board never moves; the picture on it swaps. Outgoing picture `opacity 1 → 0` in 160ms `--ease-exit`; incoming `opacity 0 → 1` in 240ms `--ease-arrive`, starting as the outgoing passes 50%. No blur (the vault's blur swap is for film, and a filter animation costs paint on a 100svh element). No scale. (`…05-causal-scene-transitions…` §1 row 5, colour flood: the foreground stays locked while the ground changes; row 9, blur swap on one stage.)

Which picture: the readings section reports the offer nearest the vertical centre of the viewport; the hero reports the film or the revealed card; everything else reports the film.

## Tabs (the sample)

Outgoing panel: `opacity 1 → 0`, `translateY(0 → −6px)`, `--dur-exit`, `--ease-exit`. Incoming: `opacity 0 → 1`, `translateY(6px → 0)`, `--dur-short`, `--ease-arrive`, starting as the outgoing ends. The seam is crossed at peak velocity, which is the text match cut's rule (`04-motion-physics…` §4.1). The tab strip itself does not animate; the active state is a weight and colour change with no transition.

## Controls

- Press: `transform: scale(0.98)` on `:active`, `--dur-micro`, `--ease-arrive`.
- Hover: background tone step (accent → `--accent-deep`, cell → one step), `--dur-micro`. One signal per element; images never react.
- Focus: the ring appears instantly. No transition on `outline`.
- Disabled: opacity, `cursor: not-allowed`, and the attribute.

## Details bars (free tools)

No height animation (the Floor forbids it). The panel appears in one frame; its items rise 8px with opacity over `--dur-short`, staggered 60ms, so the eye is led into the list. The plus sign rotates 45° in `--dur-micro`.

## The film

The hero loop autoplays muted, loops, has a poster, and is paused with its poster shown under reduced motion or Save-Data (existing behaviour kept). The explainer never autoplays; it has controls, captions and a poster.

## Page transitions

None. The App Router swaps routes in place; the shared stage and header carry continuity, and worlds never crossfade (`…05-causal-scene-transitions…` §0). Vault search "page transition" matched only the transition and autonomous-UI notes, which are about film; nothing there argues for a route fade, and a fade would delay content.

## What stays still

The board. The header. Running text. Prices. Tables. The card faces on the long pages (they are pinned, not floating; the old 4.8s float loop is retired). The explainer poster. Anything the reader is in the middle of reading.

## Budget and checks

- At most one entrance per element per visit. No animation repeats on scroll back.
- Nothing on the first screen is hidden by motion at 1280×800; the headline, the sentence and the action are painted in frame 0.
- Layout shift from motion: zero. Everything that moves is `transform` or `opacity` in reserved space.
- The tasteskill inspector counts moving elements (floor 8, comfortable 16): the homepage moves the three hero parts, the card turn, the four verdict parts, two wordmarks, and the parts of five sections.
