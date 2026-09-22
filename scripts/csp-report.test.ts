import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";

import { OPTIONS, POST } from "../app/api/csp-report/route";
import {
  blockedHostFromUri,
  documentPathFromUri,
  formatCspReportLine,
  parseCspReportBody,
  recordCspReport,
  type CspReportLine,
} from "../lib/csp-report";
import { SECURITY_HEADERS } from "../lib/security-headers";
import { middleware } from "../middleware";

const headersFile = readFileSync(join(import.meta.dir, "..", "public/_headers"), "utf8");

const WORKER_CSP = [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com https://buttondown.com https://buttondown.email",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://*.posthog.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://*.posthog.com",
  "img-src 'self' data: https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com https://*.posthog.com",
  "worker-src 'self' blob: data:",
  "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "report-uri /api/csp-report",
].join("; ");

const STATIC_CSP = [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com https://buttondown.com https://buttondown.email",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com",
  "img-src 'self' data: https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "report-uri /api/csp-report",
].join("; ");

function headerValue(name: string): string | undefined {
  return SECURITY_HEADERS.find(([key]) => key === name)?.[1];
}

function enforcingLines(text: string): string[] {
  return text.split("\n").filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("Content-Security-Policy:") || trimmed.startsWith("Content-Security-Policy ");
  });
}

test("both report-only policies name the collector and do not enforce", () => {
  expect(headerValue("Content-Security-Policy-Report-Only")).toBe(WORKER_CSP);
  expect(headerValue("Content-Security-Policy")).toBeUndefined();
  expect(WORKER_CSP).not.toContain("report-to");
  expect(STATIC_CSP).not.toContain("report-to");
  expect(headersFile).not.toContain("Reporting-Endpoints:");
  expect(enforcingLines(headersFile)).toEqual([]);

  const staticLine = headersFile
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("Content-Security-Policy-Report-Only:"));
  expect(staticLine).toBe(`Content-Security-Policy-Report-Only: ${STATIC_CSP}`);
  expect(STATIC_CSP).not.toContain("posthog");
  expect(WORKER_CSP).toContain("https://*.posthog.com");
  expect(WORKER_CSP).toContain("worker-src 'self' blob: data:");
  expect(STATIC_CSP).not.toContain("worker-src");
});

test("middleware attaches report-only, not an enforcing policy", async () => {
  const response = await middleware(
    new NextRequest("https://cardblueprints.com/checkout/deep-dive"),
  );
  expect(response.headers.get("Content-Security-Policy-Report-Only")).toBe(WORKER_CSP);
  expect(response.headers.get("Content-Security-Policy")).toBeNull();
  expect(response.headers.get("Reporting-Endpoints")).toBeNull();
});

test("redaction keeps directive, host, and path, and drops the query", () => {
  const parsed = parseCspReportBody(
    {
      "csp-report": {
        "document-uri":
          "https://user:secret@cardblueprints.com/checkout/deep-dive?question=will+I&email=buyer@example.com",
        referrer: "https://evil.example/path?token=abc",
        "violated-directive": "script-src 'self'",
        "effective-directive": "script-src-elem",
        "original-policy": "default-src 'self'; script-src 'unsafe-inline'",
        disposition: "report",
        "blocked-uri": "https://user:secret@js.stripe.com/v3/stripe.js?token=sk_live_secret",
        "script-sample": "buyer@example.com const question = 'private'",
        "status-code": 200,
      },
    },
    "report-uri",
  );
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  expect(parsed.lines).toEqual([
    {
      directive: "script-src-elem",
      blockedHost: "js.stripe.com",
      documentPath: "/checkout/deep-dive",
      disposition: "report",
      source: "report-uri",
    },
  ]);
  const line = formatCspReportLine(parsed.lines[0]!);
  expect(line).toBe(
    "[csp-report] directive=script-src-elem blockedHost=js.stripe.com documentPath=/checkout/deep-dive disposition=report source=report-uri",
  );
  expect(line).not.toContain("question");
  expect(line).not.toContain("buyer@");
  expect(line).not.toContain("secret");
  expect(line).not.toContain("sk_live");
  expect(line).not.toContain("default-src");
  expect(line).not.toContain("?");
});

