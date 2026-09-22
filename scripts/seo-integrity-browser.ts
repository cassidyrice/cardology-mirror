/**
 * Local rendered smoke for the keyword-strategy SEO integrity pass.
 *
 * SEO_BASE_URL=http://127.0.0.1:3577 bun scripts/seo-integrity-browser.ts
 *
 * Also requires /sitemap.xml on that origin to be HTTP 200 with a parseable
 * urlset. The Worker sitemaps are not on a Next-only server; check all three
 * with `SITEMAP_BASE_URL=https://cardblueprints.com bun run test:sitemap:http`.
 */
import assert from "node:assert/strict";
import {
  chromium,
  type ConsoleMessage,
  type Locator,
  type Page,
} from "playwright";

import { birthCardSlug } from "../lib/birth-card-calculator";
import { buildLifePathProfile } from "../lib/life-path";
import { SITE_URL } from "../lib/site";
import { SPREADS, SPREADS_HUB_PATH } from "../lib/spreads";
import { compatibilityPairPath } from "../lib/worker-seo-routes";
import {
  assertBlueprintReportStaysOffMainSitemap,
  checkSitemapUrl,
} from "./sitemap-http";

const base = (process.env.SEO_BASE_URL || "http://127.0.0.1:3577").replace(
  /\/$/,
  "",
);
const screenshotPath =
  process.env.SEO_SCREENSHOT_PATH || "/tmp/cardblueprints-seo-integrity.png";

type JsonLd = Record<string, unknown>;
type Rect = { x: number; y: number; width: number; height: number };

function collectTypes(value: unknown, type: string): JsonLd[] {
  if (!value || typeof value !== "object") return [];

  const record = value as JsonLd;
  const found = record["@type"] === type ? [record] : [];
  return found.concat(
    Object.values(record).flatMap((child) =>
      Array.isArray(child)
        ? child.flatMap((item) => collectTypes(item, type))
        : collectTypes(child, type),
    ),
  );
}

async function jsonLd(page: Page): Promise<JsonLd[]> {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts
        .map((script) => JSON.parse(script.textContent || "null") as unknown)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter(
          (value): value is Record<string, unknown> =>
            Boolean(value) && typeof value === "object",
        ),
    );
}

function consoleLine(message: ConsoleMessage): string {
  return `${message.type()}: ${message.text()}`;
}

function assertRectWithin(
  inner: Rect | null,
  outer: Rect,
  label: string,
): asserts inner is Rect {
  assert.ok(inner, `${label}: measurable bounds`);
  const tolerance = 1;
  assert.ok(
    inner.x >= outer.x - tolerance &&
      inner.y >= outer.y - tolerance &&
      inner.x + inner.width <= outer.x + outer.width + tolerance &&
      inner.y + inner.height <= outer.y + outer.height + tolerance,
    `${label}: ${JSON.stringify(inner)} within ${JSON.stringify(outer)}`,
  );
}

async function assertMobileCtaIsUsable(
  cta: Locator,
  label: string,
): Promise<void> {
  await cta.waitFor();

  const hitTest = await cta.evaluate(async (ctaElement) => {
    ctaElement.scrollIntoView({ block: "end", inline: "nearest" });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const box = ctaElement.getBoundingClientRect();
    const y = box.top + box.height * 0.25;
    const samples = [0.15, 0.5, 0.7].map((ratio) => {
      const x = box.left + box.width * ratio;
      const hit = document.elementFromPoint(x, y);
      return {
        x,
        y,
        target: hit
          ? `${hit.tagName.toLowerCase()}${hit.className ? `.${String(hit.className).trim().replace(/\s+/g, ".")}` : ""}`
          : "none",
        ctaTarget: Boolean(
          hit && (hit === ctaElement || ctaElement.contains(hit)),
        ),
      };
    });
    return {
      box: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      viewport: { width: innerWidth, height: innerHeight },
      samples,
    };
  });
  assertRectWithin(
    hitTest.box,
    {
      x: 0,
      y: 0,
      width: hitTest.viewport.width,
      height: hitTest.viewport.height,
    },
    `${label}: primary CTA is fully in view`,
  );
  assert.equal(
    hitTest.samples.every((sample) => sample.ctaTarget),
    true,
    `${label}: primary CTA wins hit-testing on the current checkout: ${JSON.stringify(hitTest.samples)}`,
  );
}

