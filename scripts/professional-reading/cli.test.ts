import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("one local command writes private HTML and refuses accidental replacement", async () => {
  const dir = await mkdtemp(join(tmpdir(), "professional-reading-"));
  try {
    const args = ["scripts/professional-reading/cli.ts", "Cass", "1991-02-17", "2026-09-01", "--out", dir, "--html-only"];
    const run = spawnSync("bun", args, {encoding:"utf8"});
    expect(run.status).toBe(0);
    expect(await readFile(join(dir,"reading.html"),"utf8")).toContain("Spread 35");
    const repeat = spawnSync("bun", args, {encoding:"utf8"});
    expect(repeat.status).toBe(1);
    expect(repeat.stderr).toContain("exists");
    const help = spawnSync("bun", ["scripts/professional-reading/cli.ts","--help"], {encoding:"utf8"});
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("YYYY-MM-DD");
    const invalid = spawnSync("bun", ["scripts/professional-reading/cli.ts","Cass","1991-02-30","2026-09-01","--out",dir], {encoding:"utf8"});
    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain("Invalid calendar date");
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test("local Chromium exports a real PDF or reports browser unavailability honestly", async () => {
  const dir = await mkdtemp(join(tmpdir(), "professional-pdf-"));
  try {
    const run = spawnSync("bun", ["scripts/professional-reading/cli.ts","Cass","1991-02-17","2026-09-01","--out",dir], {encoding:"utf8",timeout:60000});
    expect(run.status).toBe(0);
    if(run.stdout.includes("PDF:")) {
      const pdf = await readFile(join(dir,"reading.pdf"));
      expect(pdf.subarray(0,5).toString()).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(20000);
    } else {
      expect(run.stderr).toContain("PDF unavailable: local Chromium could not launch");
      expect(run.stdout).toContain("HTML:");
    }
  } finally { await rm(dir,{recursive:true,force:true}); }
}, 65000);

test("private output rejects resolved application roots before writing", async () => {
  // Existing files make the unfixed CLI fail harmlessly, without writing into these roots.
  for (const out of ["app/page.tsx", "public/_headers", "scripts/../.git"]) {
    const run = spawnSync("bun", ["scripts/professional-reading/cli.ts", "Cass", "1991-02-17", "2026-09-01", "--out", out, "--html-only"], {encoding:"utf8"});
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("Private output destination is forbidden");
  }
});
