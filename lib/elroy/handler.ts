import { ElroyInputError, normalizeElroyRequest } from "./input";
import { buildElroyIdempotencyKey } from "./idempotency";
import type { ElroyReading } from "./types";

export type ElroyDeps = {
  verifyTurnstile: (token: string, remoteIp: string) => Promise<boolean>;
  addContact: (email: string) => Promise<void>;
  buildReading: (birthdate: string) => ElroyReading;
  sendReadingEmail: (
    email: string,
    reading: ElroyReading,
    idempotencyKey: string,
  ) => Promise<void>;
  now: () => Date;
};

export type ElroyHandlerResult = {
  status: 200 | 400 | 403 | 422 | 503;
  body: Record<string, unknown>;
};

export async function handleElroyMicroReading(
  raw: Record<string, unknown>,
  remoteIp: string,
  deps: ElroyDeps,
): Promise<ElroyHandlerResult> {
  let request;
  try {
    request = normalizeElroyRequest(raw, deps.now());
  } catch (err) {
    if (err instanceof ElroyInputError && err.code === "joker") {
      return {
        status: 422,
        body: {
          error:
            "This date reaches the Joker boundary. No standard micro-reading is available.",
        },
      };
    }
    return {
      status: 400,
      body: {
        error: err instanceof Error ? err.message : "Invalid request",
      },
    };
  }

  const ok = await deps.verifyTurnstile(request.turnstileToken, remoteIp);
  if (!ok) {
    return { status: 403, body: { error: "Verification failed. Try again." } };
  }

  let reading: ElroyReading;
  try {
    reading = deps.buildReading(request.birthdate);
  } catch {
    return { status: 503, body: { error: "Reading is temporarily unavailable." } };
  }

  try {
    await deps.addContact(request.email);
  } catch {
    return {
      status: 503,
      body: { error: "Could not save your email. Try again in a moment." },
    };
  }

  let emailSent = true;
  try {
    const idempotencyKey = await buildElroyIdempotencyKey(
      request.email,
      request.birthdate,
      deps.now(),
    );
    await deps.sendReadingEmail(request.email, reading, idempotencyKey);
  } catch {
    emailSent = false;
  }

  return {
    status: 200,
    body: {
      card: reading.card,
      reading: reading.reading,
      emailSent,
    },
  };
}