test("reporting API batches keep checkout, Turnstile, and inline signals", () => {
  const parsed = parseCspReportBody(
    [
      {
        type: "csp-violation",
        url: "https://cardblueprints.com/checkout/deep-dive?session=cs_secret",
        user_agent: "secret-agent",
        body: {
          documentURL: "https://cardblueprints.com/checkout/deep-dive?session=cs_secret",
          blockedURL: "https://challenges.cloudflare.com/turnstile/v0/api.js",
          effectiveDirective: "script-src-elem",
          disposition: "report",
          sample: "ignored sample",
          originalPolicy: "default-src 'self'",
        },
      },
      {
        type: "deprecation",
        body: { id: "should-not-store" },
      },
      {
        type: "csp-violation",
        body: {
          documentURL: "https://cardblueprints.com/birth-card/ace-of-spades#card",
          blockedURL: "inline",
          effectiveDirective: "script-src-elem",
          disposition: "enforce",
        },
      },
    ],
    "report-to",
  );
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  expect(parsed.lines.map((line) => formatCspReportLine(line))).toEqual([
    "[csp-report] directive=script-src-elem blockedHost=challenges.cloudflare.com documentPath=/checkout/deep-dive disposition=report source=report-to",
    "[csp-report] directive=script-src-elem blockedHost=inline documentPath=/birth-card/ace-of-spades disposition=enforce source=report-to",
  ]);
});

test("blocked host and document path special cases", () => {
  expect(blockedHostFromUri("eval")).toBe("eval");
  expect(blockedHostFromUri("data:text/javascript,alert(1)")).toBe("data");
  expect(blockedHostFromUri("blob:https://cardblueprints.com/uuid")).toBe("blob");
  expect(documentPathFromUri("https://cardblueprints.com")).toBe("/");
  expect(documentPathFromUri("/products/one-question-reading?x=1")).toBe(
    "/products/one-question-reading",
  );
});

test("dataset write uses the redacted columns and a throw does not escape", () => {
  const line: CspReportLine = {
    directive: "frame-src",
    blockedHost: "www.youtube.com",
    documentPath: "/videos",
    disposition: "report",
    source: "report-uri",
  };
  const points: Array<{ indexes?: string[]; blobs?: string[]; doubles?: number[] }> = [];
  recordCspReport(line, {
    writeDataPoint(data) {
      points.push(data);
    },
  });
  expect(points).toEqual([
    {
      indexes: ["frame-src"],
      blobs: ["frame-src", "www.youtube.com", "/videos", "report", "report-uri"],
      doubles: [1],
    },
  ]);
  expect(() =>
    recordCspReport(line, {
      writeDataPoint() {
        throw new Error("dataset down");
      },
    }),
  ).not.toThrow();
});

test("the Pages request binding is the dataset when none is passed", () => {
  const points: Array<{ blobs?: string[] }> = [];
  const symbol = Symbol.for("__cloudflare-request-context__");
  const holder = globalThis as unknown as Record<symbol, unknown>;
  const previous = holder[symbol];
  holder[symbol] = {
    env: {
      CSP_REPORTS: {
        writeDataPoint(data: { blobs?: string[] }) {
          points.push(data);
        },
      },
    },
  };
  try {
    recordCspReport({
      directive: "connect-src",
      blockedHost: "api.stripe.com",
      documentPath: "/checkout/deep-dive",
      disposition: "report",
      source: "report-to",
    });
  } finally {
    if (previous === undefined) delete holder[symbol];
    else holder[symbol] = previous;
  }
  expect(points).toEqual([
    {
      indexes: ["connect-src"],
      blobs: ["connect-src", "api.stripe.com", "/checkout/deep-dive", "report", "report-to"],
      doubles: [1],
    },
  ]);
});

