import { handleElroyMicroReading } from "@/lib/elroy/handler";
import { buildElroyMicroReading } from "@/lib/elroy/micro-reading";
import { renderElroyReadingEmail } from "@/lib/elroy/email";
import { sendEmail } from "@/lib/email";
import { addResendContact } from "@/lib/resend-contacts";
import { SITE_URL } from "@/lib/site";

export const runtime = "edge";

const MAX_BODY = 8 * 1024;

function json(
  status: number,
  body: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin navigation / non-browser
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function resolveRuntimeEnv(): Promise<Record<string, string | undefined>> {
  try {
    const { getOptionalRequestContext } = await import("@cloudflare/next-on-pages");
    return (getOptionalRequestContext()?.env as Record<string, string | undefined>) || {};
  } catch {
    return {};
  }
}

export async function POST(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  if (!sameOrigin(request)) {
    return json(403, { error: "Forbidden" });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY) {
    return json(400, { error: "Request too large" });
  }

  const rawText = await request.text();
  if (new TextEncoder().encode(rawText).byteLength > MAX_BODY) {
    return json(400, { error: "Request too large" });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const runtimeEnv = await resolveRuntimeEnv();
  // Prefer Cloudflare request env, then process.env. Trim empties so "" does not
  // mask a valid fallback.
  const apiKey = (
    runtimeEnv.RESEND_API_KEY ||
    process.env.RESEND_API_KEY ||
    ""
  ).trim();
  const from = (
    runtimeEnv.INTAKE_FROM_EMAIL ||
    process.env.INTAKE_FROM_EMAIL ||
    ""
  ).trim();

  if (!apiKey || !from) {
    console.error("[elroy] email env incomplete", {
      hasKey: Boolean(apiKey),
      hasFrom: Boolean(from),
      envKeys: Object.keys(runtimeEnv).filter((k) =>
        /RESEND|INTAKE|EMAIL/i.test(k),
      ),
    });
  }

  const result = await handleElroyMicroReading(payload, {
    addContact: async (email) => {
      await addResendContact(email, apiKey);
    },
    buildReading: buildElroyMicroReading,
    sendReadingEmail: async (email, reading, idempotencyKey) => {
      const rendered = renderElroyReadingEmail(
        reading,
        `${SITE_URL}/products/personal-card-blueprint`,
      );
      await sendEmail(
        {
          to: email,
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
          idempotencyKey,
        },
        { apiKey, from },
      );
    },
    now: () => new Date(),
  });

  return json(result.status, result.body);
}
