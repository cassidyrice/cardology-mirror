import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import bible from "../lib/card-bible.json";

const base = "content/period-library";
const suits = ["hearts", "diamonds", "clubs", "spades"];
const planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
const roles = ["Long Range", "Pluto", "Result", "Environment", "Displacement"];
const cards = Object.values(bible).filter((card) => card.code !== "Joker");
const words = (s: string) => s.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
const normalize = (s: string) => words(s.toLowerCase()).join(" ");
const errors: string[] = [];
const warnings: { id: string; field: string; issue: string }[] = [];
const all: any[] = [];
const fileHashes: Record<string, string> = {};
const check = (ok: unknown, message: string) => { if (!ok) errors.push(message); };
const proseFields = ["title", "omenLine", "shadowWatch", "practice", "reflection", "yearlyContext"];
const required = ["id", "cardCode", "planet", ...proseFields, "longReading", "personOrPosture", "significance", "sourceReferences"];
const forbidden = /\b(you will|this will|expect|destiny|fate|manifest(?:ing|ation)?|universe|vibrations?|sacred|divine|journey|the august report|the card bible)\b|[—!]/i;
const placeholders = /\b(TODO|TBD|lorem ipsum|placeholder|insert here|coming soon)\b|\[INSERT/i;
const dates = /\b\d{4}-\d{2}-\d{2}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/i;
const health = /\b(diagnos\w*|disease|cancer|surgery|treatment|pregnan\w*|medication|death|die|dying|symptoms?|clinician|doctor)\b/i;
const certifyText = (id: string, field: string, text: any) => {
  check(typeof text === "string" && text.trim().length > 0, `${id}: empty ${field}`);
  if (typeof text !== "string") return;
  check(!forbidden.test(text), `${id}: prohibited voice in ${field}: ${text.match(forbidden)?.[0]}`);
  check(!placeholders.test(text), `${id}: placeholder in ${field}`);
  check(!dates.test(text), `${id}: embedded calendar date in ${field}`);
  if (health.test(text)) warnings.push({ id, field, issue: `Review health/endings term: ${text.match(health)?.[0]}` });
};
for (const suit of suits) {
  const path = `${base}/${suit}.json`;
  if (!existsSync(path)) { errors.push(`Missing ${path}`); continue; }
  const raw = readFileSync(path, "utf8");
  fileHashes[path] = createHash("sha256").update(raw).digest("hex");
  try {
    const entries = JSON.parse(raw);
    check(Array.isArray(entries) && entries.length === 91, `${suit}: expected 91 entries`);
    all.push(...entries);
  } catch (error) { errors.push(`${path}: ${String(error)}`); }
}
check(all.length === 364, `Expected 364 readings, received ${all.length}`);
const seen = new Set<string>();
const paragraphs = new Map<string, Set<string>>();
const maskedParagraphs = new Map<string, Set<string>>();
const shortFields = new Map<string, Set<string>>();
const grams = new Map<string, Set<string>>();
const lengths: { id: string; words: number; min: number; max: number }[] = [];
for (const entry of all) {
  const card = cards.find((card) => card.code === entry.cardCode);
  const id = String(entry.id);
  check(Boolean(card) && planets.includes(entry.planet), `${id}: invalid card or planet`);
  check(id === `${card?.slug}.${String(entry.planet).toLowerCase()}`, `${id}: unstable id`);
  check(!seen.has(id), `${id}: duplicate pair`); seen.add(id);
  check(required.every((field) => Object.hasOwn(entry, field)), `${id}: missing field`);
  check(Object.keys(entry).every((field) => required.includes(field)), `${id}: unknown field`);
  proseFields.forEach((field) => certifyText(id, field, entry[field]));
  for (const text of [...proseFields.map((field) => entry[field]), ...(entry.longReading ?? [])]) {
    check(typeof text !== "string" || !/\{[^}]+\}/.test(text), `${id}: unresolved variable in authored reading`);
  }
  for (const field of ["omenLine", "shadowWatch", "practice", "yearlyContext"]) {
    const key = `${field}:${normalize(entry[field] ?? "")}`;
    if (!shortFields.has(key)) shortFields.set(key, new Set());
    shortFields.get(key)!.add(id);
  }
  check(words(entry.title ?? "").length >= 3 && words(entry.title ?? "").length <= 6, `${id}: title must be 3–6 words`);
  check(words(entry.omenLine ?? "").length <= 45 && /[.?]$/.test(entry.omenLine ?? ""), `${id}: omen line must be one short finished sentence`);
  check((entry.omenLine?.match(/[.?]/g) ?? []).length === 1, `${id}: omen line has multiple sentences`);
  check((entry.reflection ?? "").endsWith("?"), `${id}: reflection is not a question`);
  check(Array.isArray(entry.longReading) && entry.longReading.length >= 2, `${id}: long reading must be paragraphs`);
  if (!Array.isArray(entry.longReading)) continue;
  const n = words(entry.longReading.join(" ")).length;
  const rank = card?.rank;
  const [min, max] = ["A", "6", "9"].includes(rank ?? "") ? [400, 600] : ["2", "4", "10"].includes(rank ?? "") ? [250, 350] : [150, 250];
  lengths.push({ id, words: n, min, max });
  check(n >= min && n <= max, `${id}: ${n} words, required ${min}–${max}`);
  const significance = rank === "A" ? "threshold" : ["6", "9"].includes(rank ?? "") ? "karmic" : ["2", "4", "10"].includes(rank ?? "") ? "structural" : "standard";
  check(entry.significance === significance, `${id}: wrong significance`);
  if (["J", "Q", "K"].includes(rank ?? "")) certifyText(id, "personOrPosture", entry.personOrPosture);
  else check(entry.personOrPosture === null, `${id}: non-court posture must be null`);
  check(Array.isArray(entry.sourceReferences) && entry.sourceReferences.includes(`card-bible:${entry.cardCode}`) && entry.sourceReferences.includes(`period-filter:${entry.planet}`), `${id}: missing meaning provenance`);
  entry.longReading.forEach((text: string, index: number) => {
    certifyText(id, `longReading[${index}]`, text);
    const normalized = normalize(text);
    if (!paragraphs.has(normalized)) paragraphs.set(normalized, new Set());
    paragraphs.get(normalized)!.add(id);
    let masked = text.toLowerCase();
    for (const item of cards) masked = masked.replaceAll(item.name.toLowerCase(), "card").replaceAll(item.code.toLowerCase(), "card");
    for (const planet of planets) masked = masked.replaceAll(planet.toLowerCase(), "planet");
    const maskedKey = normalize(masked);
    if (!maskedParagraphs.has(maskedKey)) maskedParagraphs.set(maskedKey, new Set());
    maskedParagraphs.get(maskedKey)!.add(id);
    const tokens = words(text.toLowerCase());
    for (let i = 0; i <= tokens.length - 14; i++) {
      const gram = tokens.slice(i, i + 14).join(" ");
      if (!grams.has(gram)) grams.set(gram, new Set());
      grams.get(gram)!.add(id);
    }
  });
}
for (const card of cards) for (const planet of planets) check(seen.has(`${card.slug}.${planet.toLowerCase()}`), `Missing ${card.code} × ${planet}`);
const duplicatedParagraphs = [...paragraphs].filter(([, ids]) => ids.size > 1).map(([text, ids]) => ({ text, ids: [...ids] }));
check(duplicatedParagraphs.length === 0, `${duplicatedParagraphs.length} duplicate long-reading paragraphs`);
const templateParagraphs = [...maskedParagraphs].filter(([, ids]) => ids.size > 1).map(([text, ids]) => ({ text, ids: [...ids] }));
check(templateParagraphs.length === 0, `${templateParagraphs.length} paragraphs differ only by card or planet names`);
const duplicatedFields = [...shortFields].filter(([, ids]) => ids.size > 1).map(([text, ids]) => ({ text, ids: [...ids] }));
check(duplicatedFields.length === 0, `${duplicatedFields.length} identical short-field groups`);
const repeatedPassages = [...grams].filter(([, ids]) => ids.size > 1).map(([text, ids]) => ({ text, ids: [...ids] })).sort((a, b) => b.ids.length - a.ids.length);
let yearly: any[] = [];
let support: any = {};
try {
  yearly = JSON.parse(readFileSync(`${base}/yearly-artifacts.json`, "utf8"));
  check(Array.isArray(yearly) && yearly.length === 260, "Expected 260 yearly artifacts");
  const pair = new Set<string>();
  const readings = new Set<string>();
  for (const entry of yearly) {
    const card = cards.find((card) => card.code === entry.cardCode);
    check(Boolean(card) && roles.includes(entry.role), `${entry.id}: invalid yearly pair`);
    const expectedId = `${card?.slug}.${String(entry.role).toLowerCase().replace(/ /g, "-")}`;
    check(entry.id === expectedId, `${entry.id}: unstable yearly id, expected ${expectedId}`);
    check(!pair.has(expectedId), `${entry.id}: duplicate yearly pair`); pair.add(expectedId);
    for (const field of ["title", "reading", "reflection"]) certifyText(entry.id, field, entry[field]);
    const n = words(entry.reading ?? "").length;
    check(n >= 65 && n <= 110, `${entry.id}: yearly reading ${n} words, required65–110`);
    check(!readings.has(normalize(entry.reading ?? "")), `${entry.id}: duplicate yearly paragraph`); readings.add(normalize(entry.reading ?? ""));
    check(Array.isArray(entry.sourceReferences) && entry.sourceReferences.includes(`card-bible:${entry.cardCode}`), `${entry.id}: missing yearly provenance`);
  }
  for (const card of cards) for (const role of roles) check(pair.has(`${card.slug}.${role.toLowerCase().replace(/ /g, "-")}`), `Missing yearly ${card.code} × ${role}`);
  support = JSON.parse(readFileSync(`${base}/supporting-copy.json`, "utf8"));
  check(support.schemaVersion === 1, "Supporting schema version");
  check(support.chapterIntroductions?.length === 7, "Expected 7 chapter introductions");
  check(support.notifications?.length === 56, "Expected 56 notification records");
  const notices = new Set<string>();
  for (const notice of support.notifications ?? []) {
    const id = `${notice.planet}.${notice.moment}.${notice.tone}`;
    check(!notices.has(id), `Duplicate notification ${id}`); notices.add(id);
    check(planets.includes(notice.planet) && ["before14", "before1", "opening", "midpoint"].includes(notice.moment) && ["plain", "warm"].includes(notice.tone), `Invalid notification ${id}`);
    for (const field of ["title", "body"]) certifyText(id, field, notice[field]);
    check(!health.test(`${notice.title} ${notice.body}`), `${id}: health term in lock-screen copy`);
  }
} catch (error) { errors.push(`Supporting file error: ${String(error)}`); }
const report = {
  generatedAt: new Date().toISOString(), passed: errors.length === 0,
  counts: { readings: all.length, uniquePairs: seen.size, cards: new Set(all.map((e) => e.cardCode)).size, planets: new Set(all.map((e) => e.planet)).size, yearly: yearly.length, notifications: support.notifications?.length ?? 0, chapters: support.chapterIntroductions?.length ?? 0 },
  words: { longReadingTotal: lengths.reduce((n, e) => n + e.words, 0), min: Math.min(...lengths.map((e) => e.words)), max: Math.max(...lengths.map((e) => e.words)) },
  tierCoverage: ["threshold", "karmic", "structural", "standard"].map((tier) => ({ tier, count: all.filter((e) => e.significance === tier).length })),
  errors, warnings, duplicatedParagraphs, templateParagraphs, duplicatedFields, repeatedPassages, lengths, fileHashes,
};
writeFileSync(`${base}/qa/automated-report.json`, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ passed: report.passed, counts: report.counts, words: report.words, errors: errors.slice(0, 25), warnings: warnings.length, duplicateParagraphs: duplicatedParagraphs.length, templateParagraphs: templateParagraphs.length, duplicateShortFields: duplicatedFields.length, repeated14WordPassages: repeatedPassages.length }, null, 2));
if (errors.length) process.exitCode = 1;
