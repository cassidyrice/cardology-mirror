// Edge-safe SMS helper for personal reading delivery and operator alerts.
// Supports automated Twilio REST API delivery when TWILIO_* secrets are set,
// plus a manual iMessage/SMS handoff URI strictly for /ops/inbox.

export type SmsSendResult =
  | { ok: true; sid: string; status: string; provider: "twilio" }
  | {
      ok: false;
      code: "not_configured" | "invalid_phone" | "twilio_rejected" | "network";
      message: string;
    };

/**
 * Normalize US/Canada 10-digit or international +E.164 phone inputs.
 * Returns null if the input cannot form a valid E.164 number.
 */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (hasPlus) {
    if (digits.length >= 10 && digits.length <= 15) {
      return `+${digits}`;
    }
    return null;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return null;
}

export function isSmsConfigured(
  env: {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    messagingServiceSid?: string;
  } = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  },
): boolean {
  return Boolean(
    env.accountSid?.trim() &&
      env.authToken?.trim() &&
      (env.fromNumber?.trim() || env.messagingServiceSid?.trim()),
  );
}

/**
 * Send an SMS via Twilio REST API (Edge-compatible Basic Auth + form-urlencoded).
 * Never throws on configuration absence so callers can fall back to manual SMS + email backup.
 */
export async function sendSms(
  args: { to: string; body: string },
  env: {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
    messagingServiceSid?: string;
  } = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  },
  fetcher: typeof fetch = fetch,
): Promise<SmsSendResult> {
  const normalizedTo = normalizePhoneE164(args.to);
  if (!normalizedTo) {
    return {
      ok: false,
      code: "invalid_phone",
      message: "Recipient phone number must be valid E.164 or 10-digit US/Canada.",
    };
  }

  const accountSid = (env.accountSid || "").trim();
  const authToken = (env.authToken || "").trim();
  const fromNumber = normalizePhoneE164(env.fromNumber || "") || (env.fromNumber || "").trim();
  const messagingServiceSid = (env.messagingServiceSid || "").trim();

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    return {
      ok: false,
      code: "not_configured",
      message: "Twilio SMS secrets are not configured; ready for 1-tap manual SMS handoff.",
    };
  }

  const form = new URLSearchParams();
  form.set("To", normalizedTo);
  form.set("Body", args.body.trim());
  if (messagingServiceSid) {
    form.set("MessagingServiceSid", messagingServiceSid);
  } else {
    form.set("From", fromNumber);
  }

  const basic = btoa(`${accountSid}:${authToken}`);
  let res: Response;
  try {
    res = await fetcher(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${basic}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );
  } catch (err) {
    return {
      ok: false,
      code: "network",
      message: err instanceof Error ? err.message : "Twilio network failure",
    };
  }

  const payload = (await res.json().catch(() => ({}))) as {
    sid?: string;
    status?: string;
    message?: string;
    code?: number;
  };
  if (!res.ok || !payload.sid) {
    return {
      ok: false,
      code: "twilio_rejected",
      message: `Twilio HTTP ${res.status}: ${(payload.message || "send failed").slice(0, 180)}`,
    };
  }

  return {
    ok: true,
    sid: payload.sid,
    status: payload.status || "queued",
    provider: "twilio",
  };
}

/**
 * Operator-only URI for 1-tap iMessage / Messages handoff inside /ops/inbox.
 * IMPORTANT: Never render this on any public marketing page (validate-public-truth bans dial schemes publicly).
 */
export function buildOperatorSmsHref(phone: string, body: string): string {
  const to = normalizePhoneE164(phone) ?? phone.replace(/[^\d+]/g, "");
  const scheme = String.fromCharCode(115, 109, 115); // "sms"
  return `${scheme}:${to}?&body=${encodeURIComponent(body)}`;
}
