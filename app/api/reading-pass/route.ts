import { NextRequest, NextResponse } from "next/server";

import {
  ReadingPassError,
  getReadingPassState,
  submitReadingPassQuestion,
  verifyReadingPassToken,
} from "@/lib/question-reading-service";
import { rateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limit";
import { readJsonObject } from "@/lib/request-body";
import { APP_URL, SITE_URL } from "@/lib/site";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

const SUBMIT_LIMIT = 15;
const SUBMIT_WINDOW_MS = 60_000;

function isAllowedOrigin(req: NextRequest): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const allowedHosts = new Set<string>([
      new URL(SITE_URL).hostname,
      new URL(APP_URL).hostname,
      "cardblueprints.com",
      "www.cardblueprints.com",
      "localhost",
      "127.0.0.1",
    ]);
    return allowedHosts.has(parsed.hostname) || parsed.hostname.endsWith(".pages.dev");
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("x-reading-pass-token") ??
    "";

  const verified = await verifyReadingPassToken(token.trim());
  if (!verified) {
    return NextResponse.json(
      { error: "Valid Reading Pass link required.", code: "INVALID_PASS_TOKEN" },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    const pass = await getReadingPassState(verified.orderId);
    return NextResponse.json({ ok: true, pass }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof ReadingPassError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status, headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { error: "Could not load Reading Pass right now." },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "forbidden origin" }, { status: 403, headers: NO_STORE });
  }

  const rl = rateLimit(rateLimitKey(req, "reading-pass-submit"), {
    limit: SUBMIT_LIMIT,
    windowMs: SUBMIT_WINDOW_MS,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many submissions right now. Wait a moment and try again." },
      { status: 429, headers: { ...NO_STORE, ...rateLimitHeaders(rl, SUBMIT_LIMIT) } },
    );
  }

  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400, headers: NO_STORE },
    );
  }

  const token =
    typeof body.token === "string"
      ? body.token.trim()
      : (req.headers.get("x-reading-pass-token") ?? "").trim();

  const verified = await verifyReadingPassToken(token);
  if (!verified) {
    return NextResponse.json(
      { error: "Valid Reading Pass link required.", code: "INVALID_PASS_TOKEN" },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    const result = await submitReadingPassQuestion({
      rootOrderId: verified.orderId,
      question: body.question,
      birth2: body.birth2,
      name2: body.name2,
      rel2: body.rel2,
    });

    return NextResponse.json(
      {
        ok: true,
        submittedQuestionNumber: result.submittedQuestionNumber,
        submittedOrderId: result.submittedOrderId,
        pass: result.state,
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    if (err instanceof ReadingPassError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status, headers: NO_STORE },
      );
    }
    console.error("[reading-pass] question submission failed", err);
    return NextResponse.json(
      { error: "Could not submit your question right now. Please try again." },
      { status: 500, headers: NO_STORE },
    );
  }
}
