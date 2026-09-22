/**
 * Controlled CSP violation, end to end.
 *
 * Serves /probe with the real Report-Only header, loads a script the policy
 * does not allow, and asserts Chromium's report hits POST /api/csp-report
 * and is stored as a redacted line.
 *
 *   bun scripts/csp-report-browser.ts
 */
import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";

import { chromium } from "playwright";
import { NextRequest } from "next/server";

import { POST } from "../app/api/csp-report/route";
import { SECURITY_HEADERS } from "../lib/security-headers";

function headerValue(name: string): string {
  const row = SECURITY_HEADERS.find(([key]) => key === name);
  if (!row) throw new Error(`missing header ${name}`);
  return row[1];
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function main() {
  const seen: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => {
    const line = args.map(String).join(" ");
    if (line.startsWith("[csp-report]")) seen.push(line);
    original(...args);
  };

  const requests: string[] = [];
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const host = req.headers.host ?? "127.0.0.1";
    const url = new URL(req.url ?? "/", `http://${host}`);
    requests.push(`${req.method} ${url.pathname} ${req.headers["content-type"] ?? ""}`);
    try {
      if (req.method === "GET" && url.pathname === "/probe") {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy-report-only": headerValue("Content-Security-Policy-Report-Only"),
        });
        res.end(
          "<!doctype html><meta charset=\"utf-8\"><title>csp probe</title><script src=\"https://csp-probe.invalid/blocked.js\"></script>",
        );
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/csp-report") {
        const body = await readBody(req);
        const headers = new Headers();
        for (const name of ["content-type", "origin", "sec-fetch-site", "host"] as const) {
          const value = req.headers[name];
          if (typeof value === "string") headers.set(name, value);
        }
        const response = await POST(
          new NextRequest(url, { method: "POST", headers, body }),
        );
        res.writeHead(response.status, {
          "content-type": response.headers.get("content-type") ?? "text/plain",
          "access-control-allow-origin": response.headers.get("access-control-allow-origin") ?? "*",
        });
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
      }
      res.writeHead(404);
      res.end("not found");
    } catch (error) {
      original("[csp-report-browser] request failed", error);
      res.writeHead(500);
      res.end("error");
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  const probe = `http://127.0.0.1:${address.port}/probe`;

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    const browserRequests: string[] = [];
    page.on("request", (request) => {
      browserRequests.push(`${request.method()} ${request.url()} ${request.headers()["content-type"] ?? ""}`);
    });
    await page.goto(probe, { waitUntil: "load" });
    const deadline = Date.now() + 15_000;
    while (seen.length === 0 && Date.now() < deadline) {
      if (Date.now() + 8_000 < deadline) {
        await page.waitForTimeout(1000);
      } else {
        await page.goto("about:blank").catch(() => undefined);
        await page.waitForTimeout(500);
      }
    }
    const match = seen.find(
      (line) =>
        line.includes("blockedHost=csp-probe.invalid") &&
        line.includes("documentPath=/probe") &&
        line.includes("source=report-uri"),
    );
    assert.ok(
      match,
      `expected a stored violation for csp-probe.invalid, saw ${JSON.stringify(seen)} server=${JSON.stringify(requests)} browser=${JSON.stringify(browserRequests)}`,
    );
    assert.equal(match.includes("disposition=report"), true);
    assert.equal(match.includes("?"), false);
    original(`[csp-report-browser] stored ${match}`);
  } finally {
    console.info = original;
    await browser.close();
    server.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
