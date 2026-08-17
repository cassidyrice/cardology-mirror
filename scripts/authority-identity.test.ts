import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CONTACT_EMAIL } from "../lib/site";

const root = join(import.meta.dir, "..");
const methodology = readFileSync(join(root, "app/methodology/page.tsx"), "utf8");
const about = readFileSync(join(root, "app/about/page.tsx"), "utf8");
const contact = readFileSync(join(root, "app/contact/page.tsx"), "utf8");
const site = readFileSync(join(root, "lib/site.ts"), "utf8");
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");

test("public contact is the domain mailbox, not Gmail", () => {
  expect(CONTACT_EMAIL).toBe("hello@cardblueprints.com");
  expect(site).not.toContain("therealcassrice@gmail.com");
  expect(contact).toContain("CONTACT_EMAIL");
  expect(contact).toContain("CONTACT_RESPONSE");
  expect(layout).toContain("email: CONTACT_EMAIL");
});

test("methodology publishes formula, exceptions, history, and vectors", () => {
  expect(methodology).toContain("sv = 55 − (2 × month + day)");
  expect(methodology).toContain("If <code>sv</code> is 0 or less, add 52");
  expect(methodology).toContain("Version history");
  expect(methodology).toContain("January 1 → King of Spades (solar 52)");
  expect(methodology).toContain("December 31 → Joker (year-end boundary; public override)");
  expect(methodology).toContain("They do not change this public formula");
});

test("about names sources and business identity without overclaiming", () => {
  expect(about).toContain("Business identity");
  expect(about).toContain("Olney Richmond");
  expect(about).toContain("Florence Campbell");
  expect(about).toContain("Robert Lee Camp");
  expect(about).toContain("not a clinic");
  expect(about).toContain("accredited school");
  expect(about).not.toMatch(/certified reader|Ph\.?D|doctorate/i);
});
