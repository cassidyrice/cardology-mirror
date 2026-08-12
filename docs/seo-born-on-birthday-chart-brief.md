# Worker brief — `/born-on/` playing-cards birthday chart copy

**Why:** Adjacent long-tail capture for “playing cards birthday chart” / “birthday playing card”.
**Surface:** `cardology-unlock` Worker (`renderDayIndex` in unlock bundle) — **not** Next.js Pages.
**Pages companion:** PR on `app/birth-card-calculator/page.tsx` (FAQ + `#birthday-chart` section).

## Apply in `renderDayIndex()`

**Title (keep close):**
`Playing Cards Birthday Chart: Look Up Any Date | Card Blueprints`

**Meta description:**
`Free playing-cards birthday chart — every date maps to one card in a 52-card deck. Browse all 366 birthdays, or use the calculator for an instant lookup.`

**Body (after H1 intro paragraph), add:**

```html
<p>Looking for a <strong>playing cards birthday chart</strong>? This directory is that chart: pick any month and day to see the birthday playing card, ruling card, and related layers. Prefer typing a date? Use the <a href="/birth-card-calculator">free birth card calculator</a> — same fixed calendar, instant result.</p>
<h2>How to use this chart</h2>
<ul>
<li>Choose a day in the grids below to open that birthday’s page.</li>
<li>Or jump to the <a href="/birth-card-calculator">playing card birth card calculator</a> if you already know the date.</li>
<li>Then read the full meaning on the matching <a href="/birth-card">birth card</a> page.</li>
</ul>
```

Keep existing month grids + CTA_BLOCK.

## Deploy
Boss/Cass only — `wrangler` deploy of cardology-unlock from the recovered bundle (or canonical unlock tree). Smoke: `/born-on/` title + calculator link; sample day page still 200.
