import { expect, test } from "bun:test";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { privateOutputPath } from "./private-output";

test("worktree destinations allow only private-sample including resolved aliases", async () => {
  for (const name of [".", "scripts", "docs/new/reading", "lib", "scripts/professional-reading", "scripts/professional-reading/private-sample-copy"]) {
    await expect(privateOutputPath(resolve(name))).rejects.toThrow("Private output destination is forbidden");
  }
  const sample = resolve("scripts/professional-reading/private-sample");
  await expect(privateOutputPath(sample)).resolves.toBe(sample);
  await expect(privateOutputPath(join(sample, "new", "reading"))).resolves.toBe(join(sample, "new", "reading"));
  const dir = await mkdtemp(join(tmpdir(), "professional-worktree-"));
  try {
    await symlink(resolve("scripts"), join(dir, "scripts-alias"));
    await expect(privateOutputPath(join(dir, "scripts-alias", "new", "reading"))).rejects.toThrow("Private output destination is forbidden");
    await symlink(sample, join(dir, "sample-alias"));
    await expect(privateOutputPath(join(dir, "sample-alias", "new"))).resolves.toBe(join(sample, "new"));
    await expect(privateOutputPath(join(dir, "outside", "new"))).resolves.toEndWith("/outside/new");
  } finally { await rm(dir, {recursive:true, force:true}); }
});

test("private destinations resolve symlinks and missing descendants without creating output", async () => {
  const dir = await mkdtemp(join(tmpdir(), "professional-path-"));
  try {
    for (const name of ["app", "public", ".git", ".next", ".vercel", "out"]) {
      await expect(privateOutputPath(resolve(name, "new-private-reading"))).rejects.toThrow("Private output destination is forbidden");
    }
    for (const name of ["app", "public", ".git"]) {
      const alias = join(dir, name);
      await symlink(resolve(name), alias);
      await expect(privateOutputPath(alias)).rejects.toThrow("Private output destination is forbidden");
      if (name !== ".git") await expect(privateOutputPath(join(alias, "new", "reading"))).rejects.toThrow("Private output destination is forbidden");
    }
    await expect(privateOutputPath(join(dir, "public-copy", "new"))).resolves.toEndWith("/public-copy/new");
  } finally { await rm(dir, {recursive:true, force:true}); }
});
