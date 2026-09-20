import { expect, test } from "bun:test";
import { buildProfessionalReading } from "./builder";
const cass = () => buildProfessionalReading("Cass", "1991-02-17", "2026-09-01");
test("client name accepts 60 unbroken characters and rejects 61", () => {
  const name = "W".repeat(60);
  const r = buildProfessionalReading(name, "1991-02-17", "2026-09-01");
  expect(r.name).toBe(name);
  expect(renderReport(r)).toMatch(new RegExp(`<h1[^>]*>${name}</h1>`));
  expect(() => buildProfessionalReading(name + "W", "1991-02-17", "2026-09-01")).toThrow("Client name must be 1 to 60 characters");
});

test("cover names above 30 characters use compact styling while normal names stay unchanged", () => {
  for (const name of ["Cass", "W".repeat(30), "W".repeat(31), "W".repeat(60)]) {
    const html = renderReport(buildProfessionalReading(name, "1991-02-17", "2026-09-01"));
    expect(html.match(/<h1\b[^>]*>.*?<\/h1>/)?.[0]).toBe(
      name.length > 30 ? `<h1 class="cover-name-compact">${name}</h1>` : `<h1>${name}</h1>`,
    );
  }
});

test("year 9999 periods retain the next-year boundary and active period", () => {
  const r = buildProfessionalReading("Boundary", "1991-02-17", "9999-12-30");
  expect(r.periods[6].end).toBe("+010000-02-16");
  expect(r.periods.filter(p => p.active).map(p => p.planet)).toEqual(["Neptune"]);
  for (let i = 0; i < 7; i++) {
    const p = r.periods[i];
    expect((Date.parse(p.end) - Date.parse(p.start)) / 86400000 + 1).toBe(i < 6 ? 52 : 53);
    if (i) expect(Date.parse(p.start) - Date.parse(r.periods[i - 1].end)).toBe(86400000);
  }
});

test("Cass annual walk is engine-generated", () => {
  const r = cass();
  expect(r.age).toBe(35);
  expect(r.anchors[0].card).toBe("8♦");
  expect(r.anchors[1].card).toBe("5♣");
  expect(r.anchors[0].walk).toEqual(["7♦", "8♠", "10♥", "2♠", "J♠", "J♣", "5♥", "3♦", "K♦"]);
  expect(r.anchors[0].longRange.cards[r.slot]).toBe("Q♠");
  expect(r.indexes).toEqual({ annual: 35, period: 36, longRange: 6 });
});

test("invalid inputs are refused before calculation", () => {
  for (const [birth, target] of [["1991-02-30", "2026-09-01"], ["no", "2026-09-01"], ["1991-02-17", "2026-13-01"], ["1991-02-17", "2026-02-29"], ["1991-02-17", "1990-02-17"], ["2991-02-17", "2992-02-17"]]) {
    expect(() => buildProfessionalReading("Cass", birth, target)).toThrow();
  }
  expect(() => buildProfessionalReading(" ", "1991-02-17", "2026-09-01")).toThrow();
  try { buildProfessionalReading("Joker", "1991-12-31", "2026-09-01"); throw Error("accepted Joker"); }
  catch (error) { expect((error as {code: string}).code).toBe("JOKER_UNSUPPORTED"); }
});

test("inclusive periods tile ordinary and leap birthday years", () => {
  for (const [birth, target, start, end, length] of [
    ["1991-02-17", "2026-09-01", "2026-02-17", "2027-02-16", 53],
    ["1991-02-17", "2024-09-01", "2024-02-17", "2025-02-16", 54],
    ["2000-02-29", "2025-02-28", "2025-02-28", "2026-02-27", 53],
    ["2000-02-29", "2024-02-28", "2023-02-28", "2024-02-28", 54],
  ] as const) {
    const r = buildProfessionalReading("Calendar", birth, target);
    expect(r.periods).toHaveLength(7);
    expect(r.periods[0].start).toBe(start);
    expect(r.periods[6].end).toBe(end);
    for (let i = 0; i < 7; i++) {
      const p = r.periods[i];
      expect((Date.parse(p.end) - Date.parse(p.start)) / 86400000 + 1).toBe(i < 6 ? 52 : length);
      if (i) expect(Date.parse(p.start) - Date.parse(r.periods[i-1].end)).toBe(86400000);
    }
    expect(r.periods.filter(p => p.active)).toHaveLength(1);
  }
});

