# Blueprint Ambient Authority System

A deterministic SVG/CSS background system that extends the homepage's warm studio and card-motion language across high-intent landing pages without copying the cinematic homepage.

## Visual contract

- Brand tokens only: warm paper, ink, oxblood, bronze, and gold.
- Decorative SVG geometry only; no generated copy, card faces, tarot motifs, or random particles.
- Slow transform/opacity animation with a small progressive-enhancement scroll drift.
- `aria-hidden`, no pointer input, no focusable controls, no layout participation.
- Static under `prefers-reduced-motion`; simplified on mobile and slow-update devices.
- The design sits behind content at 15–20% desktop opacity and 16% mobile opacity.

## Variants and routes

| Variant | Visual idea | Routes |
| --- | --- | --- |
| `compatibility` | Two card frames, intersecting orbits, relationship plexus | `/birth-card-compatibility-calculator` |
| `compatibilityGuide` | Slower editorial version of the relationship map | `/cardology-compatibility` |
| `birthCard` | One-card reveal with restrained orbital structure | `/birth-card-calculator` |
| `blueprint` | Report/card geometry on the warm product hero | `/products/personal-card-blueprint` |
| `method` | Faint deck-system geometry for authority pages | `/what-is-cardology`, `/methodology` |
| `library` | Quiet navigation/learning geometry | `/cardology-for-beginners` |

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
