#!/usr/bin/env bun
// Builds a self-contained reading.html that:
//   - Bundles the cardology engine + all card data via bun build
//   - Streams a reading from a local Ollama instance (qwen3:8b)
//   - Zero network calls beyond localhost

import { $ } from "bun";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { READING_INTERPRETATION_GUIDE } from "../lib/interpretation-guidance";

const ENTRY = "/tmp/_cardology_html_entry.ts";
const BUNDLE = "/tmp/_cardology_html_bundle.js";

// Minimal browser entry — exposes getReading + lookup tables on window
writeFileSync(ENTRY, `
import { buildReading } from "${import.meta.dir}/../lib/reading";
import THREE_LENS from "${import.meta.dir}/../lib/card-meanings.json";
import CARD_DESCRIPTIONS from "${import.meta.dir}/../lib/engine-data/card-descriptions.json";
import PLANET_DOMAINS from "${import.meta.dir}/../lib/engine-data/planet-domains.json";

(window as any).__cardology = { buildReading, THREE_LENS, CARD_DESCRIPTIONS, PLANET_DOMAINS };
`);

await $`bun build ${ENTRY} --outfile ${BUNDLE} --target browser --bundle`.quiet();
const bundle = readFileSync(BUNDLE, "utf8");
unlinkSync(ENTRY);
unlinkSync(BUNDLE);

const systemPrompt = READING_INTERPRETATION_GUIDE.trim();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cardology Reading</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0a;
    color: #e8e0d0;
    font-family: 'Georgia', serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px 80px;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: normal;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a96e;
    margin-bottom: 40px;
  }

  form {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    margin-bottom: 48px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #888;
  }

  input[type="date"], input[type="text"] {
    background: #161616;
    border: 1px solid #2a2a2a;
    color: #e8e0d0;
    padding: 10px 14px;
    font-size: 0.95rem;
    font-family: 'Georgia', serif;
    border-radius: 4px;
    outline: none;
    width: 180px;
  }

  input:focus { border-color: #c9a96e; }

  button {
    background: #c9a96e;
    color: #0a0a0a;
    border: none;
    padding: 11px 24px;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 4px;
    font-family: 'Georgia', serif;
    font-weight: bold;
  }

  button:hover { background: #dbbf85; }
  button:disabled { background: #444; color: #888; cursor: default; }

  #cards {
    display: flex;
    gap: 16px;
    margin-bottom: 40px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .card-chip {
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 14px 20px;
    text-align: center;
    min-width: 120px;
  }

  .card-chip .label {
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 6px;
  }

  .card-chip .code {
    font-size: 1.6rem;
    color: #c9a96e;
  }

  #reading {
    max-width: 680px;
    width: 100%;
    line-height: 1.8;
    font-size: 1rem;
  }

  #reading h1, #reading h2, #reading h3 {
    color: #c9a96e;
    font-weight: normal;
    letter-spacing: 0.05em;
    margin: 1.6em 0 0.6em;
    text-transform: none;
    font-size: 1.1rem;
  }

  #reading p { margin-bottom: 1em; color: #d4ccc0; }

  #reading strong { color: #e8e0d0; }

  #reading em { color: #aaa; font-style: italic; }

  #reading hr {
    border: none;
    border-top: 1px solid #222;
    margin: 1.6em 0;
  }

  #error {
    color: #c0392b;
    font-size: 0.9rem;
    margin-bottom: 16px;
    display: none;
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: #c9a96e;
    animation: blink 1s step-end infinite;
    vertical-align: text-bottom;
    margin-left: 2px;
  }

  @keyframes blink { 50% { opacity: 0; } }
</style>
</head>
<body>

<h1>Cardology</h1>

<form id="form">
  <div class="field">
    <label>Birthdate</label>
    <input type="text" id="birthdate" placeholder="MM/DD/YYYY" required>
  </div>
  <div class="field">
    <label>Target date (optional)</label>
    <input type="text" id="targetdate" placeholder="MM/DD/YYYY">
  </div>
  <button type="submit" id="btn">Read</button>
</form>

<div id="error"></div>
<div id="cards"></div>
<div id="reading"></div>

