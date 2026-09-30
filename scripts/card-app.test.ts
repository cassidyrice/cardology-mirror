// Card Blueprint App — every number the app shows must agree with the engine
// surfaces already shipped (lib/reading.ts, lib/year-blueprint.ts) and with
// docs/cardology-system.md. The app model is rebuilt from engine primitives, so
// this is its parity contract.
import { describe, expect, test } from "bun:test";

import { appDateParam, buildCardApp, CARD_APP_SLUG } from "../lib/card-app";
import { buildConnection } from "../lib/card-app-connection";
import { cardology } from "../lib/engine-core/engine.js";
import { buildReading, JokerNotSupportedError } from "../lib/reading";
import { buildYearBlueprint } from "../lib/year-blueprint";
import { CARD_APP_PRODUCT, CARD_APP_ON_SALE, checkoutProductBySlug, instantReportFacts, LIFETIME_LINK_DAYS, productBySlug } from "../lib/products";

// A spread of birthdays across every month, leap day, fixed and semi-fixed cards.
const BIRTHDAYS = [
  "1988-07-14", "1965-03-16", "1946-06-14", "1990-01-01", "1979-02-28",
  "1992-02-29", "2000-12-30", "1955-10-09", "1983-05-05", "1971-08-22",
  "1999-11-11", "1962-04-30", "1975-09-17", "1996-06-01", "1984-12-01",
];
const TARGETS = ["2026-09-29", "2026-01-15", "2025-06-03", "2027-03-21"];

const cases = BIRTHDAYS.flatMap((b) => TARGETS.map((t) => [b, t] as const)).filter(
  ([b, t]) => b < t,
);

describe("parity with the shipped reading", () => {
  test.each(cases)("%s on %s", (birth, target) => {
    const app = buildCardApp(birth, target);
    const r = buildReading(birth, target);

    expect(app.identity.birth.card.code).toBe(r.archetype.birth_card);
    expect(app.identity.ruling[0]?.card.code ?? null).toBe(r.archetype.prc ?? null);
    expect(app.age).toBe(r.timing.age);

    // Lifetime karma: environment = gift, displacement = challenge (spread 1).
    expect(app.karma.gift?.card.code ?? null).toBe(r.karma.bc_lifetime?.environment ?? null);
    expect(app.karma.challenge?.card.code ?? null).toBe(r.karma.bc_lifetime?.displacement ?? null);

    // The reading times prc[0]; the app skips a ruler that is the birth card
    // (Leos, Aug 22/23), so ruling streams match only when those agree. The
    // "ruling card equal to the birth card" block covers the rest.
    const sameRuler = r.archetype.prc !== r.archetype.birth_card;

    // Year: period cards, Pluto, Result, Long Range.
    app.year.periods.forEach((p) => {
      expect(p.birth.card.code).toBe(r.birth_card_spread.periods[p.planet]);
      if (sameRuler) expect(p.ruling?.card.code).toBe(r.prc_spread.periods[p.planet]);
    });
    expect(app.year.birth.pluto.card.code).toBe(r.birth_card_spread.pluto);
    expect(app.year.birth.result.card.code).toBe(r.birth_card_spread.result);
    expect(app.year.birth.longRange.card.code).toBe(r.long_range.bc.card);
    if (sameRuler) expect(app.year.ruling?.longRange.card.code).toBe(r.long_range.prc.card);

    // Life Spread (spread 1).
    expect(app.lifeSpread.periods.map((p) => p.card.code)).toEqual(r.deep_dive.life_path.cards);

    // Leap-day birthdays: the engine's own period math reads Feb 29 as Mar 1 in
    // non-leap years; the app follows year-blueprint (Feb 28). Skip those two checks.
    if (!birth.endsWith("-02-29")) {
      expect(app.year.current.planet).toBe(r.active_period.planet);
      // Weekly = the ~7.4-day sub-period card inside the active period.
      expect(app.week.current.planet).toBe(r.daily.sub_planet);
      expect(app.week.current.birth.card.code).toBe(r.daily.bc.card);
      if (sameRuler) expect(app.week.current.ruling?.card.code).toBe(r.daily.prc.card);
    }
  });
});

