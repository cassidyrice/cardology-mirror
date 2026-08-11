import { NextRequest, NextResponse } from "next/server";

import {
  prepareMyQuestionCheckout,
  type MyQuestionStripe,
} from "@/lib/my-question/service";
import {
  resolveMyQuestionRuntime,
  runtimeFlag,
  runtimeString,
} from "@/lib/my-question/runtime";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;

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

  const parsed = parsePayload(raw, request.headers.get("content-type") ?? "");
  if (!parsed.ok) return json(parsed, 400);

  const runtimeContext = await resolveMyQuestionRuntime();
  if (!runtimeContext.db) {
    return json(
      {
        ok: false,
        code: "checkout_unavailable",
        message: "Secure checkout is not open yet. No payment was taken.",
      },
      503,
    );
  }

  const secretKey = runtimeString(runtimeContext.env, "STRIPE_SECRET_KEY");
  const signingSecret = runtimeString(
    runtimeContext.env,
    "MY_QUESTION_SIGNING_SECRET",
  );
  const creatorEmail = runtimeString(runtimeContext.env, "INTAKE_EMAIL");
  const resendKey = runtimeString(runtimeContext.env, "RESEND_API_KEY");
  const fromEmail = runtimeString(runtimeContext.env, "INTAKE_FROM_EMAIL");
  if (
    !secretKey ||
    !signingSecret ||
    signingSecret.length < 32 ||
    !creatorEmail ||
    !resendKey ||
    !fromEmail
  ) {
    return json(
      {
        ok: false,
        code: "checkout_unavailable",
        message: "Secure checkout is not open yet. No payment was taken.",
      },
      503,
    );
  }

  const result = await prepareMyQuestionCheckout(parsed.value, {
    db: runtimeContext.db,
    stripe: getStripe(secretKey) as unknown as MyQuestionStripe,
    config: {
      checkoutEnabled:
        runtimeFlag(runtimeContext.env, "MY_QUESTION_CHECKOUT_ENABLED") &&
        runtimeFlag(runtimeContext.env, "MY_QUESTION_D1_READY") &&
        runtimeFlag(runtimeContext.env, "MY_QUESTION_OPS_READY") &&
        runtimeFlag(runtimeContext.env, "MY_QUESTION_NARRATION_READY"),
      proofApproved:
        runtimeFlag(runtimeContext.env, "MY_QUESTION_PROOF_APPROVED") &&
        runtimeFlag(runtimeContext.env, "MY_QUESTION_SAMPLE_APPROVED") &&
        runtimeFlag(runtimeContext.env, "MY_QUESTION_CAPTIONS_APPROVED") &&
        runtimeFlag(
          runtimeContext.env,
          "MY_QUESTION_BLUEPRINT_SAMPLE_APPROVED",
        ),
      basePriceId: runtimeString(
        runtimeContext.env,
        "STRIPE_MY_QUESTION_PRICE_ID",
      ),
      blueprintPriceId: runtimeString(
        runtimeContext.env,
        "STRIPE_QUESTION_BLUEPRINT_PRICE_ID",
      ),
      siteUrl: runtimeString(runtimeContext.env, "SITE_URL") ?? SITE_URL,
    },
  });

  if (!result.ok) return json(result, result.status);
  return json(
    {
      ok: true,
      checkoutUrl: result.value.checkoutUrl,
      sessionId: result.value.sessionId,
    },
    200,
  );
}

function parsePayload(
  raw: string,
  contentType: string,
):
  | {
      ok: true;
      value: {
        primaryBirthdate: string;
        includeQuestionBlueprint: boolean;
      };
    }
  | { ok: false; code: string; message: string } {
  let primaryBirthdate: unknown;
  let includeQuestionBlueprint: unknown;

  try {
    if (contentType.includes("application/json")) {
      const body = JSON.parse(raw) as Record<string, unknown>;
      primaryBirthdate = body.primaryBirthdate;
      includeQuestionBlueprint = body.includeQuestionBlueprint;
      if (
        typeof includeQuestionBlueprint !== "boolean" &&
        includeQuestionBlueprint !== undefined
      ) {
        throw new Error("invalid add-on value");
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = new URLSearchParams(raw);
      primaryBirthdate = body.get("primaryBirthdate");
      includeQuestionBlueprint = ["on", "true", "1"].includes(
        body.get("includeQuestionBlueprint") ?? "",
      );
    } else {
      return {
        ok: false,
        code: "invalid_content_type",
        message: "Request format is not supported.",
      };
    }
  } catch {
    return {
      ok: false,
      code: "invalid_request",
      message: "Checkout details could not be read.",
    };
  }

  if (typeof primaryBirthdate !== "string") {
    return {
      ok: false,
      code: "invalid_birthdate",
      message: "Enter a real birthdate.",
    };
  }

  return {
    ok: true,
    value: {
      primaryBirthdate,
      includeQuestionBlueprint: includeQuestionBlueprint === true,
    },
  };
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
