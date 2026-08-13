# Blueprint Ambient Authority System

A deterministic SVG/CSS background system that extends the homepage's warm studio and card-motion language across high-intent landing pages without copying the cinematic homepage.

## Visual contract

- Brand tokens only: warm paper, ink, oxblood, bronze, and gold.
- Official homepage journey posters and muted clips are the visual plate.
- SVG geometry is a whisper overlay only; no generated copy, card faces, tarot motifs, or random particles.
- Slow transform/opacity animation with a small progressive-enhancement scroll drift.
- `aria-hidden`, no pointer input, no focusable controls, no layout participation.
- Static under `prefers-reduced-motion`; simplified on mobile and slow-update devices.
- Official stills stay visible; muted clips hide under reduced motion and on mobile.
- Plates fade from the left so calculator copy and CTAs stay readable.

## Variants and routes

| Variant | Visual idea | Routes |
| --- | --- | --- |
| `compatibility` | Homepage scene 02 plate + two-card geometry | `/birth-card-compatibility-calculator` |
| `compatibilityGuide` | Same plate, slower editorial overlay | `/cardology-compatibility` |
| `birthCard` | Homepage scene 01 deck plate | `/birth-card-calculator` |
| `blueprint` | Homepage scene 04 report plate | `/products/personal-card-blueprint` |
| `method` | Homepage scene 03 still only | `/what-is-cardology`, `/methodology` |
| `library` | Homepage scene 01 still only | `/cardology-for-beginners` |

## Usage

```tsx
import { BlueprintAmbient } from "@/components/brand/BlueprintAmbient";

<BlueprintAmbient variant="compatibility" />
```

For paper/product sections, add `tone="paper"`. The parent must already be positioned and clipped if it is not inside `SeoShell`; foreground content should use `relative z-10`.

## Guardrails for future pages

1. Pick the closest existing variant before adding a new one.
2. Keep geometry clear of input labels, CTA contrast areas, and long reading copy.
3. Do not add JS pointer tracking or scroll listeners. Use CSS progressive enhancement only.
4. Test at 390×844 and 1440×1000, including reduced motion.
5. Reject any horizontal overflow, focusable ambient descendants, console errors, or duplicate ambient layers.
6. Preserve the homepage as the highest-motion expression; landing-page variants remain subordinate.