describe("ruling card equal to the birth card", () => {
  test("a Leo whose ruler is the birth card gets no second stream and no echo repeats", () => {
    const app = buildCardApp("1985-08-05", "2026-09-29");
    expect(app.identity.ruling.map((r) => r.card.code)).toEqual([app.identity.birth.card.code]);
    expect(app.day.today.ruling).toBeNull();
    expect(app.day.next.every((d) => d.ruling === null)).toBe(true);
    expect(app.week.all.every((w) => w.ruling === null)).toBe(true);
    expect(app.year.periods.every((p) => p.ruling === null)).toBe(true);
    expect(app.year.ruling).toBeNull();
    expect(app.life.every((row) => row.ruling === null)).toBe(true);
    expect(app.year.signals.some((s) => s.detail.includes("ruling-card"))).toBe(false);
  });

  test.each([
    ["1971-08-22", "2♦"],
    ["1990-08-23", "3♠"],
  ])("%s times its other ruler, %s", (birth, ruler) => {
    const target = "2026-09-29";
    const app = buildCardApp(birth, target);
    const [by, bm, bd] = birth.split("-").map(Number);
    const nine = cardology.extractCards(ruler, cardology.SPREADS[String(app.age + 1)], 9);
    expect(app.year.periods.map((p) => p.ruling?.card.code)).toEqual(nine.slice(0, 7));
    expect(app.year.ruling?.pluto.card.code).toBe(nine[7]);
    expect(app.year.ruling?.result.card.code).toBe(nine[8]);
    const w = cardology.getWeekly(ruler, by, bm, bd, new Date(2026, 8, 29, 12));
    expect(app.day.today.ruling?.card.code).toBe(w!.current_card);
    expect(buildConnection("1965-03-16", birth, "X").ruling.map((c) => c.code)).toEqual([ruler]);
  });
});

describe("parity with the 52xSeven year model", () => {
  test.each(cases)("%s on %s", async (birth, target) => {
    const app = buildCardApp(birth, target);
    const year = await buildYearBlueprint(birth, target);
    expect(app.year.start).toBe(year.yearStart);
    expect(app.year.end).toBe(year.yearEnd);
    app.year.periods.forEach((p, i) => {
      expect([p.start, p.end, p.state, p.lengthDays]).toEqual([
        year.chapters[i].start,
        year.chapters[i].end,
        year.chapters[i].state,
        year.chapters[i].lengthDays,
      ]);
    });
    expect(app.year.environment?.card.code ?? null).toBe(year.karma.environment?.card.code ?? null);
    expect(app.year.displacement?.card.code ?? null).toBe(year.karma.displacement?.card.code ?? null);
    expect(app.year.spreads).toEqual(year.spreads);
  });
});

describe("daily card follows getWeekly (cardology-system.md §8)", () => {
  test.each(cases)("%s on %s", (birth, target) => {
    const app = buildCardApp(birth, target);
    const [by, bm, bd] = birth.split("-").map(Number);
    const [ty, tm, td] = target.split("-").map(Number);
    const w = cardology.getWeekly(app.identity.birth.card.code, by, bm, bd, new Date(ty, tm - 1, td, 12));
    expect(app.day.today.birth.card.code).toBe(w!.current_card);
    expect(app.day.spreadUsed).toBe(w!.spread_used);
    expect(app.day.next).toHaveLength(6);
    expect(app.day.next[0].date > app.day.today.date).toBe(true);
    // Each of the next six days is its own getWeekly lookup (crosses week and birthday lines).
    for (const n of app.day.next) {
      const [ny, nm, nd] = n.date.split("-").map(Number);
      const nw = cardology.getWeekly(app.identity.birth.card.code, by, bm, bd, new Date(ny, nm - 1, nd, 12));
      expect(n.birth.card.code).toBe(nw!.current_card);
    }
  });

  test("the next six days switch to the new year's spread across a birthday", () => {
    const app = buildCardApp("1988-10-01", "2026-09-29"); // birthday is day 2 of the strip
    for (const n of app.day.next) {
      const [ny, nm, nd] = n.date.split("-").map(Number);
      const nw = cardology.getWeekly(app.identity.birth.card.code, 1988, 10, 1, new Date(ny, nm - 1, nd, 12));
      expect(n.birth.card.code).toBe(nw!.current_card);
    }
  });
});

