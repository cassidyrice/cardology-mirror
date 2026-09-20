import { realpath } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve existing ancestors as well as the final path: --out may not exist yet.
async function resolvedPath(path: string): Promise<string> {
  try { return await realpath(path); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return resolve(await resolvedPath(dirname(path)), path.slice(dirname(path).length + 1));
  }
}

export async function privateOutputPath(destination: string): Promise<string> {
  const path = resolve(destination);
  const root = await realpath(fileURLToPath(new URL("../../", import.meta.url)));
  const sample = resolve(root, "scripts/professional-reading/private-sample");
  const forbidden = (candidate: string) =>
    (candidate === root || candidate.startsWith(root + sep)) &&
    candidate !== sample && !candidate.startsWith(sample + sep);
  if (forbidden(path)) throw Error("Private output destination is forbidden");
  const canonical = await resolvedPath(path);
  if (forbidden(canonical)) throw Error("Private output destination is forbidden");
  return canonical;
}
