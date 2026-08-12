// Thin Resend wrapper. Resend is HTTP-only, so this is edge-safe.
// If you swap providers later, only this file changes.

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type EmailSendErrorCode =
  | "not_configured"
  | "invalid_from"
  | "resend_rejected"
  | "network";

export class EmailSendError extends Error {
  constructor(
    readonly code: EmailSendErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

/** Normalize bare addresses to "Card Blueprints <addr@domain>". */
export function normalizeFromAddress(from: string): string {
  const raw = from.trim().replace(/^["']|["']$/g, "");
  if (!raw) return "";
  // Already "Name <email@x>"
  if (/^[^<>]+<[^<>@]+@[^<>]+>$/.test(raw)) return raw;
  // Bare email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return `Card Blueprints <${raw}>`;
  }
  return raw;
}

export function classifyEmailError(err: unknown): EmailSendErrorCode {
  if (err instanceof EmailSendError) return err.code;
  const msg = err instanceof Error ? err.message : String(err);
  if (/not configured/i.test(msg)) return "not_configured";
  if (/invalid_from|from.*invalid/i.test(msg)) return "invalid_from";
  if (/Resend send failed|resend/i.test(msg)) return "resend_rejected";
  return "network";
}

export async function sendEmail(
  args: SendArgs,
  env: {
    apiKey?: string;
    from?: string;
  } = {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.INTAKE_FROM_EMAIL,
  },
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const apiKey = (env.apiKey || "").trim();
  const from = normalizeFromAddress(env.from || "");
  if (!apiKey || !from) {
    console.warn(
      "[email] skipped because provider configuration is incomplete",
      { hasKey: Boolean(apiKey), hasFrom: Boolean(from) },
    );
    throw new EmailSendError(
      "not_configured",
      "Email provider is not configured",
    );
  }
  if (!from.includes("@")) {
    throw new EmailSendError(
      "invalid_from",
      "INTAKE_FROM_EMAIL must be a verified sending address",
    );
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  };
  if (args.idempotencyKey) {
    headers["Idempotency-Key"] = args.idempotencyKey;
  }

  let res: Response;
  try {
    res = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        text: args.text,
        html: args.html,
        reply_to: args.replyTo,
      }),
    });
  } catch (cause) {
    throw new EmailSendError(
      "network",
      cause instanceof Error ? cause.message : "Email network error",
    );
  }

  if (!res.ok) {
    const body = await res.text();
    // Do not log recipient; body is provider error JSON.
    console.error("[email] Resend rejected send", {
      status: res.status,
      body: body.slice(0, 400),
      fromDomain: from.includes("@")
        ? from.replace(/^.*@/, "@").replace(/>$/, "")
        : "(unknown)",
    });
    // Prefer a short machine-readable reason for operators (no recipient PII).
    let reason = `http_${res.status}`;
    try {
      const parsed = JSON.parse(body) as {
        message?: string;
        name?: string;
        statusCode?: number;
      };
      const parts = [parsed.name, parsed.message].filter(Boolean);
      if (parts.length) {
        reason = parts
          .join(": ")
          .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]")
          .slice(0, 160);
      }
    } catch {
      reason = body
        .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]")
        .slice(0, 160) || reason;
    }
    throw new EmailSendError(
      "resend_rejected",
      `Resend send failed: ${res.status} ${reason}`,
    );
  }
}

/** Legacy intake helper: best-effort (warns and returns if unconfigured). */
export async function sendIntakeEmail(args: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  try {
    await sendEmail(args);
  } catch (err) {
    if (
      err instanceof EmailSendError &&
      err.code === "not_configured"
    ) {
      return;
    }
    if (
      err instanceof Error &&
      err.message.includes("not configured")
    ) {
      return;
    }
    throw err;
  }
}