describe("good days", () => {
  test("every good-day and watch-day rule can fire", () => {
    const titles = new Set<string>();
    for (let doy = 0; doy < 365; doy += 5) {
      const d = new Date(Date.UTC(1985, 0, 1 + doy)).toISOString().slice(0, 10);
      if (d.endsWith("-12-31")) continue;
      for (const e of buildCardApp(d, "2026-09-29").events) titles.add(e.title);
    }
    for (const t of ["Result card day", "Support card day", "Jupiter card day", "Gift card day", "Ruling card day", "Challenge card day", "Saturn card day", "Pluto card day"]) {
      expect(titles.has(t)).toBe(true);
    }
  });

  test("future events never say 'today'", () => {
    const app = buildCardApp("1985-01-01", "2026-09-29");
    for (const e of app.events) {
      if (e.date > app.today) expect(e.detail).not.toMatch(/\btoday\b/i);
    }
  });

  test("the Today screen's 'Coming up' tile shows a good day, never a watch day", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { CardAppView } = await import("../components/card-app/CardApp");
    // 1985-01-01 on 2026-09-29: the first upcoming non-turn event is a Pluto watch day.
    const app = buildCardApp("1985-01-01", "2026-09-29");
    const firstNonTurn = app.events.find((e) => e.kind !== "turn" && e.date > app.today)!;
    expect(firstNonTurn.kind).toBe("watch");
    const firstGood = app.events.find((e) => e.kind === "good" && e.date > app.today)!;
    const html = renderToStaticMarkup(createElement(CardAppView, { data: app, token: "t" }));
    expect(html).toContain(`Coming up · ${firstGood.label}`);
    expect(html).not.toContain(`${firstNonTurn.title}.`);
  });
});

describe("structure", () => {
  test("the seven weekly sub-periods tile the current period with no gap", () => {
    for (const [birth, target] of cases) {
      const app = buildCardApp(birth, target);
      const weeks = app.week.all;
      expect(weeks[0].start).toBe(app.year.current.start);
      expect(weeks[6].end).toBe(app.year.current.end);
      for (let i = 1; i < 7; i++) {
        const prevEnd = Date.parse(weeks[i - 1].end);
        expect(Date.parse(weeks[i].start) - prevEnd).toBe(86_400_000);
      }
      expect(weeks.filter((w) => w.state === "now")).toHaveLength(1);
    }
  });

  test("events are sorted, dated inside the next 12 months, and include turning points", () => {
    const app = buildCardApp("1988-07-14", "2026-09-29");
    const dates = app.events.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
    expect(app.events.some((e) => e.kind === "good")).toBe(true);
    expect(app.events.some((e) => e.title.startsWith("Your birthday"))).toBe(true);
    for (const e of app.events) {
      if (e.end) continue; // a window may have started before today
      expect(e.date >= app.today).toBe(true);
      expect(Date.parse(e.date) - Date.parse(app.today)).toBeLessThan(365 * 86_400_000);
    }
  });

  test("every year of life is present and this year's row matches the year view", () => {
    const app = buildCardApp("1988-07-14", "2026-09-29");
    expect(app.life).toHaveLength(90);
    const row = app.life[app.age];
    expect(row.birth.periods).toEqual(app.year.periods.map((p) => p.birth.card.code));
    expect(row.birth.pluto).toBe(app.year.birth.pluto.card.code);
    expect(row.birth.longRange).toBe(app.year.birth.longRange.card.code);
    expect(row.environment).toBe(app.year.environment?.card.code ?? null);
  });

  test("fixed cards carry no karma cards", () => {
    const fixed = { "1990-01-01": "K♠", "1985-12-10": "8♣", "1980-12-20": "J♥" };
    for (const [birth, code] of Object.entries(fixed)) {
      const app = buildCardApp(birth, "2026-09-29");
      expect(app.identity.birth.card.code).toBe(code);
      expect(app.identity.fixed).toBe(true);
      expect(app.karma.gift).toBeNull();
      expect(app.karma.challenge).toBeNull();
      expect(app.year.environment).toBeNull();
      expect(app.year.displacement).toBeNull();
      expect(app.life.every((l) => l.environment === null && l.displacement === null)).toBe(true);
    }
  });

  test("lifetime buyers past 89 still get a full app (ages wrap mod 90)", () => {
    const app = buildCardApp("1930-07-14", "2026-09-29");
    expect(app.age).toBe(96);
    expect(app.year.periods).toHaveLength(7);
    expect(app.year.spreads.period).toBe(7);
    expect(app.year.spreads.karma).toBe(6);
    expect(app.day.today.birth.card.code).toBeTruthy();
    expect(app.life).toHaveLength(90);
  });

  test("Environment = Displacement is one seat, not a repeat", () => {
    // 1981-03-10 at 45: karma spread 45 pairs K♦ with itself.
    const app = buildCardApp("1981-03-10", "2026-09-29");
    expect(app.year.environment?.card.code).toBe("K♦");
    expect(app.year.displacement?.card.code).toBe("K♦");
    expect(app.year.signals.some((s) => s.detail.includes("Year Environment, Year Displacement"))).toBe(false);
    // Sweep: whenever the pair is one card, no signal counts it twice.
    for (let doy = 0; doy < 365; doy += 3) {
      const d = new Date(Date.UTC(1970, 0, 1 + doy)).toISOString().slice(0, 10);
      if (d.endsWith("-12-31")) continue;
      for (const target of ["2026-09-29", "2015-03-01"]) {
        const a = buildCardApp(d, target);
        if (a.year.environment && a.year.environment.card.code === a.year.displacement?.card.code) {
          expect(a.year.signals.some((s) => s.detail.includes("Year Environment, Year Displacement"))).toBe(false);
        }
      }
    }
  });

  test("a buyer whose local date is the day before a same-day birth still gets the app", () => {
    const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    const born = iso(0);
    expect(appDateParam(iso(-1), born)).toBe(born);
    expect(appDateParam(iso(1), born)).toBe(iso(1));
    expect(() => buildCardApp(born, appDateParam(iso(-1), born))).not.toThrow();
  });

  test("the Long Range strip highlights the theme card at every age, 0 to 120", () => {
    for (let age = 0; age <= 120; age++) {
      const lr = buildCardApp(`${1906 + (120 - age)}-01-01`, "2026-09-29").year.birth.longRange;
      expect(lr.cycle[lr.yearInCycle - 1].code).toBe(lr.card.code);
      expect(lr.cycleStartAge + lr.yearInCycle - 1).toBe(age); // chips carry real ages
      expect(lr.cycleEndAge - lr.cycleStartAge + 1).toBe(lr.cycle.length);
      expect(lr.cycle).toHaveLength(age % 90 >= 84 ? 6 : 7); // cycle 12 holds six years (§9)
      expect(lr.projection).toBe(age >= 90); // §10
    }
  });

  test("December 31 refuses with the Joker error", () => {
    expect(() => buildCardApp("1990-12-31", "2026-09-29")).toThrow(JokerNotSupportedError);
  });

  test("a date before the birthday is refused", () => {
    expect(() => buildCardApp("2030-01-01", "2026-09-29")).toThrow();
  });
});

