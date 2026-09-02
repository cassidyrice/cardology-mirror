import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = join(import.meta.dir, "..");
const SCRIPT = join(ROOT, "scripts/record-deploy.sh");

const FIXTURE =
  "**Last verified: 2026-09-01** (deployed `main` @ `abc1234` — old subject; previous record `zzz9999`)\n";

function rewrite(subject: string, fixture = FIXTURE): {
  status: number;
  stderr: string;
  out: string;
} {
  const dir = mkdtempSync(join(tmpdir(), "record-deploy-"));
  const file = join(dir, "DEPLOY-SOURCE.md");
  writeFileSync(file, fixture);
  const result = spawnSync(
    "bash",
    [
      "-c",
      'source "$1" && update_last_verified "$2" "$3" "$4" "$5" "$6"',
      "record-deploy-test",
      SCRIPT,
      file,
      "2026-09-02",
      "deadbee",
      subject,
      "cafebab",
    ],
    { encoding: "utf8" },
  );
  const out = readFileSync(file, "utf8");
  rmSync(dir, { recursive: true, force: true });
  return { status: result.status ?? 1, stderr: result.stderr, out };
}

describe("record-deploy last-verified rewrite", () => {
  test("writes a subject containing agent/cursor-C4 intact", () => {
    const subject = "Merge agent/cursor-C4";
    const { status, stderr, out } = rewrite(subject);
    expect(stderr).toBe("");
    expect(status).toBe(0);
    expect(out).toContain(subject);
    expect(out).toBe(
      "**Last verified: 2026-09-02** (deployed `main` @ `deadbee` — Merge agent/cursor-C4; previous record `cafebab`)\n",
    );
  });

  test("writes subjects with &, #, and / intact", () => {
    const subject = "fix: foo & bar # baz / qux";
    const { status, stderr, out } = rewrite(subject);
    expect(stderr).toBe("");
    expect(status).toBe(0);
    expect(out).toContain(subject);
    expect(out).toBe(
      "**Last verified: 2026-09-02** (deployed `main` @ `deadbee` — fix: foo & bar # baz / qux; previous record `cafebab`)\n",
    );
  });
});