<script>
${bundle}
</script>
<script>
(function() {
const __c = window.__cardology;
const THREE_LENS = __c.THREE_LENS;
const CARD_DESCRIPTIONS = __c.CARD_DESCRIPTIONS;
const PLANET_DOMAINS = __c.PLANET_DOMAINS;

const SYSTEM_PROMPT = ${JSON.stringify(systemPrompt)};

const CARD_LABELS = [
  { key: 'birth',    label: 'Birth Card' },
  { key: 'period52', label: '52-Day' },
  { key: 'longRange',label: 'Long Range' },
  { key: 'pluto',    label: 'Pluto (Year)' },
];

function cardCtx(code) {
  const m = THREE_LENS[code] || {};
  const d = CARD_DESCRIPTIONS[code] || {};
  return { code, name: m.name || code, title: d.title || null,
    core_identity: d.core_identity || null, shadow: d.shadow || null,
    life_direction: d.life_direction || null,
    under: m.under || null, sweet_spot: m.sweet_spot || null, over: m.over || null };
}

function toISO(val) {
  val = val.trim();
  // accept MM/DD/YYYY or YYYY-MM-DD
  const us = val.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
  if (us) return \`\${us[3]}-\${us[1].padStart(2,'0')}-\${us[2].padStart(2,'0')}\`;
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(val)) return val;
  return null;
}

function buildPrompt(r) {
  const birth    = cardCtx(r.archetype.birth_card);
  const period52 = cardCtx(r.active_period.bc_card);
  const longRange = cardCtx(r.long_range.bc.card);
  const pluto    = cardCtx(r.birth_card_spread.pluto);
  const planet   = r.active_period.planet;
  const domain   = r.active_period.domain;
  const lrPlanet = r.long_range.bc.planet;

  return \`You are generating a Cardology reading for someone. Here are their four active cards with full contextual meanings.

---

## BIRTH CARD: \${birth.code} — \${birth.title || birth.name}
**Core identity:** \${birth.core_identity}
**Shadow:** \${birth.shadow}
**Life direction:** \${birth.life_direction}
**Underuse:** \${birth.under}
**Sweet spot:** \${birth.sweet_spot}
**Overuse:** \${birth.over}

---

## CURRENT 52-DAY CARD: \${period52.code} — \${period52.name}
Active during the \${planet} period (domain: \${domain}).
**Underuse:** \${period52.under}
**Sweet spot:** \${period52.sweet_spot}
**Overuse:** \${period52.over}

---

## LONG RANGE (YEAR): \${longRange.code} — \${longRange.name}
Governed by \${lrPlanet}.
**Underuse:** \${longRange.under}
**Sweet spot:** \${longRange.sweet_spot}
**Overuse:** \${longRange.over}

---

## PLUTO CARD (YEAR): \${pluto.code} — \${pluto.name}
The unconscious pattern being pressured to change this year.
**Underuse:** \${pluto.under}
**Sweet spot:** \${pluto.sweet_spot}
**Overuse:** \${pluto.over}

---

Write a cohesive reading weaving all four cards. Second person, present tense. Cover:
1. Who they are through their Birth Card
2. What the current 52-day chapter is asking of them
3. How the year's Long Range theme shapes everything
4. What the Pluto card is forcing them to transform

Be specific, direct, punchy. No vague generalities.\`;
}

function renderCards(r) {
  const items = [
    { label: 'Birth Card',      code: r.archetype.birth_card },
    { label: '52-Day',          code: r.active_period.bc_card },
    { label: 'Long Range',      code: r.long_range.bc.card },
    { label: 'Pluto (Year)',    code: r.birth_card_spread.pluto },
  ];
  const el = document.getElementById('cards');
  el.innerHTML = items.map(c => \`
    <div class="card-chip">
      <div class="label">\${c.label}</div>
      <div class="code">\${c.code}</div>
    </div>
  \`).join('');
}

function renderMarkdown(raw) {
  return raw
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\\n\\n+/g, '</p><p>')
    .replace(/^(?!<[hHpP]|<hr)(.+)$/gm, '$1');
}

async function streamReading(r) {
  const readingEl = document.getElementById('reading');
  readingEl.innerHTML = '<span class="cursor"></span>';

  const prompt = buildPrompt(r);
  let raw = '';

  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:8b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt },
        ],
        stream: true,
        think: false,
      }),
    });

    if (!res.ok) throw new Error(\`Ollama \${res.status}: \${await res.text()}\`);

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const delta = json.message?.content || '';
          raw += delta;
          // strip qwen3 think blocks
          const visible = raw.replace(/<think>[\\s\\S]*?<\\/think>/g, '').trimStart();
          readingEl.innerHTML = '<p>' + renderMarkdown(visible) + '</p><span class="cursor"></span>';
          window.scrollTo(0, document.body.scrollHeight);
        } catch { /* partial line */ }
      }
    }
  } catch (e) {
    readingEl.innerHTML = \`<p style="color:#c0392b">Ollama error: \${e.message}<br>Make sure Ollama is running: <code>ollama serve</code></p>\`;
  }

  // Remove cursor when done
  const cursor = readingEl.querySelector('.cursor');
  if (cursor) cursor.remove();
}

async function runReading() {
  const errEl = document.getElementById('error');
  errEl.style.display = 'none';

  const bdRaw = document.getElementById('birthdate').value;
  const tdRaw = document.getElementById('targetdate').value;

  const birthISO = toISO(bdRaw);
  if (!birthISO) {
    errEl.textContent = 'Invalid birthdate — use MM/DD/YYYY';
    errEl.style.display = 'block';
    return;
  }

  const targetISO = tdRaw ? toISO(tdRaw) : undefined;
  if (tdRaw && !targetISO) {
    errEl.textContent = 'Invalid target date — use MM/DD/YYYY';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('btn');
  btn.disabled = true;
  btn.textContent = 'Reading…';
  document.getElementById('cards').innerHTML = '';
  document.getElementById('reading').innerHTML = '';

  try {
    const reading = await __c.buildReading(birthISO, targetISO);
    renderCards(reading);
    await streamReading(reading);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Read';
  }
}

document.getElementById('form').addEventListener('submit', (e) => { e.preventDefault(); runReading(); });
document.getElementById('btn').addEventListener('click', (e) => { e.preventDefault(); runReading(); });
})();
</script>
</body>
</html>`;

const outPath = `${import.meta.dir}/../reading.html`;
writeFileSync(outPath, html);
console.log(`Built: ${outPath} (${(html.length / 1024).toFixed(0)} KB)`);