import { cardology } from "../../lib/engine-core/engine.js";
test("every PRC and annual environment use authoritative lookup including projections", () => {
  let maximum = 0;
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const date = new Date(2000, m-1, d);
    if (date.getMonth() !== m-1 || (m === 12 && d === 31)) continue;
    const birth = `2000-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const r = buildProfessionalReading("Lookup", birth, "2026-09-01");
    const lookup = cardology.getPlanetaryRulingCard(m,d);
    const prcs = Array.isArray(lookup) ? lookup : lookup ? [lookup] : [];
    maximum = Math.max(maximum, prcs.length);
    expect(r.anchors.slice(1).map(a => a.card)).toEqual(prcs);
    for (const anchor of r.anchors) {
      expect(anchor.annual).toEqual(cardology.getEnvironmentDisplacement(anchor.card, r.age % 90));
      expect(anchor.walk).toEqual(cardology.cardsFrom(anchor.card, (r.age+1)%90, 9));
      expect(anchor.longRange.cards).toEqual(cardology.cardsFrom(anchor.card, Math.floor(r.age/7)+1, 7));
    }
  }
  expect(maximum).toBeGreaterThanOrEqual(3);
  for (const age of [90, 91, 126, 630]) {
    const r = buildProfessionalReading("Projection", "1900-02-17", `${1900+age}-09-01`);
    expect(r.projection).toBe(true);
    expect(r.anchors[0].annual).toEqual(cardology.getEnvironmentDisplacement("8♦", age % 90));
    expect(r.anchors[0].walk).toEqual(cardology.cardsFrom("8♦", (age+1)%90, 9));
    expect(r.anchors[0].longRange.cards).toEqual(cardology.cardsFrom("8♦", Math.floor(age/7)+1, 7));
  }
  // Jan 1 = fixed K♠: no invented annual pair.
  expect(buildProfessionalReading("Fixed", "1991-01-01", "2026-09-01").anchors[0].annual).toBeNull();
});

test("boards contain exact complete engine layouts and deduplicate coincident indexes", () => {
  for (const r of [cass(), buildProfessionalReading("Infant", "2026-02-17", "2026-09-01")]) {
    expect(r.boards.map(b=>b.index)).toEqual([...new Set([0, r.indexes.annual, r.indexes.period, r.indexes.longRange % 90])]);
    for (const board of r.boards) {
      expect(board.grid.flat()).toHaveLength(49);
      expect(board.crown).toHaveLength(3);
      expect({grid:board.grid, crown:board.crown}).toEqual(cardology.getSpread(board.index));
      expect(new Set([...board.grid.flat(), ...board.crown]).size).toBe(52);
      expect(board.jobs.length).toBeGreaterThan(0);
    }
  }
});

test("congruence is exactly repeated codes across distinct named roles", () => {
  const r = cass();
  const roles = new Map<string,string[]>();
  const add = (card:string, role:string) => roles.set(card,[...(roles.get(card)??[]),role]);
  for(const a of r.anchors) {
    add(a.card, a.id);
    a.walk.forEach((c,i)=>add(c, `${a.id} ${[...cardology.PLANET_NAMES,"Pluto","Result"][i]}`));
    a.longRange.cards.forEach((c,i)=>add(c, `${a.id} Long Range slot ${i+1}`));
    if(a.annual) { add(a.annual.environment,`${a.id} Environment`); add(a.annual.displacement,`${a.id} Displacement`); }
  }
  expect(r.congruence).toEqual([...roles].filter(([,v])=>v.length>1).map(([card,roles])=>({card,roles})));
  expect(r.congruence.length).toBeGreaterThan(0);
});

import { renderReport } from "./render";
import meanings from "../../lib/card-meanings.json";
import descriptions from "../../lib/engine-data/card-descriptions.json";
test("print HTML renders engine boards, every role, sourced patterns and references without runtime assets", () => {
  const r = cass();
  const html = renderReport(r);
  for(const token of ["☿","♀","♂","♃","♄","♅","♆","♇","✦","FIXED","PATTERN","YOURS","Cards are coordinates. You choose the meaning.","lib/engine-core/engine.js","docs/cardology-system.md","https://cardblueprints.com/methodology","https://cardblueprints.com/planetary-ruling-card","Annual Environment","Displacement","Lifetime karma","canonical projections","display_orientation","Neptune → Mercury","2026-02-17","2027-02-16","slot 1","Spread 35","Spread 36","Spread 6",meanings["8♦"].sweet_spot,descriptions["8♦"].title]) expect(html).toContain(token);
  expect(html).not.toMatch(/<script|<link|<iframe|<img|@import|url\(/i);
  expect(html).toContain("@page");
  expect(html).toContain("#123a63");
  expect(html).toContain("#735624");
  expect(html).toContain("#eef3f8");
  // Cover lockup: nine seats, one lit, and gold used nowhere else (app/globals.css rule).
  expect([...html.matchAll(/<rect /g)]).toHaveLength(9);
  expect([...html.matchAll(/var\(--gold\)/g)]).toHaveLength(1);
  expect(html).toContain('<span class="brand-word">card blueprint</span>');
  for(const board of r.boards) {
    const part = html.split(`data-spread="${board.index}"`)[1].split("</section>")[0];
    expect([...part.matchAll(/data-cell="grid"/g)]).toHaveLength(49);
    expect([...part.matchAll(/data-cell="crown"/g)]).toHaveLength(3);
    expect([...part.matchAll(/data-code="([^"]+)"/g)].map(m=>m[1])).toEqual([...board.crown.toReversed(), ...board.grid.flatMap(row=>row.toReversed())]);
  }
  for(const a of r.anchors) {
    for(const role of ["anchor", ...Array.from({length:9},(_,i)=>`walk-${i}`), ...Array.from({length:7},(_,i)=>`lr-${i}`), "environment", "displacement"]) expect(html).toContain(`data-marker="${a.id}-${role}"`);
  }
  expect(renderReport(buildProfessionalReading('<script>alert("x")</script>', "1991-02-17", "2026-09-01"))).toContain("&lt;script&gt;");
  const multi = renderReport(buildProfessionalReading("Three", "1991-10-23", "2026-09-01"));
  expect(multi).toContain("PRC3");
  expect(multi).toContain("No annual pair returned: fixed card");
});

test("annual badges belong only to their comparison board and exact seat", () => {
  for (const r of [cass(), buildProfessionalReading("Infant", "2026-02-17", "2026-09-01"), buildProfessionalReading("Projection", "1900-02-17", "1990-09-01")]) {
    const html = renderReport(r);
    const reference = r.boards.find(b => b.index === 0)!;
    const annual = r.boards.find(b => b.index === r.indexes.annual)!;
    const seats = (b: typeof reference) => [...b.crown, ...b.grid.flat()];
    for (const board of r.boards) {
      const part = html.split(`data-spread="${board.index}"`)[1].split("</section>")[0];
      for (const a of r.anchors) for (const [role, index, source] of [["environment", r.indexes.annual, reference], ["displacement", 0, annual]] as const) {
        const cells = [...part.matchAll(/<td\b[^>]*data-code="([^"]+)"[^>]*>(.*?)<\/td>/gs)].filter(m => m[2].includes(`data-marker="${a.id}-${role}"`));
        expect(cells.map(m => m[1])).toEqual(a.annual && board.index === index ? [seats(board)[seats(source).indexOf(a.card)]] : []);
      }
    }
  }
});
