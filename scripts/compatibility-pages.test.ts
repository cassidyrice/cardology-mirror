import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

import { WorkerPageView } from "../components/seo/WorkerPageView";
import { compatIndexPage, compatPage, compatSlugs } from "../lib/compatibility-pages";
import { canonicalCompatPairPath, compatPathFromForm } from "../lib/compat-routing";
import { renderBornOnSitemap, renderCompatSitemap } from "../lib/worker-port/cardology-unlock.mjs";
import { bornOnSlugs } from "../lib/born-on";
import { middleware } from "../middleware";

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

test("all 1431 compatibility pages offer only the Chemistry Check, with follow-up", () => {
  const pages = [compatIndexPage(), ...compatSlugs().map(slug => compatPage(slug)!)];
  expect(pages).toHaveLength(1431);
  for (const page of pages) {
    for (const offer of ["The Chemistry Check — $24"])
      expect(page.body).toContain(offer);
    expect(page.body).toContain('href="/#chemistry-check"');
    expect(page.body).not.toMatch(/Timing Map|Family Snapshot|free-course/);
    expect(page.body).toContain("Includes seven days of email follow-up.");
    expect(page.body).toContain("within 24 hours");
    expect(page.body).not.toMatch(/\$(97|137|179)\b|you \+ 3 family|inbox within 7 days/);
    expect(page.body).not.toContain('href="https://stan.store/mycardblueprint/p/the-chemistry-check"');
  }
});

test("URL parity: app serves exactly the Worker's sitemap-compatibility.xml set", () => {
  const expected = locs(renderCompatSitemap());
  expect(expected).toHaveLength(1431);
  const served = ["https://cardblueprints.com/compatibility/", ...compatSlugs().map((s) => `https://cardblueprints.com/compatibility/${s}`)];
  expect([...served].sort()).toEqual([...expected].sort());
  for (const slug of compatSlugs()) expect(compatPage(slug)?.canonical).toBe(`https://cardblueprints.com/compatibility/${slug}`);
  expect(compatIndexPage().canonical).toBe("https://cardblueprints.com/compatibility/");
});

test("sitemap-cardology.xml lists the index plus every born-on page the app serves", () => {
  const expected = locs(renderBornOnSitemap());
  expect(expected).toHaveLength(367);
  expect([...expected].sort()).toEqual(
    ["https://cardblueprints.com/born-on/", ...bornOnSlugs().map((s) => `https://cardblueprints.com/born-on/${s}`)].sort(),
  );
});

test("invalid and reversed pairs: no page, middleware 301s reversed order to canonical", () => {
  expect(compatPage("joker")).toBeNull();
  expect(compatPage("ace-of-hearts-and-foo")).toBeNull();
  expect(compatPage("2-of-hearts-and-ace-of-hearts")).toBeNull();
  expect(canonicalCompatPairPath("2-of-hearts-and-ace-of-hearts")).toBe("/compatibility/ace-of-hearts-and-2-of-hearts");
  const res = middleware(new NextRequest("https://cardblueprints.com/compatibility/2-of-hearts-and-ace-of-hearts")) as Response;
  expect(res.status).toBe(301);
  expect(res.headers.get("location")).toBe("https://cardblueprints.com/compatibility/ace-of-hearts-and-2-of-hearts");
  for (const [path, loc] of [
    ["/compatibility", "https://cardblueprints.com/compatibility/"],
    ["/compatibility/ace-of-hearts/", "https://cardblueprints.com/compatibility/ace-of-hearts"],
  ]) {
    const r = middleware(new NextRequest(`https://cardblueprints.com${path}`)) as Response;
    expect(r.status).toBe(301);
    expect(r.headers.get("location")).toBe(loc);
  }
});

test("no-JS calculator POST 303s like the Worker", async () => {
  const form = (a: string, b: string) => { const f = new FormData(); f.set("a", a); f.set("b", b); return f; };
  expect(compatPathFromForm(form("1990-03-14", "1985-07-04"))).toBe("/compatibility/9-of-diamonds-and-jack-of-diamonds");
  expect(compatPathFromForm(form("12-31", "1985-07-04"))).toBe("/born-on/december-31");
  expect(compatPathFromForm(form("x", "1985-07-04"))).toBeNull();
  const res = await middleware(new NextRequest("https://cardblueprints.com/compatibility/", { method: "POST", body: form("1990-03-14", "1985-07-04") }));
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("https://cardblueprints.com/compatibility/9-of-diamonds-and-jack-of-diamonds");
});

test("sample compatibility pages render inside the shared header with Readings", () => {
  for (const page of [compatIndexPage(), compatPage("ace-of-hearts")!, compatPage("ace-of-hearts-and-2-of-hearts")!]) {
    const html = renderToStaticMarkup(createElement(WorkerPageView, { page, kind: "compatibility" }));
    expect(html).toContain("data-readings-menu");
    expect(html).toContain(page.body.slice(0, 200));
  }
  expect(compatPage("ace-of-hearts-and-2-of-hearts")!.title).toBe("Ace of Hearts & 2 of Hearts Compatibility: Chosen Bond");
});
