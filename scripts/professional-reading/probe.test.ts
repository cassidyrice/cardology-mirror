import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("probe refuses existing evidence before browser launch without clobbering", async () => {
  const dir = await mkdtemp(join(tmpdir(), "professional-probe-"));
  try {
    await writeFile(join(dir, "reading.html"), "<html></html>");
    const evidence = join(dir, "browser-evidence");
    await mkdir(evidence);
    await writeFile(join(evidence, "layout.json"), "preserve evidence");
    const run = spawnSync("bun", ["scripts/professional-reading/probe.ts", join(dir, "reading.html")], {encoding:"utf8", timeout:15000});
    expect(await readFile(join(evidence, "layout.json"), "utf8")).toBe("preserve evidence");
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("EEXIST");
  } finally { await rm(dir, {recursive:true, force:true}); }
});