async function assertHealthyPage(page: Page, path: string): Promise<void> {
  const current = new URL(page.url());
  assert.equal(current.pathname, path, `${path}: page identity pathname`);
  assert.ok((await page.title()).trim(), `${path}: page identity title`);

  const bodyText = (await page.locator("body").innerText()).trim();
  assert.ok(bodyText.length > 80, `${path}: meaningful body content`);
  assert.doesNotMatch(
    bodyText,
    /Application error|Unhandled Runtime Error|Internal Server Error/i,
    `${path}: no framework error text`,
  );

  const visibleNextOverlay = await page.locator("nextjs-portal").evaluateAll(
    (portals) =>
      portals.some((portal) => {
        const style = getComputedStyle(portal);
        const box = portal.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          box.width > 0 &&
          box.height > 0
        );
      }),
  );
  assert.equal(visibleNextOverlay, false, `${path}: no Next.js error overlay`);
}

async function goto(page: Page, path: string, expectedPath = path): Promise<void> {
  const response = await page.goto(`${base}${path}`, {
    waitUntil: "domcontentloaded",
  });
  assert.ok(response, `${path}: navigation returned a response`);
  assert.ok(response.ok(), `${path}: HTTP ${response.status()}`);
  // SSR controls are visible before React attaches event handlers. Waiting for
  // network idle keeps fast, warm dev-server runs from submitting stale state.
  await page.waitForLoadState("networkidle");
  await assertHealthyPage(page, expectedPath);
}

async function assertOneBreadcrumb(page: Page, path: string): Promise<void> {
  await goto(page, path);

  const visibleTrail = page.locator('nav[aria-label="Breadcrumb"]');
  assert.equal(await visibleTrail.count(), 1, `${path}: one breadcrumb nav`);
  assert.equal(await visibleTrail.isVisible(), true, `${path}: visible breadcrumb nav`);

  const graphs = await jsonLd(page);
  assert.equal(
    graphs.flatMap((graph) => collectTypes(graph, "BreadcrumbList")).length,
    1,
    `${path}: one BreadcrumbList`,
  );
}

async function assertArticle(
  page: Page,
  path: string,
  expectedHeadline: string,
): Promise<void> {
  await goto(page, path);
  const articles = (await jsonLd(page)).flatMap((graph) =>
    collectTypes(graph, "Article"),
  );
  assert.equal(articles.length, 1, `${path}: one Article`);
  assert.equal(articles[0]?.headline, expectedHeadline, `${path}: Article headline`);
  assert.equal(articles[0]?.url, `${SITE_URL}${path}`, `${path}: Article URL`);
  assert.equal(
    (articles[0]?.mainEntityOfPage as JsonLd | undefined)?.["@id"],
    `${SITE_URL}${path}`,
    `${path}: Article mainEntityOfPage`,
  );
}

