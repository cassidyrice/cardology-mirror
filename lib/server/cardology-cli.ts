import { spawn } from "node:child_process";
import { join } from "node:path";

export function runCardologyCliJson(args: string[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cliPath = join(process.cwd(), "cli", "cardology_cli.ts");
    const bun = process.env.BUN_EXECUTABLE || "bun";
    const child = spawn(bun, [cliPath, ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `cardology CLI exited ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`cardology CLI returned non-JSON output: ${e instanceof Error ? e.message : String(e)}`));
      }
    });
  });
}
