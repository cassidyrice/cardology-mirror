import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateStudioScript, studioContext } from "./studio-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const studioRoot = path.join(__dirname, "studio");
const port = Number(process.env.PORT || 3588);
const hostname = "127.0.0.1";
const maxRequestBytes = 32_000;

const server = Bun.serve({
  port,
  hostname,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/context") {
      return Response.json(studioContext());
    }

    if (request.method === "POST" && url.pathname === "/api/generate") {
      try {
        const input = await readSmallJson(request, maxRequestBytes);
        return Response.json(generateStudioScript(input));
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Could not make the script." },
          { status: 400 },
        );
      }
    }

    if (request.method === "GET" && url.pathname.startsWith("/assets/")) {
      const assetPath = path.resolve(repoRoot, "public", url.pathname.slice("/assets/".length));
      const publicRoot = path.resolve(repoRoot, "public");
      if (!assetPath.startsWith(`${publicRoot}${path.sep}`)) return new Response("Not found", { status: 404 });
      const file = Bun.file(assetPath);
      if (!(await file.exists())) return new Response("Not found", { status: 404 });
      return new Response(file);
    }

    const staticFiles: Record<string, string> = {
      "/": "index.html",
      "/index.html": "index.html",
      "/app.js": "app.js",
      "/styles.css": "styles.css",
    };
    const staticName = staticFiles[url.pathname];
    if (request.method === "GET" && staticName) {
      const file = Bun.file(path.join(studioRoot, staticName));
      return new Response(file, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Card Blueprints Script Studio is ready at http://${hostname}:${server.port}`);

async function readSmallJson(request: Request, maxBytes: number) {
  const statedSize = Number(request.headers.get("content-length") || 0);
  if (statedSize > maxBytes) throw new Error("That request is too large.");

  const reader = request.body?.getReader();
  if (!reader) throw new Error("Add script details first.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("That request is too large.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
