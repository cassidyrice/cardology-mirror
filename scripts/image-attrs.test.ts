import { expect, test } from "bun:test";

const BASE = (process.env.IMAGE_ATTRS_BASE_URL || "http://127.0.0.1:3577").replace(
  /\/$/,
  "",
);

const PATHS = [
  "/birth-card-calculator",
  "/birth-card",
  "/birth-card/ace-of-hearts",
  "/karma-cards",
  "/what-is-cardology",
] as const;

function imgTags(html: string): string[] {
  return html.match(/<img\b[^>]*>/gi) ?? [];
}

function assertImgAttrs(tag: string, context: string) {
  expect(tag, `${context}: missing alt`).toMatch(/\balt=(["']).*?\1/i);
  expect(tag, `${context}: missing width`).toMatch(/\bwidth=/i);
  expect(tag, `${context}: missing height`).toMatch(/\bheight=/i);
}

test("sample pages render img tags with alt, width, and height", async () => {
  let probe: Response;
  try {
    probe = await fetch(BASE, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.warn(`SKIP image-attrs: no server at ${BASE} (run bun run build && bun run start)`);
    return;
  }
  if (!probe.ok) {
    console.warn(`SKIP image-attrs: ${BASE} returned ${probe.status}`);
    return;
  }

  for (const path of PATHS) {
    const res = await fetch(`${BASE}${path}`);
    expect(res.ok, `${path} should load`).toBe(true);
    const html = await res.text();
    const tags = imgTags(html);
    for (let i = 0; i < tags.length; i++) {
      assertImgAttrs(tags[i]!, `${path} img[${i}]`);
    }
  }
});