async function postReport(
  body: string,
  headers: Record<string, string>,
): Promise<Response> {
  return POST(
    new NextRequest("https://cardblueprints.com/api/csp-report", {
      method: "POST",
      headers,
      body,
    }),
  );
}

test("endpoint accepts a browser csp-report and records the redacted line", async () => {
  const lines: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  try {
    const response = await postReport(
      JSON.stringify({
        "csp-report": {
          "document-uri": "https://cardblueprints.com/checkout/deep-dive?question=secret",
          "effective-directive": "frame-src",
          "blocked-uri": "https://js.stripe.com/v3",
          disposition: "report",
        },
      }),
      {
        "content-type": "application/csp-report",
        origin: "https://cardblueprints.com",
        "sec-fetch-site": "same-origin",
        "cf-connecting-ip": "csp-accept",
      },
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(await response.text()).toBe("");
  } finally {
    console.info = original;
  }
  expect(lines).toContain(
    "[csp-report] directive=frame-src blockedHost=js.stripe.com documentPath=/checkout/deep-dive disposition=report source=report-uri",
  );
});

test("endpoint accepts reporting API content type with a charset", async () => {
  const response = await postReport(
    JSON.stringify([
      {
        type: "csp-violation",
        body: {
          documentURL: "https://cardblueprints.com/probe",
          blockedURL: "https://csp-probe.invalid/blocked.js",
          effectiveDirective: "script-src-elem",
          disposition: "report",
        },
      },
    ]),
    {
      "content-type": "application/reports+json; charset=utf-8",
      "sec-fetch-site": "same-origin",
      "cf-connecting-ip": "csp-reports-json",
    },
  );
  expect(response.status).toBe(204);
});

test("OPTIONS advertises POST for the report content types", async () => {
  const response = OPTIONS();
  expect(response.status).toBe(204);
  expect(response.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
  expect(response.headers.get("access-control-allow-headers")).toBe("content-type");
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
});

test("cross-site and bad payloads are refused and not stored", async () => {
  const lines: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  try {
    const cross = await postReport("{}", {
      "content-type": "application/csp-report",
      origin: "https://evil.example",
      "sec-fetch-site": "cross-site",
      "cf-connecting-ip": "csp-cross",
    });
    expect(cross.status).toBe(403);

    const unsupported = await postReport("{}", {
      "content-type": "text/plain",
      "cf-connecting-ip": "csp-type",
    });
    expect(unsupported.status).toBe(415);

    const invalid = await postReport("{", {
      "content-type": "application/json",
      "cf-connecting-ip": "csp-json",
    });
    expect(invalid.status).toBe(400);

    const shape = await postReport(JSON.stringify({ hello: "nope" }), {
      "content-type": "application/csp-report",
      "cf-connecting-ip": "csp-shape",
    });
    expect(shape.status).toBe(400);

    const huge = await postReport("{}", {
      "content-type": "application/csp-report",
      "content-length": "40000",
      "cf-connecting-ip": "csp-huge",
    });
    expect(huge.status).toBe(413);
  } finally {
    console.info = original;
  }
  expect(lines.some((line) => line.includes("[csp-report]"))).toBe(false);
});

test("soft rate limit trips without storing the overflow", async () => {
  const original = console.info;
  console.info = () => undefined;
  try {
    const body = JSON.stringify({
      "csp-report": {
        "document-uri": "https://cardblueprints.com/checkout/deep-dive",
        "effective-directive": "script-src-elem",
        "blocked-uri": "https://overflow.example/a.js",
        disposition: "report",
      },
    });
    let last = 0;
    for (let i = 0; i < 61; i += 1) {
      const response = await postReport(body, {
        "content-type": "application/csp-report",
        "cf-connecting-ip": "csp-limit",
      });
      last = response.status;
    }
    expect(last).toBe(429);
  } finally {
    console.info = original;
  }
});
