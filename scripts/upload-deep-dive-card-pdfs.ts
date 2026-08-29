/**
 * Upload 52 card-level Deep Dive PDFs to EBOOK_BUCKET (cardblueprints-ebooks).
 * Keys: deep-dive/{seo-slug}.pdf — same bucket as system-guide.pdf / all-90-spreads.pdf.
 *
 * Usage: bun scripts/upload-deep-dive-card-pdfs.ts
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const SRC =
  process.env.DEEP_DIVE_PDF_DIR ??
  "/Users/main/Desktop/hermes-outputs/cardblueprints/deep-dive-9/card-level";
const BUCKET = "cardblueprints-ebooks";
const PREFIX = "deep-dive";
const CONCURRENCY = 4;

function put(key: string, file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      [
        "wrangler",
        "r2",
        "object",
        "put",
        `${BUCKET}/${key}`,
        "--file",
        file,
        "--content-type",
        "application/pdf",
        "--remote",
        "-y",
      ],
      { stdio: "inherit", cwd: join(import.meta.dir, "..") },
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wrangler put failed (${code}) for ${key}`));
    });
  });
}

const files = readdirSync(SRC)
  .filter((name) => name.endsWith(".pdf"))
  .sort();
if (files.length !== 52) {
  throw new Error(`expected 52 PDFs, found ${files.length}`);
}

let next = 0;
let failed = 0;
async function worker() {
  while (next < files.length) {
    const name = files[next++];
    const slug = name.replace(/\.pdf$/, "");
    const key = `${PREFIX}/${slug}.pdf`;
    try {
      await put(key, join(SRC, name));
    } catch (err) {
      failed += 1;
      console.error(err);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
if (failed) {
  console.error(`failed: ${failed}`);
  process.exit(1);
}
console.log(`uploaded ${files.length} objects to ${BUCKET}/${PREFIX}/`);
