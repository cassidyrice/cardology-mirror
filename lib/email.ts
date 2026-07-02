// Thin Resend wrapper. Resend is HTTP-only, so this is edge-safe.
// If you swap providers later, only this file changes.

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendIntakeEmail(args: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM_EMAIL;
  if (!apiKey || !from) {
    // In a scaffolded environment without keys, log and move on — the rest of
    // the flow (Stripe redirect, success page) still works for smoke testing.
    console.warn("[email] RESEND_API_KEY or INTAKE_FROM_EMAIL missing; skipping send", {
      to: args.to,
      subject: args.subject,
    });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      reply_to: args.replyTo,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed: ${res.status} ${body}`);
  }
}
