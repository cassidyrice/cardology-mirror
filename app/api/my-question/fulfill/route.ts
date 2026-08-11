import { NextRequest, NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";
import {
  deliverMyQuestionOrder,
  startMyQuestionProduction,
} from "@/lib/my-question/fulfillment-service";
import {
  resolveMyQuestionRuntime,
  runtimeString,
} from "@/lib/my-question/runtime";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return json(
      { ok: false, code: "invalid_origin", message: "Request not accepted." },
      403,
    );
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json(
      { ok: false, code: "request_too_large", message: "Request is too large." },
      413,
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid payload");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json(
      { ok: false, code: "invalid_request", message: "Request could not be read." },
      400,
    );
  }

  if (
    typeof body.token !== "string" ||
    body.token.length > 4_096 ||
    (body.action !== "start" && body.action !== "deliver")
  ) {
    return json(
      { ok: false, code: "invalid_request", message: "Request is incomplete." },
      400,
    );
  }

  const runtimeContext = await resolveMyQuestionRuntime();
  const signingSecret = runtimeString(
    runtimeContext.env,
    "MY_QUESTION_SIGNING_SECRET",
  );
  if (!runtimeContext.db || !signingSecret || signingSecret.length < 32) {
    return json(
      {
        ok: false,
        code: "fulfillment_unavailable",
        message: "Private fulfillment is temporarily unavailable.",
      },
      503,
    );
  }

  if (body.action === "start") {
    const result = await startMyQuestionProduction(body.token, {
      db: runtimeContext.db,
      signingSecret,
    });
    if (!result.ok) return json(result, result.status);
    return json(
      {
        ok: true,
        status: result.value.status,
        productionStartedAt: result.value.productionStartedAt,
      },
      200,
    );
  }

  const creatorEmail = runtimeString(runtimeContext.env, "INTAKE_EMAIL");
  const apiKey = runtimeString(runtimeContext.env, "RESEND_API_KEY");
  const from = runtimeString(runtimeContext.env, "INTAKE_FROM_EMAIL");
  if (!creatorEmail || !apiKey || !from) {
    return json(
      {
        ok: false,
        code: "fulfillment_unavailable",
        message: "Delivery email is not configured. The order was not changed.",
      },
      503,
    );
  }

  const result = await deliverMyQuestionOrder(
    { token: body.token, deliveryUrl: body.deliveryUrl },
    {
      db: runtimeContext.db,
      signingSecret,
      creatorEmail,
      send: (message) => sendEmail(message, { apiKey, from }),
    },
  );
  if (!result.ok) return json(result, result.status);
  return json(
    {
      ok: true,
      status: result.value.status,
      deliveryUrl: result.value.deliveryUrl,
      deliveredAt: result.value.deliveredAt,
    },
    200,
  );
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store, private",
      "referrer-policy": "no-referrer",
    },
  });
}
