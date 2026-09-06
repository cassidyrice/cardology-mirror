/**
 * SEO uniqueness + E-E-A-T audit for an isolated hub build.
 *
 * Usage:
 *   bun seo-pages/scripts/uniqueness-audit.ts <distDir> <prefix> [--min-unique=200] [--max-sim=0.30] [--report-only] [--json=out.json]
 *   e.g. bun seo-pages/scripts/uniqueness-audit.ts seo-pages/dist-senators senators
 *
 * What it measures (per page under <distDir>/<prefix>/<slug>/index.html):
 *   1. Residual (non-template) content. A 5-word shingle that appears in >= 50% of pages
 *      is "template". Words that only occur inside template shingles do not count as unique.
 *   2. Pairwise similarity of residual shingles (Jaccard). High = near-duplicate pages.
 *   3. Title / meta-description uniqueness across the hub.
 *   4. E-E-A-T on-page signals: author in JSON-LD, dateModified/datePublished, link to
 *      /methodology and /editorial-policy, a Sources block, the "not fortune-telling" trust line.
 *
 * Exit code 1 when any page fails, unless --report-only. Runs under bun or `npx tsx`.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type PageReport = {
  slug: string;
  words: number;
  uniqueWords: number;
  maxSim: number;
  maxSimWith: string | null;
  title: string;
  meta: string;
  eeat: Record<string, boolean>;
  failures: string[];
};

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flag = (name: string, dflt: string) =>
  (args.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split("=")[1];
const distDir = positional[0];
const prefix = positional[1];
if (!distDir || !prefix) {
  console.error("usage: uniqueness-audit.ts <distDir> <prefix> [--min-unique=200] [--max-sim=0.30] [--report-only] [--json=file]");
  process.exit(2);
}
const MIN_UNIQUE = Number(flag("min-unique", "200"));
const MAX_SIM = Number(flag("max-sim", "0.30"));
const REPORT_ONLY = args.includes("--report-only");
const JSON_OUT = args.find((a) => a.startsWith("--json="))?.slice(7);
const SHINGLE = 5;
const TEMPLATE_RATIO = 0.5;

const hubDir = join(distDir, prefix);
if (!existsSync(hubDir)) {
  console.error(`no such hub dir: ${hubDir}`);
  process.exit(2);
}

function visibleText(html: string): string {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = noScript.replace(/<[^>]+>/g, " ");
  return decode(text).replace(/\s+/g, " ").trim();
}
function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/g, " ");
}
function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏ' ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}
function shingles(toks: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i + SHINGLE <= toks.length; i++) out.push(toks.slice(i, i + SHINGLE).join(" "));
  return out;
}
function meta(html: string, re: RegExp): string {
  const m = re.exec(html);
  return m ? decode(m[1]).trim() : "";
}

// Entity masking: a templated sentence with the page's own name / date / card swapped in is
// still template. Tokens from <title> and <h1> (minus generic words) plus all numbers, month
// names and card words are replaced with a placeholder BEFORE shingling, so only prose that
// is genuinely new for this page counts as unique.
const GENERIC = new Set(["birth", "card", "cards", "the", "of", "and", "card's", "blueprints", "blueprint", "coordinate", "coordinates", "a", "an", "s"]);
const MASK_WORDS = new Set([
  "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king", "joker",
  "hearts", "clubs", "diamonds", "spades",
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
]);
function maskTokens(toks: string[], entity: Set<string>): string[] {
  return toks.map((w) => (entity.has(w) || MASK_WORDS.has(w) || /^\d+$/.test(w) ? "§" : w));
}

const slugs = readdirSync(hubDir).filter((s) => statSync(join(hubDir, s)).isDirectory());
const pages = slugs
  .map((slug) => {
    const file = join(hubDir, slug, "index.html");
    if (!existsSync(file)) return null;
    const html = readFileSync(file, "utf8");
    const text = visibleText(html);
    const toks = tokens(text);
    const title = meta(html, /<title>([^<]*)<\/title>/i);
    const h1 = meta(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, " ");
    const entity = new Set(tokens(`${title} ${h1} ${slug.replace(/-/g, " ")}`).filter((w) => !GENERIC.has(w)));
    return { slug, html, text, toks, sh: shingles(maskTokens(toks, entity)) };
  })
  .filter((p): p is NonNullable<typeof p> => p !== null);

if (pages.length === 0) {
  console.error(`no pages under ${hubDir}/*/index.html`);
  process.exit(2);
}

// 1. template shingles = present in >= TEMPLATE_RATIO of pages
const df = new Map<string, number>();
for (const p of pages) for (const s of new Set(p.sh)) df.set(s, (df.get(s) ?? 0) + 1);
const threshold = Math.max(2, Math.ceil(pages.length * TEMPLATE_RATIO));
const template = new Set([...df.entries()].filter(([, n]) => n >= threshold).map(([s]) => s));

// residual = shingles not in template; unique words = words covered by at least one residual shingle
const residual = new Map<string, Set<string>>();
const uniqueWords = new Map<string, number>();
for (const p of pages) {
  const res = new Set<string>();
  const covered = new Set<number>();
  p.sh.forEach((s, i) => {
    if (!template.has(s)) {
      res.add(s);
      for (let k = i; k < i + SHINGLE; k++) covered.add(k);
    }
  });
  residual.set(p.slug, res);
  uniqueWords.set(p.slug, covered.size);
}

// 2. pairwise Jaccard on residual shingles (cap pairs for huge hubs)
const maxSim = new Map<string, { sim: number; with: string | null }>();
for (const p of pages) maxSim.set(p.slug, { sim: 0, with: null });
const limit = pages.length <= 400 ? pages.length : 400;
for (let i = 0; i < limit; i++) {
  for (let j = i + 1; j < limit; j++) {
    const a = residual.get(pages[i].slug)!;
    const b = residual.get(pages[j].slug)!;
    if (a.size === 0 && b.size === 0) continue;
    let inter = 0;
    for (const s of a) if (b.has(s)) inter++;
    const sim = inter / (a.size + b.size - inter || 1);
    if (sim > maxSim.get(pages[i].slug)!.sim) maxSim.set(pages[i].slug, { sim, with: pages[j].slug });
    if (sim > maxSim.get(pages[j].slug)!.sim) maxSim.set(pages[j].slug, { sim, with: pages[i].slug });
  }
}

// 3 + 4. titles, metas, E-E-A-T
const titleCount = new Map<string, number>();
const metaCount = new Map<string, number>();
const reports: PageReport[] = pages.map((p) => {
  const title = meta(p.html, /<title>([^<]*)<\/title>/i);
  const md = meta(p.html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  titleCount.set(title, (titleCount.get(title) ?? 0) + 1);
  metaCount.set(md, (metaCount.get(md) ?? 0) + 1);
  const ld = [...p.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n");
  const eeat = {
    authorInJsonLd: /"author"\s*:/.test(ld),
    publisherInJsonLd: /"publisher"\s*:/.test(ld),
    dateModified: /"dateModified"\s*:/.test(ld) || /datemodified|last (updated|reviewed)/i.test(p.text),
    datePublished: /"datePublished"\s*:/.test(ld),
    methodologyLink: /href="(https:\/\/cardblueprints\.com)?\/methodology/i.test(p.html),
    editorialPolicyLink: /href="(https:\/\/cardblueprints\.com)?\/editorial-policy/i.test(p.html),
    sourcesBlock: /\bSources?:/.test(p.text),
    trustLine: /not fortune-telling|not a forecast/i.test(p.text),
    canonical: /rel="canonical"/.test(p.html),
  };
  return {
    slug: p.slug,
    words: p.toks.length,
    uniqueWords: uniqueWords.get(p.slug) ?? 0,
    maxSim: maxSim.get(p.slug)!.sim,
    maxSimWith: maxSim.get(p.slug)!.with,
    title,
    meta: md,
    eeat,
    failures: [],
  };
});
for (const r of reports) {
  if (r.uniqueWords < MIN_UNIQUE) r.failures.push(`unique words ${r.uniqueWords} < ${MIN_UNIQUE}`);
  if (r.maxSim > MAX_SIM) r.failures.push(`residual similarity ${(r.maxSim * 100).toFixed(0)}% with ${r.maxSimWith} > ${MAX_SIM * 100}%`);
  if ((titleCount.get(r.title) ?? 0) > 1) r.failures.push("duplicate <title>");
  if (!r.meta) r.failures.push("missing meta description");
  else if ((metaCount.get(r.meta) ?? 0) > 1) r.failures.push("duplicate meta description");
  for (const [k, ok] of Object.entries(r.eeat)) if (!ok) r.failures.push(`eeat: ${k}`);
}

const failing = reports.filter((r) => r.failures.length > 0);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const eeatSummary = Object.keys(reports[0].eeat).map((k) => `${k}=${reports.filter((r) => r.eeat[k]).length}/${reports.length}`);

console.log(`\n${prefix}: ${reports.length} pages · template shingles ${template.size} (>= ${threshold} pages)`);
console.log(`  words/page avg ${avg(reports.map((r) => r.words)).toFixed(0)} · unique words avg ${avg(reports.map((r) => r.uniqueWords)).toFixed(0)} (min ${Math.min(...reports.map((r) => r.uniqueWords))}) · max residual sim ${(Math.max(...reports.map((r) => r.maxSim)) * 100).toFixed(0)}%`);
console.log(`  eeat: ${eeatSummary.join(" · ")}`);
console.log(`  FAIL ${failing.length} / PASS ${reports.length - failing.length}  (min-unique=${MIN_UNIQUE}, max-sim=${MAX_SIM})`);
const reasons = new Map<string, number>();
for (const r of failing) for (const f of r.failures) reasons.set(f.replace(/\d+(\.\d+)?%? ?/g, "N ").trim(), (reasons.get(f.replace(/\d+(\.\d+)?%? ?/g, "N ").trim()) ?? 0) + 1);
for (const [why, n] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(4)}  ${why}`);
for (const r of failing.slice(0, 5)) console.log(`  e.g. ${r.slug}: ${r.failures.join("; ")}`);

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ prefix, pages: reports, thresholds: { MIN_UNIQUE, MAX_SIM } }, null, 2));
  console.log(`  wrote ${JSON_OUT}`);
}
if (failing.length && !REPORT_ONLY) process.exit(1);