describe("compatibility", () => {
  test("birth-card seats agree with /api/compatibility (one-way)", () => {
    const c = buildConnection("1965-03-16", "1946-06-14", "Pat");
    const birthOnYours = c.theyOnYou.filter((s) => s.boardAnchor === "birth card" && s.cardAnchor === "birth card");
    const birthOnTheirs = c.youOnThem.filter((s) => s.boardAnchor === "birth card" && s.cardAnchor === "birth card");
    // Matches scripts/compatibility-api.test.ts: B holds A in Mars; A does not hold B.
    expect(birthOnYours).toHaveLength(0);
    expect(birthOnTheirs.map((s) => s.position)).toEqual(["Mars"]);
    expect(c.name).toBe("Pat");
    expect(c.birthCard.name).toBe("Three of Diamonds");
  });

  test("December 31 is refused", () => {
    expect(() => buildConnection("1965-03-16", "1990-12-31", "X")).toThrow(JokerNotSupportedError);
  });
});

describe("product", () => {
  test("$69, one payment, lifetime link", async () => {
    expect(CARD_APP_PRODUCT.price).toBe(69);
    expect(CARD_APP_PRODUCT.priceLabel).toBe("$69");
    expect(CARD_APP_PRODUCT.cta).toContain("$69");
    expect(CARD_APP_PRODUCT.linkDays).toBe(LIFETIME_LINK_DAYS);
    expect(CARD_APP_PRODUCT.deliverable).not.toMatch(/12 months/);

    process.env.REPORT_TOKEN_SECRET ||= "test-secret-card-app";
    const { mintReportToken, verifyReportToken } = await import("../lib/report-token");
    const token = await mintReportToken("a@example.com", CARD_APP_SLUG, "cs_test", "1988-07-14", CARD_APP_PRODUCT.linkDays);
    const payload = await verifyReportToken(token);
    expect(payload?.slug).toBe(CARD_APP_SLUG);
    expect(payload!.exp - Date.now()).toBeGreaterThan(99 * 365 * 86_400_000);
  });

  test("record resolves for fulfillment; checkout only when on sale", () => {
    expect(productBySlug(CARD_APP_SLUG)).toBe(CARD_APP_PRODUCT);
    expect(CARD_APP_PRODUCT.kind === "instant_report" && CARD_APP_PRODUCT.reportSlug).toBe(CARD_APP_SLUG);
    expect(checkoutProductBySlug(CARD_APP_SLUG)).toBe(CARD_APP_ON_SALE ? CARD_APP_PRODUCT : undefined);
  });
});

