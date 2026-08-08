/**
 * Renders one representative micro-reading per standard birth card and
 * writes a Markdown review artifact. Fails closed on missing coverage or
 * banned language.
 *
 * Usage: bun scripts/elroy-copy-audit.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { publicBirthCardCode } from "../lib/birth-card-truth";
import { buildElroyMicroReading } from "../lib/elroy/micro-reading";

const BANNED =
  /\b(PTSD|diagnos(?:e|is)|bipolar|narcissis(?:m|t)|cancerous|abuse history)\b/i;

const outPath = join(
  import.meta.dir,
  "..",
  "reports",
  "elroy-micro-reading-copy-review.md",
);

const seen = new Map<string, string>(); // card -> birthdate
const sections: string[] = [
  "# Elroy micro-reading copy review",
  "",
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  "",
  "One representative date per standard birth card. December 31 (Joker) is excluded by design.",
  "",
];

for (let month = 1; month <= 12; month += 1) {
  const days = new Date(Date.UTC(2024, month, 0)).getUTCDate();
  for (let day = 1; day <= days; day += 1) {
    if (month === 12 && day === 31) continue;
    const code = publicBirthCardCode(month, day);
    if (code === "Joker" || seen.has(code)) continue;
    const birthdate = `2000-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    seen.set(code, birthdate);
    const result = buildElroyMicroReading(birthdate);
    for (const [key, value] of Object.entries(result.reading)) {
      if (value.length > 420) {
        throw new Error(`${code} ${key} exceeds 420 chars (${value.length})`);
      }
      if (BANNED.test(value)) {
        throw new Error(`${code} ${key} contains banned language`);
      }
      if (/https?:\/\//i.test(value) || /<[^>]+>/.test(value)) {
        throw new Error(`${code} ${key} contains HTML or URL`);
      }
      if (/  +/.test(value) || /[.!?]{2,}/.test(value)) {
        throw new Error(`${code} ${key} has awkward spacing/punctuation`);
      }
    }
    sections.push(
      `## ${result.card.birthCardLabel} (\`${result.card.birthCard}\`)`,
      "",
      `- Representative date: ${birthdate}`,
      `- Ruling: ${result.card.rulingCards.join(", ")}`,
      "",
      `**Core:** ${result.reading.core}`,
      "",
      `**Tension:** ${result.reading.tension}`,
      "",
      `**Reflection:** ${result.reading.reflection}`,
      "",
      `**Disclaimer:** ${result.reading.disclaimer}`,
      "",
    );
  }
}

if (seen.size !== 52) {
  throw new Error(`Expected 52 standard cards, found ${seen.size}`);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, sections.join("\n"), "utf8");
console.log(`PASS: wrote ${seen.size} cards to ${outPath}`);
