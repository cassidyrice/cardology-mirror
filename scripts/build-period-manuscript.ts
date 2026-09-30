import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import bible from "../lib/card-bible.json";
import { buildCardApp } from "../lib/card-app";
import { appReadingLibrary, PERIOD_ARTIFACTS, YEARLY_ARTIFACTS } from "../lib/period-library";

const base = "content/period-library";
const report = JSON.parse(readFileSync(`${base}/qa/automated-report.json`, "utf8"));
if (!report.passed) throw new Error("Validate and fix the library before building deliverables");
const support = JSON.parse(readFileSync(`${base}/supporting-copy.json`, "utf8"));
const cards = Object.values(bible).filter((card) => card.code !== "Joker");
const planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
const sort = (a: typeof PERIOD_ARTIFACTS[number], b: typeof PERIOD_ARTIFACTS[number]) => cards.findIndex((card) => card.code === a.cardCode) - cards.findIndex((card) => card.code === b.cardCode) || planets.indexOf(a.planet) - planets.indexOf(b.planet);
const readings = [...PERIOD_ARTIFACTS].sort(sort);
const escaped = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const name = (code: string) => cards.find((card) => card.code === code)!.name;
const para = (s: string) => `<p>${escaped(s)}</p>`;
const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema", title: "Card Blueprints period artifacts", type: "array", minItems: 364, maxItems: 364,
  items: { type: "object", additionalProperties: false, required: ["id", "cardCode", "planet", "title", "omenLine", "longReading", "shadowWatch", "practice", "reflection", "yearlyContext", "personOrPosture", "significance", "sourceReferences"], properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+\\.(mercury|venus|mars|jupiter|saturn|uranus|neptune)$" }, cardCode: { enum: cards.map((card) => card.code) }, planet: { enum: planets }, title: { type: "string", minLength: 1 }, omenLine: { type: "string", minLength: 1 },
    longReading: { type: "array", minItems: 2, items: { type: "string", minLength: 1 } }, shadowWatch: { type: "string", minLength: 1 }, practice: { type: "string", minLength: 1 }, reflection: { type: "string", minLength: 1 }, yearlyContext: { type: "string", minLength: 1 }, personOrPosture: { type: ["string", "null"] }, significance: { enum: ["threshold", "karmic", "structural", "standard"] }, sourceReferences: { type: "array", minItems: 2, uniqueItems: true, items: { type: "string", minLength: 1 } },
  } },
};
writeFileSync(`${base}/period-artifacts.json`, JSON.stringify(readings, null, 2) + "\n");
writeFileSync(`${base}/period-artifacts.schema.json`, JSON.stringify(schema, null, 2) + "\n");
const intro = "A complete symbolic reading library for Card Blueprints: 364 card and planetary-period readings, 260 yearly-card readings, seven chapter introductions and supporting notification copy. The text gives you patterns to consider and practical choices to try. It does not claim to predict events or establish scientific facts about your future. Dates and card assignments come from the existing engine at runtime.";
const md = ["# Card Blueprints period reading manuscript", "", intro, "", "## Reading the library", "", "Choose the card assigned to the period and its planet. Your birth card describes your ongoing pattern; it is not automatically the card of every period. The long reading, shadow watch and practice are written for that exact pair. The yearly-context note asks you to compare with the actual yearly cards shown in your app. Court cards describe a person or a posture, without assigning gender or predicting an arrival.", "", "The traditional emphasis labels organize the library: threshold for Aces, karmic for Sixes and Nines, structural for Twos, Fours and Tens, and standard for the other ranks. They are editorial categories, not measurements of danger or fate. Neptune runs to the next birthday and can be longer than 52 days.", "", "## Card index", "", ...cards.map((card) => `- [${card.name}](#${card.slug})`), ""];
const sections: string[] = [];
for (const card of cards) {
  md.push(`## ${card.name}`, "");
  for (const reading of readings.filter((entry) => entry.cardCode === card.code)) {
    md.push(`### ${reading.planet} period`, "", `#### ${reading.title}`, "", reading.omenLine, "", ...reading.longReading.flatMap((text) => [text, ""]));
    if (reading.personOrPosture) md.push("Person or posture", "", reading.personOrPosture, "");
    for (const [label, text] of [["Shadow watch", reading.shadowWatch], ["Working the period", reading.practice], ["Reflection", reading.reflection], ["Yearly context", reading.yearlyContext]]) md.push(`**${label}**`, "", text, "");
    md.push(`Reading ID: ${reading.id}`, "");
    sections.push(`<article id="${reading.id}" data-kind="period" data-suit="${card.suit}" data-planet="${reading.planet}"><p class="eyebrow">${card.name} · ${reading.planet}</p><h2>${escaped(reading.title)}</h2><p class="omen">${escaped(reading.omenLine)}</p>${reading.longReading.map(para).join("")}${reading.personOrPosture ? `<h3>Person or posture</h3>${para(reading.personOrPosture)}` : ""}<h3>Shadow watch</h3>${para(reading.shadowWatch)}<h3>Working the period</h3>${para(reading.practice)}<h3>Reflection</h3>${para(reading.reflection)}<h3>Yearly context</h3>${para(reading.yearlyContext)}<p class="id">${reading.id}</p></article>`);
  }
}
md.push("## Yearly card library", "", "Use only positions and cards the engine actually assigns. Environment and Displacement text is available for every possible card code, but no absent position should be fabricated. Lifetime fixed or semi-fixed karma and the per-year Environment or Displacement are different calculations.", "");
for (const card of cards) {
  md.push(`### ${card.name}`, "");
  for (const entry of YEARLY_ARTIFACTS.filter((entry) => entry.cardCode === card.code)) {
    md.push(`#### ${entry.role}`, "", entry.title, "", entry.reading, "", entry.reflection, "", `Reading ID: ${entry.id}`, "");
    sections.push(`<article id="${entry.id}" data-kind="yearly" data-suit="${card.suit}" data-planet=""><p class="eyebrow">${card.name} · ${entry.role}</p><h2>${escaped(entry.title)}</h2>${para(entry.reading)}<h3>Reflection</h3>${para(entry.reflection)}<p class="id">${entry.id}</p></article>`);
  }
}
md.push("## Chapter writing and supporting copy", "");
const appendObject = (value: any, level: number) => {
  if (typeof value === "string") md.push(value, "");
  else if (Array.isArray(value)) value.forEach((item) => appendObject(item, level));
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) {
    md.push(`${"#".repeat(Math.min(level, 6))} ${key.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase())}`, ""); appendObject(child, level + 1);
  }
};
appendObject(support, 3);
md.push("## Writing style guide", "", readFileSync(`${base}/STYLE-GUIDE.md`, "utf8"), "");
writeFileSync(`${base}/MANUSCRIPT.md`, md.join("\n"));
const supportHtml = (value: any, depth = 3): string => typeof value === "string" ? para(value) : Array.isArray(value) ? value.map((item) => supportHtml(item, depth)).join("") : value && typeof value === "object" ? Object.entries(value).map(([key, child]) => `<h${Math.min(depth, 6)}>${escaped(key.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase()))}</h${Math.min(depth, 6)}>${supportHtml(child, depth + 1)}`).join("") : "";
sections.push(`<article id="supporting-writing" data-kind="support" data-suit="" data-planet=""><h2>Chapter and supporting writing</h2>${supportHtml(support)}<h2>Writing style guide</h2><div class="style-guide">${readFileSync(`${base}/STYLE-GUIDE.md`, "utf8").split("\n\n").map(para).join("")}</div></article>`);
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Card Blueprints period reading manuscript</title><style>body{margin:0;color:#242322;background:#faf9f6;font:18px/1.65 Georgia,serif}header,main{max-width:68ch;margin:auto;padding:36px 24px}h1{font-size:36px;line-height:1.15;font-weight:500}h2{font-size:29px;line-height:1.25}h3{font:600 15px/1.4 system-ui;margin-top:30px}nav{position:sticky;top:0;z-index:1;background:#faf9f6f5;border-bottom:1px solid #ddd;padding:12px 20px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center}label{font:13px system-ui;display:flex;align-items:center;gap:7px}select,input{padding:10px;border:1px solid #aaa;border-radius:4px;background:white;font:14px system-ui;max-width:100%}input{width:180px}article{padding:35px 0 45px;border-bottom:1px solid #ddd;scroll-margin-top:120px}.eyebrow,.id,#count{font:13px/1.6 system-ui;color:#65615a}.omen{font-size:22px;font-style:italic}button{padding:9px 16px;cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #574b2c;outline-offset:3px}[hidden]{display:none!important}@media(max-width:480px){header,main{padding:24px 18px}body{font-size:17px}h1{font-size:30px}h2{font-size:25px}nav{justify-content:flex-start;padding:10px 14px}input{width:140px}}@media print{nav{display:none}header,main{padding:0;max-width:none}article{break-inside:auto}h2,h3{break-after:avoid}.id{display:none}}</style><header><h1>Card Blueprints period reading manuscript</h1>${para(intro)}<p>This is an editable local manuscript. The JSON records provide the stable app-ready version. Notifications and chapter copy are also preserved in MANUSCRIPT.md and supporting-copy.json.</p></header><nav aria-label="Filter readings"><label>Library<select id="kind"><option value="period">Period readings</option><option value="yearly">Yearly readings</option><option value="support">Supporting writing</option></select></label><label>Suit<select id="suit"><option value="">All suits</option>${["hearts", "diamonds", "clubs", "spades"].map((suit) => `<option value="${suit}">${suit[0].toUpperCase() + suit.slice(1)}</option>`).join("")}</select></label><label>Planet<select id="planet"><option value="">All planets</option>${planets.map((planet) => `<option>${planet}</option>`).join("")}</select></label><label>Search<input id="search" type="search" placeholder="Card, title or phrase"></label><button id="reset" type="button">Reset</button><span id="count" aria-live="polite"></span><a href="card-blueprints-writing.zip" download>Download bundle</a></nav><main>${sections.join("")}<p id="empty" hidden>No readings match. Try clearing the search or changing a filter.</p></main><script>const controls=['kind','suit','planet','search'].map(id=>document.getElementById(id));const articles=[...document.querySelectorAll('article')];const params=new URLSearchParams(location.search);['kind','suit','planet','search'].forEach((key,i)=>{if(params.has(key))controls[i].value=params.get(key)});function filter(){const [kind,suit,planet,search]=controls.map(el=>el.value);let count=0;articles.forEach(el=>{const show=el.dataset.kind===kind&&(kind==='support'||!suit||el.dataset.suit===suit)&&(kind!=='period'||!planet||el.dataset.planet===planet)&&(!search||el.textContent.toLowerCase().includes(search.toLowerCase()));el.hidden=!show;if(show)count++});document.getElementById('count').textContent=count+' readings';document.getElementById('empty').hidden=count>0;controls[2].disabled=kind!=='period';controls[1].disabled=kind==='support'}controls.forEach(el=>el.addEventListener('input',filter));document.getElementById('reset').addEventListener('click',()=>{controls.forEach((el,i)=>el.value=i===0?'period':'');filter()});filter();</script></html>`;
writeFileSync(`${base}/MANUSCRIPT.html`, html);
const sample = buildCardApp("1988-07-17", "2026-09-30");
const sampleCopy = appReadingLibrary(sample);
const example = { label: "Synthetic example computed by the unchanged engine", birthdate: sample.birthdate, targetDate: sample.today, birthCard: sample.identity.birth.card.code, age: sample.age, yearStart: sample.year.start, yearEnd: sample.year.end, yearly: Object.fromEntries(Object.entries(sampleCopy.year).map(([role, entry]) => [role, { cardCode: entry!.cardCode, readingId: entry!.id }])), periods: sample.year.periods.map((period, i) => ({ planet: period.planet, cardCode: period.birth.card.code, start: period.start, end: period.end, lengthDays: period.lengthDays, readingId: sampleCopy.periods[i].id })) };
writeFileSync(`${base}/engine-derived-example.json`, JSON.stringify(example, null, 2) + "\n");
const sources = ["august18-report.md", "august18-prototype-period-meanings.ts.txt", "READING_VOICE.md", "READING_RUBRIC.md", "september29-draft.md"].map((file) => ({ file: `sources/${file}`, sha256: createHash("sha256").update(readFileSync(`${base}/sources/${file}`)).digest("hex") }));
writeFileSync(`${base}/manifest.json`, JSON.stringify({ schemaVersion: 1, sourceDate: "2026-09-30", authorship: "AI-assisted writing with independent AI editorial review; no claim of human approval", interpretation: "Symbolic reflection, not event prediction", runtime: "Card assignments and period dates come exclusively from the existing engine. No model calls.", counts: report.counts, longReadingWords: report.words.longReadingTotal, periodFile: "period-artifacts.json", yearlyFile: "yearly-artifacts.json", supportingFile: "supporting-copy.json", sourceFiles: sources, contentHashes: report.fileHashes, documents: { markdown: "MANUSCRIPT.md", html: "MANUSCRIPT.html", docx: null, limitation: "Workspace document dependency loader returned unsupported for this delegated thread. No DOCX was generated or represented as render-verified." } }, null, 2) + "\n");
console.log(`Built ${readings.length} period readings and ${YEARLY_ARTIFACTS.length} yearly readings into JSON, Markdown and HTML. Example dates computed from engine.`);