describe("POST /api/card-app/connection", () => {
  const post = async (body: unknown) => {
    const { POST } = await import("../app/api/card-app/connection/route");
    return POST(
      new Request("https://cardblueprints.com/api/card-app/connection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  };

  test("refuses without an app token, answers with one", async () => {
    process.env.REPORT_TOKEN_SECRET ||= "test-secret-card-app";
    const { mintReportToken } = await import("../lib/report-token");
    const appToken = await mintReportToken("a@example.com", CARD_APP_SLUG, "cs_test", "1965-03-16");
    const otherToken = await mintReportToken("a@example.com", "blueprint-report", "cs_test", "1965-03-16");

    expect((await post({ birthdate: "1946-06-14" })).status).toBe(401);
    expect((await post({ token: otherToken, birthdate: "1946-06-14" })).status).toBe(401);
    expect((await post({ token: appToken, birthdate: "not-a-date" })).status).toBe(400);
    expect((await post({ token: appToken, birthdate: "1990-12-31" })).status).toBe(422);

    const ok = await post({ token: appToken, birthdate: "1946-06-14", name: "Pat" });
    expect(ok.status).toBe(200);
    const data = await ok.json();
    expect(data.name).toBe("Pat");
    expect(data.youOnThem.some((s: { position: string }) => s.position === "Mars")).toBe(true);
  });
});

describe("product page", () => {
  test("renders one main, one H1, the live sample, and no buy button while off sale", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: Page, metadata } = await import("../app/products/card-blueprint-app/page");
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("Card Blueprint App");
    expect(html).toContain("Current period");
    expect(html).toContain("More cards");
    expect(html).toContain("/birth-card-calculator");
    expect(html).toContain("/birth-card-compatibility-calculator");
    expect(html).not.toMatch(/personal-card-blueprint|Personal Card Blueprint/);
    expect(String(metadata.title).length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    if (!CARD_APP_ON_SALE) {
      expect(html).toContain("Opening soon");
      expect(metadata.robots).toEqual({ index: false, follow: true });
    }
  });

  test("the direct buyer period app renders one main", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { PeriodAppView } = await import("../components/card-app/PeriodApp");
    const data = buildCardApp("1988-07-14", "2026-09-29");
    const { appReadingLibrary } = await import("../lib/period-library");
    const html = renderToStaticMarkup(createElement(PeriodAppView, { data, readings: appReadingLibrary(data), token: "t" }));
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  });

  test("the sample shows the visitor's own date, within a day of the server's", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: Page } = await import("../app/products/card-blueprint-app/page");
    const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
    expect(appDateParam(iso(1))).toBe(iso(1));
    expect(appDateParam(iso(-1))).toBe(iso(-1));
    expect(appDateParam(iso(2))).toBeUndefined();
    expect(appDateParam("not-a-date")).toBeUndefined();
    const tomorrow = buildCardApp("1988-07-14", iso(1));
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ date: iso(1) }) }));
    expect(html).toContain(tomorrow.todayLabel);
  });

  test("checkout facts describe an app, not a written report", () => {
    const text = instantReportFacts(CARD_APP_PRODUCT).map((f) => f.value).join(" ");
    expect(text).toContain("Your app opens");
    expect(text).not.toMatch(/report/i);
  });

  test("app sales keep their offer name in analytics", async () => {
    const { sanitizeOfferSlug } = await import("../lib/analytics");
    expect(sanitizeOfferSlug(CARD_APP_SLUG)).toBe(CARD_APP_SLUG);
  });
});
