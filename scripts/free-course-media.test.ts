import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { FREE_COURSE_MODULES } from "../lib/free-course";

const ROOT = join(import.meta.dir, "..");
// Cloudflare Pages rejects static files over 25 MiB.
const MAX_PAGES_BYTES = 25 * 1024 * 1024;

assert.equal(FREE_COURSE_MODULES.length, 4, "four free-course modules");

for (const module of FREE_COURSE_MODULES) {
  for (const assetPath of [module.video, module.poster]) {
    assert.match(
      assetPath,
      /^\/free-course\/media\/[a-z0-9.-]+$/,
      `${module.title} asset path must stay on the public course prefix: ${assetPath}`,
    );
    const diskPath = join(ROOT, "public", assetPath);
    assert.ok(existsSync(diskPath), `missing course asset: ${assetPath}`);
    const size = statSync(diskPath).size;
    assert.ok(size > 1024, `${assetPath} is empty or too small (${size} bytes)`);
    assert.ok(
      size < MAX_PAGES_BYTES,
      `${assetPath} is ${size} bytes; Cloudflare Pages limit is 25 MiB`,
    );
    const header = readFileSync(diskPath).subarray(0, 12);
    if (assetPath.endsWith(".mp4")) {
      assert.equal(header.toString("ascii", 4, 8), "ftyp", `${assetPath} is not an MP4`);
    } else {
      assert.equal(header[0], 0xff, `${assetPath} is not a JPEG`);
      assert.equal(header[1], 0xd8, `${assetPath} is not a JPEG`);
    }
  }
}

console.log("PASS: free-course media files exist, are real MP4/JPEG, and fit Pages limits");
