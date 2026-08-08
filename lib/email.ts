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
  const apiKey = env.apiKey;
  const from = env.from;
  if (!apiKey || !from) {
    console.warn(
      "[email] skipped because provider configuration is incomplete",
    );
    throw new Error("Email provider is not configured");
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  };
  if (args.idempotencyKey) {
    headers["Idempotency-Key"] = args.idempotencyKey;
  }

  const res = await fetcher("https://api.resend.com/emails", {
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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed: ${res.status} ${body}`);
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
      err instanceof Error &&
      err.message.includes("not configured")
    ) {
      return;
    }
    throw err;
  }
}
