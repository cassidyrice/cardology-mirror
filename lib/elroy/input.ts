import { publicBirthCardCode } from "@/lib/birth-card-truth";
import type { ElroyBirth, NormalizedElroyRequest } from "./types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ElroyInputError extends Error {
  constructor(
    readonly code: "invalid" | "joker",
    message: string,
  ) {
    super(message);
    this.name = "ElroyInputError";
  }
}

export function normalizeBirthdate(value: unknown, now = new Date()): string {
  const birthdate = typeof value === "string" ? value.trim() : "";
  const match = ISO_DATE.exec(birthdate);
  if (!match) throw new ElroyInputError("invalid", "Enter a valid birth date.");
  const [, ys, ms, ds] = match;
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new ElroyInputError("invalid", "Enter a valid birth date.");
  }
  if (birthdate > now.toISOString().slice(0, 10)) {
    throw new ElroyInputError("invalid", "Birth date cannot be in the future.");
  }
  return birthdate;
}

export function classifyElroyBirthdate(value: unknown, now = new Date()): ElroyBirth {
  const birthdate = normalizeBirthdate(value, now);
  const [, month, day] = birthdate.split("-").map(Number);
  const birthCard = publicBirthCardCode(month, day);
  return birthCard === "Joker"
    ? { kind: "joker", birthdate, birthCard }
    : { kind: "standard", birthdate, birthCard };
}

export function normalizeElroyRequest(
  raw: Record<string, unknown>,
  now = new Date(),
): NormalizedElroyRequest {
  // Input validation may detect the known boundary, but it does not call the
  // Cardology engine. Standard-card resolution happens only after Turnstile.
  const birthdate = normalizeBirthdate(raw.birthdate, now);
  if (birthdate.endsWith("-12-31")) {
    throw new ElroyInputError("joker", "Joker boundary");
  }
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    throw new ElroyInputError("invalid", "Enter a valid email.");
  }
  if (raw.consent !== true) {
    throw new ElroyInputError("invalid", "consent is required.");
  }
  const turnstileToken =
    typeof raw.turnstileToken === "string" ? raw.turnstileToken.trim() : "";
  if (!turnstileToken || turnstileToken.length > 4096) {
    throw new ElroyInputError("invalid", "Verification is required.");
  }
  const sourceValue = typeof raw.source === "string" ? raw.source : "/";
  const source = sourceValue.split("?")[0].slice(0, 160) || "/";
  return { birthdate, email, consent: true, source, turnstileToken };
}
