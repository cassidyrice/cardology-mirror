import { NextRequest, NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";
import { sendMyQuestionOnboardingNotifications } from "@/lib/my-question/notifications";
import {
  completePaidOnboarding,
  type MyQuestionStripe,
} from "@/lib/my-question/service";
import {
  resolveMyQuestionRuntime,
  runtimeString,
} from "@/lib/my-question/runtime";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

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

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_BODY_BYTES) {
    return json(
      { ok: false, code: "request_too_large", message: "Request is too large." },
      413,
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
      { ok: false, code: "invalid_request", message: "Form details could not be read." },
      400,
    );
  }

  if (
    typeof body.sessionId !== "string" ||
    typeof body.customerName !== "string" ||
    typeof body.question !== "string" ||
    !Array.isArray(body.relevantBirthdates) ||
    !body.relevantBirthdates.every((value) => typeof value === "string")
  ) {
    return json(
      { ok: false, code: "invalid_request", message: "Complete the required form fields." },
      400,
    );
  }

  const runtimeContext = await resolveMyQuestionRuntime();
  const secretKey = runtimeString(runtimeContext.env, "STRIPE_SECRET_KEY");
  if (!runtimeContext.db || !secretKey) {
    return json(
      {
        ok: false,
        code: "onboarding_unavailable",
        message:
          "Your payment is safe, but onboarding is temporarily unavailable. Try again shortly.",
      },
      503,
    );
  }

  const result = await completePaidOnboarding(
    {
      sessionId: body.sessionId,
      customerName: body.customerName,
      question: body.question,
      relevantBirthdates: body.relevantBirthdates as string[],
    },
    {
      db: runtimeContext.db,
      stripe: getStripe(secretKey) as unknown as MyQuestionStripe,
    },
  );

  if (!result.ok) return json(result, result.status);
  const order = result.value;
  if (!order.fulfillmentDate || !order.slotNumber) {
    return json(
      {
        ok: false,
        code: "onboarding_unavailable",
        message:
          "Your payment is safe, but a delivery date could not be reserved. Try again or contact support.",
      },
      503,
    );
  }

  let notificationPending = false;
  try {
    const creatorEmail = requiredRuntimeString(
      runtimeContext.env,
      "INTAKE_EMAIL",
    );
    const signingSecret = requiredRuntimeString(
      runtimeContext.env,
      "MY_QUESTION_SIGNING_SECRET",
    );
    const apiKey = requiredRuntimeString(runtimeContext.env, "RESEND_API_KEY");
    const from = requiredRuntimeString(
      runtimeContext.env,
      "INTAKE_FROM_EMAIL",
    );
    await sendMyQuestionOnboardingNotifications(order, {
      siteUrl: runtimeString(runtimeContext.env, "SITE_URL") ?? SITE_URL,
      creatorEmail,
      signingSecret,
      send: (message) => sendEmail(message, { apiKey, from }),
    });
  } catch (error) {
    notificationPending = true;
    console.error("[my-question] onboarding notification pending", error);
  }

  return json(
    {
      ok: true,
      fulfillmentDate: order.fulfillmentDate,
      slotNumber: order.slotNumber,
      notificationPending,
    },
    200,
  );
}

function requiredRuntimeString(
  env: Record<string, unknown>,
  name: string,
): string {
  const value = runtimeString(env, name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
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
    headers: { "cache-control": "no-store" },
  });
}
