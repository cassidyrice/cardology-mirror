import { ElroyInputError, normalizeElroyRequest } from "./input";
import { buildElroyIdempotencyKey } from "./idempotency";
import type { ElroyReading } from "./types";
import {
  classifyEmailError,
  type EmailSendErrorCode,
} from "@/lib/email";

export type ElroyDeps = {
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
  status: 200 | 400 | 422 | 503;
  body: Record<string, unknown>;
};

export async function handleElroyMicroReading(
  raw: Record<string, unknown>,
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
  let emailError: EmailSendErrorCode | undefined;
  let emailErrorHint: string | undefined;
  try {
    const idempotencyKey = await buildElroyIdempotencyKey(
      request.email,
      request.birthdate,
      deps.now(),
    );
    await deps.sendReadingEmail(request.email, reading, idempotencyKey);
  } catch (err) {
    emailSent = false;
    emailError = classifyEmailError(err);
    const message = err instanceof Error ? err.message : "unknown";
    // Extract trailing reason from "Resend send failed: 403 validation_error"
    const hintMatch = message.match(/Resend send failed:\s*\d+\s+(.+)$/i);
    emailErrorHint = (hintMatch?.[1] || message).slice(0, 120);
    console.error("[elroy] reading email failed", {
      code: emailError,
      hint: emailErrorHint,
    });
  }

  return {
    status: 200,
    body: {
      card: reading.card,
      reading: reading.reading,
      emailSent,
      ...(emailError
        ? {
            emailError,
            ...(emailErrorHint ? { emailErrorHint } : {}),
          }
        : {}),
    },
  };
}