async function main(): Promise<void> {
  const sitemap = await checkSitemapUrl(`${base}/sitemap.xml`, "/sitemap.xml");
  assertBlueprintReportStaysOffMainSitemap("/sitemap.xml", sitemap.locations);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleProblems: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleProblems.push(consoleLine(message));
  });
  page.on("pageerror", (error) => {
    consoleProblems.push(`pageerror: ${error.message}`);
  });

  try {
    await goto(page, "/birth-card-calculator");
    await page.locator("#bd").fill("2001-01-15");
    await page.getByRole("button", { name: "Reveal my birth card" }).click();
    const januaryLink = page
      .locator('a[href="/born-on/january-15"]')
      .filter({ hasText: "Read the January 15 birth-card page" });
    await januaryLink.waitFor();
    assert.equal(await januaryLink.count(), 1, "January 15: one Worker anchor");
    assert.equal(await januaryLink.getAttribute("href"), "/born-on/january-15");
    assert.equal(
      (await januaryLink.innerText()).trim(),
      "Read the January 15 birth-card page →",
    );

    await page.getByRole("button", { name: "Not your birthday? Change it", exact: true }).click();
    await page.locator("#bd").fill("2000-02-29");
    await page.getByRole("button", { name: "Reveal my birth card" }).click();
    const leapLink = page
      .locator('a[href="/born-on/february-29"]')
      .filter({ hasText: "Read the February 29 birth-card page" });
    await leapLink.waitFor();
    assert.equal(await leapLink.count(), 1, "February 29: one Worker anchor");
    assert.equal(await leapLink.getAttribute("href"), "/born-on/february-29");
    assert.equal(
      (await leapLink.innerText()).trim(),
      "Read the February 29 birth-card page →",
    );
    assert.equal(
      await page
        .locator('a[href="/born-on/january-15"]')
        .filter({ hasText: "Read the January 15 birth-card page" })
        .count(),
      0,
      "birth result keeps only the latest submitted Worker link",
    );

    const first = "2000-01-15";
    const second = "2000-02-29";
    const firstProfile = buildLifePathProfile(first, "First");
    const secondProfile = buildLifePathProfile(second, "Second");
    assert.ok(firstProfile && secondProfile, "compatibility fixtures resolve");
    const expectedPair = compatibilityPairPath(
      birthCardSlug(firstProfile.birthCard)!,
      birthCardSlug(secondProfile.birthCard)!,
    );
    assert.ok(expectedPair, "compatibility fixture has a canonical pair path");

    await goto(page, "/birth-card-compatibility-calculator");
    await page.locator("#da").fill(first);
    await page.locator("#db").fill(second);
    await page
      .getByRole("button", { name: "Compare" })
      .click();
    const forwardPairLink = page.getByRole("link", {
      name: "Read the full Queen of Diamonds + 9 of Clubs pairing →",
      exact: true,
    });
    await forwardPairLink.waitFor();
    assert.equal(await forwardPairLink.getAttribute("href"), expectedPair);
    assert.equal(
      await page.locator(`a[href="${expectedPair}"]`).count(),
      1,
      "forward inputs: one canonical pair link",
    );

    await page.locator("#da").fill(second);
    await page.locator("#db").fill(first);
    await page
      .getByRole("button", { name: "Compare" })
      .click();
    const reversedPairLink = page.getByRole("link", {
      name: "Read the full 9 of Clubs + Queen of Diamonds pairing →",
      exact: true,
    });
    await reversedPairLink.waitFor();
    assert.equal(
      await forwardPairLink.count(),
      0,
      "reversed inputs replace the forward rendered result",
    );
    assert.equal(await reversedPairLink.getAttribute("href"), expectedPair);
    assert.equal(
      await page.locator(`a[href="${expectedPair}"]`).count(),
      1,
      "reversed inputs: one canonical pair link",
    );

    await goto(page, "/birth-card");
    const popular = page.locator('section[aria-labelledby="popular-card-meanings"]');
    assert.equal(
      await popular.locator('a[href="/birth-card/queen-of-hearts"]').count(),
      1,
      "popular meanings includes Queen of Hearts",
    );
    assert.equal(
      await popular.locator('a[href="/birth-card/queen-of-clubs"]').count(),
      1,
      "popular meanings includes Queen of Clubs",
    );
    assert.equal(
      await page
        .locator('footer a[href="/playing-card-spreads"]')
        .isVisible(),
      true,
      "footer exposes the current Spreads hub",
    );
    for (const [href, label] of [
      ["/birth-card-calculator", "Birth Card Calculator"],
      ["/what-is-cardology", "What is Cardology"],
      ["/products/one-question-reading", "One Question Reading ($13)"],
      ["/faq", "FAQ"],
    ] as const) {
      const link = page.locator(`nav[aria-label="Primary"] a[href="${href}"]`);
      assert.equal(await link.count(), 1, `desktop primary nav exposes ${label}`);
      assert.equal((await link.innerText()).replace(/\s+/g, " ").trim(), label);
    }
    assert.equal(
      await page.locator('nav[aria-label="Primary"] a[href="/today"]').count(),
      0,
      "desktop primary nav does not lead with the gated today tool",
    );
    assert.equal(
      await page.locator('header a[href="/checkout/deep-dive"]').count(),
      0,
      "header does not send people to the deep-dive checkout slug",
    );
    assert.deepEqual(
      await page.locator('nav[aria-label="Primary"] a').evaluateAll((nodes) =>
        nodes.map((node) => [
          node.getAttribute("data-money-path"),
          node.getAttribute("href"),
        ]),
      ),
      [
        ["calculator", "/birth-card-calculator"],
        ["cardology", "/what-is-cardology"],
        ["reading", "/products/one-question-reading"],
        ["faq", "/faq"],
      ],
      "desktop primary nav is the four money paths, free calculator before the $13 reading",
    );
    assert.deepEqual(
      await page.locator('footer nav[aria-label="Core"] a').evaluateAll((nodes) =>
        nodes.map((node) => [
          node.getAttribute("data-money-path"),
          node.getAttribute("href"),
        ]),
      ),
      [
        ["calculator", "/birth-card-calculator"],
        ["cardology", "/what-is-cardology"],
        ["reading", "/products/one-question-reading"],
        ["faq", "/faq"],
      ],
      "footer core row repeats the same money paths",
    );
    const footerText = await page.locator("footer").innerText();
    assert.match(footerText, /Free/);
    assert.match(footerText, /about a minute/);
    assert.match(footerText, /mirror, not a forecast/);
    assert.equal(
      await page.locator('footer a[href="/products/blueprint-report"]').count(),
      0,
      "footer does not pitch the Blueprint Report",
    );
    assert.equal(await page.locator("footer").getByText("Deep Dive").count(), 0);
    const footerHtml = await page.locator("footer").innerHTML();
    assert.ok(
      footerHtml.indexOf('href="/birth-card-calculator"') <
        footerHtml.indexOf('href="/explore"'),
      "footer money path comes before the explore directory",
    );

    await page.setViewportSize({ width: 820, height: 800 });
    await goto(page, "/");
    assert.equal(
      await page.getByText("Menu", { exact: true }).isVisible(),
      true,
      "820px: Menu is visible",
    );
    assert.equal(
      await page.locator('nav[aria-label="Primary"]').isVisible(),
      false,
      "820px: desktop primary nav is hidden",
    );

    await page.setViewportSize({ width: 1024, height: 800 });
    await page.reload({ waitUntil: "networkidle" });
    await assertHealthyPage(page, "/");
    assert.equal(
      await page.locator('nav[aria-label="Primary"]').isVisible(),
      true,
      "1024px: desktop primary nav is visible",
    );
    assert.equal(
      await page.locator("header").evaluate(
        (header) => header.scrollWidth <= header.clientWidth,
      ),
      true,
      "1024px: header has no horizontal overflow",
    );

    await page.setViewportSize({ width: 360, height: 800 });
    await goto(page, "/");
    assert.equal(
      await page.locator("header").evaluate(
        (header) => header.scrollWidth <= header.clientWidth,
      ),
      true,
      "360px: header has no horizontal overflow",
    );
    assert.equal(
      await page.getByText("Ask — $13", { exact: true }).count(),
      0,
      "360px: header does not use the truncated offer label",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, "/");
    await page.getByText("Menu", { exact: true }).click();
    for (const [href, label] of [
      ["/birth-card-calculator", "Birth Card Calculator"],
      ["/what-is-cardology", "What is Cardology"],
      ["/products/one-question-reading", "One Question Reading ($13)"],
      ["/faq", "FAQ"],
    ] as const) {
      const link = page.locator(`nav[aria-label="Mobile primary"] a[href="${href}"]`);
      assert.equal(await link.isVisible(), true, `390px: mobile nav exposes ${label}`);
      const text = (await link.innerText()).replace(/\s+/g, " ").trim();
      assert.equal(text, label, `390px: mobile nav label is the full offer name for ${href}`);
      const clipped = await link.evaluate((node) => node.scrollWidth > node.clientWidth + 1);
      assert.equal(clipped, false, `390px: ${label} is not clipped`);
    }
    assert.deepEqual(
      await page.locator('nav[aria-label="Mobile primary"] a').evaluateAll((nodes) =>
        nodes.map((node) => [
          node.getAttribute("data-money-path"),
          node.getAttribute("href"),
        ]),
      ),
      [
        ["calculator", "/birth-card-calculator"],
        ["cardology", "/what-is-cardology"],
        ["reading", "/products/one-question-reading"],
        ["faq", "/faq"],
      ],
      "mobile nav destinations match desktop money paths",
    );
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Retired marketing URLs must still reach the current offer.
    for (const alias of ["/products/personal-card-blueprint", "/products/complete-card-blueprint"]) {
      await goto(page, alias, "/products/one-question-reading");
      assert.equal(new URL(page.url()).pathname, "/products/one-question-reading");
      assert.ok((await page.locator("main").innerText()).includes("$13"));
    }
    // Exercise the active checkout review at both viewport sizes, without payment.
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await goto(page, "/checkout/deep-dive");
      const birthday = page.locator('input[name="birthdate"]');
      assert.equal(await birthday.inputValue(), width === 390 ? "2000-02-29" : "1991-02-17", "checkout preserves the calculator or corrected birthday");
      await birthday.fill("1991-02-17");
      const question = page.locator('textarea[name="question_draft"]');
      await question.fill("Should I take the promotion?");
      assert.equal(await question.inputValue(), "Should I take the promotion?");
      const form = page.locator('form[action="/checkout/deep-dive/session"]');
      assert.equal(await form.count(), 1);
      const button = form.locator('button[type="submit"]');
      await button.scrollIntoViewIfNeeded();
      assert.equal(await button.isEnabled(), true);
      await assertMobileCtaIsUsable(button, `${width}px checkout`);
      assert.equal(await birthday.inputValue(), "1991-02-17");
      let submitted = false;
      await page.route("**/checkout/deep-dive/session", async route => {
        const body = new URLSearchParams(route.request().postData() || "");
        assert.equal(body.get("birthdate"), "1991-02-17");
        assert.equal(body.get("question"), "Should I take the promotion?");
        submitted = true;
        await route.fulfill({status:200,contentType:"text/html",body:"<h1>Mock checkout accepted</h1>"});
      });
      await button.click();
      await page.getByRole("heading", {name:"Mock checkout accepted"}).waitFor();
      assert.ok(submitted, "current checkout submits validated input");
      await page.unroute("**/checkout/deep-dive/session");
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    for (const path of [
      "/playing-card-spreads",
      "/blog/four-suits-in-cardology",
      "/blog/pillar/cardology-foundations",
      "/birth-card/queen-of-hearts",
    ]) {
      await assertOneBreadcrumb(page, path);
    }

    await goto(page, SPREADS_HUB_PATH);
    const collections = (await jsonLd(page)).flatMap((graph) =>
      collectTypes(graph, "CollectionPage"),
    );
    assert.equal(collections.length, 1, "spreads hub: one CollectionPage");
    assert.equal(
      collections[0]?.url,
      `${SITE_URL}${SPREADS_HUB_PATH}`,
      "spreads hub: CollectionPage URL",
    );
    const itemLists = collectTypes(collections[0], "ItemList");
    assert.equal(itemLists.length, 1, "spreads hub: one ItemList");
    assert.equal(
      itemLists[0]?.numberOfItems,
      SPREADS.length,
      "spreads hub: ItemList count",
    );
    const items = itemLists[0]?.itemListElement as JsonLd[];
    assert.equal(items.length, SPREADS.length, "spreads hub: ListItem count");
    assert.deepEqual(
      items.map((item) => item.position),
      SPREADS.map((_, index) => index + 1),
      "spreads hub: consecutive ListItem positions",
    );
    assert.deepEqual(
      items.map((item) => item.url),
      SPREADS.map((spread) => `${SITE_URL}${spread.path}`),
      "spreads hub: visible spoke URLs",
    );

    await assertArticle(
      page,
      "/how-to-read-playing-cards",
      "How to Read Playing Cards",
    );
    await assertArticle(
      page,
      "/52-card-astrology-explained",
      "Playing Cards Birthday Chart & 52-Card Astrology",
    );

    assert.deepEqual(
      consoleProblems,
      [],
      `browser console/page errors:\n${consoleProblems.join("\n")}`,
    );
  } finally {
    await browser.close();
  }

  console.log(
    `PASS: SEO integrity browser smoke (screenshot: ${screenshotPath})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
