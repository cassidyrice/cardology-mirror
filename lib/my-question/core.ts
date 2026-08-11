export const MY_QUESTION_PRICE_CENTS = 9_900;
export const QUESTION_BLUEPRINT_PRICE_CENTS = 2_900;
export const MY_QUESTION_TIME_ZONE = "America/Chicago";
export const MY_QUESTION_DAILY_CAPACITY = 3;
export const MY_QUESTION_MAX_LENGTH = 600;
export const MY_QUESTION_MAX_RELEVANT_BIRTHDATES = 3;

type ValidationSuccess<T> = { ok: true; value: T };
type ValidationFailure = {
  ok: false;
  code: string;
  message: string;
  category?: string;
};
export type ValidationResult<T> =
  | ValidationSuccess<T>
  | ValidationFailure;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePrimaryBirthdate(
  raw: string,
  todayIso: string,
): ValidationResult<string> {
  const value = raw.trim();
  if (!isCalendarDate(value)) {
    return fail("invalid_birthdate", "Enter a real birthdate.");
  }
  if (value > todayIso) {
    return fail("future_birthdate", "Birthdates cannot be in the future.");
  }
  if (value.endsWith("-12-31")) {
    return fail(
      "joker_boundary",
      "December 31 is not supported by this reading yet. No payment was taken.",
    );
  }
  return { ok: true, value };
}

export function validateQuestion(raw: string): ValidationResult<string> {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) {
    return fail("question_required", "Enter one focused question.");
  }
  if (value.length > MY_QUESTION_MAX_LENGTH) {
    return fail(
      "question_too_long",
      `Keep the question to ${MY_QUESTION_MAX_LENGTH} characters or fewer.`,
    );
  }
  if ((value.match(/\?+/g) ?? []).length > 1) {
    return fail(
      "multiple_questions",
      "Choose one primary question so the reading can stay specific.",
    );
  }

  const prohibited = prohibitedCategory(value);
  if (prohibited) {
    return {
      ok: false,
      code: "prohibited_question",
      category: prohibited,
      message:
        "This reading cannot provide professional advice, emergency help, guaranteed predictions, or another person's private thoughts.",
    };
  }

  return { ok: true, value };
}

export function validateRelevantBirthdates(
  rawValues: string[],
  todayIso: string,
): ValidationResult<string[]> {
  const values = rawValues.map((value) => value.trim()).filter(Boolean);
  if (values.length > MY_QUESTION_MAX_RELEVANT_BIRTHDATES) {
    return fail(
      "too_many_relevant_birthdates",
      `Include no more than ${MY_QUESTION_MAX_RELEVANT_BIRTHDATES} additional birthdates.`,
    );
  }

  const unique = new Set<string>();
  for (const value of values) {
    const validated = validatePrimaryBirthdate(value, todayIso);
    if (!validated.ok) {
      return fail(
        "invalid_relevant_birthdate",
        validated.code === "joker_boundary"
          ? "December 31 is not supported as a relevant birthdate yet."
          : "Enter real, past dates for each relevant person.",
      );
    }
    if (unique.has(validated.value)) {
      return fail(
        "duplicate_relevant_birthdate",
        "Each relevant birthdate should appear only once.",
      );
    }
    unique.add(validated.value);
  }

  return { ok: true, value: [...unique] };
}

export function candidateFulfillmentDates(
  now: Date,
  count: number,
  timeZone = MY_QUESTION_TIME_ZONE,
): string[] {
  const local = dateParts(now, timeZone);
  const cursor = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const dates: string[] = [];

  while (dates.length < count) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const weekday = cursor.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    dates.push(cursor.toISOString().slice(0, 10));
  }

  return dates;
}

export function localDateIso(
  now: Date,
  timeZone = MY_QUESTION_TIME_ZONE,
): string {
  const local = dateParts(now, timeZone);
  return [local.year, local.month, local.day]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
    .join("-");
}

export function firstAvailableFulfillmentDate(
  candidates: string[],
  assignedCounts: Record<string, number>,
): string | null {
  return (
    candidates.find(
      (date) =>
        (assignedCounts[date] ?? 0) < MY_QUESTION_DAILY_CAPACITY,
    ) ?? null
  );
}

export function orderTotalCents(includeQuestionBlueprint: boolean): number {
  return (
    MY_QUESTION_PRICE_CENTS +
    (includeQuestionBlueprint ? QUESTION_BLUEPRINT_PRICE_CENTS : 0)
  );
}

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function prohibitedCategory(value: string): string | null {
  const rules: Array<[string, RegExp]> = [
    [
      "crisis",
      /\b(?:kill myself|hurt myself|suicid\w*|self[- ]harm|immediate danger|emergency)\b/i,
    ],
    [
      "mental_health",
      /\b(?:mental health diagnosis|diagnose\w*\s+(?:adhd|autism|bipolar|depression)|therapy advice|psychiatric treatment)\b/i,
    ],
    [
      "legal",
      /\b(?:legal advice|legal strategy|court strategy|lawsuit|attorney|lawyer|sue|custody strategy)\b/i,
    ],
    [
      "financial",
      /\b(?:financial advice|stock|securit(?:y|ies)|invest(?:ment|ing)?|portfolio|cryptocurrency|crypto|tax advice|bankruptcy|mortgage advice)\b/i,
    ],
    [
      "medical",
      /\b(?:medical advice|diagnos(?:e|is)|treat(?:ment)?|symptom|medication|medicine|disease|pregnan\w*)\b/i,
    ],
    [
      "guaranteed_prediction",
      /\b(?:guarantee(?:d)?|exact date|definitely happen|certain future|predict with certainty)\b/i,
    ],
    [
      "mind_reading",
      /\b(?:secretly thinking|exactly what .* (?:thinks|thinking)|read (?:his|her|their) mind|private thoughts)\b/i,
    ],
  ];

  return rules.find(([, pattern]) => pattern.test(value))?.[0] ?? null;
}

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function fail(code: string, message: string): ValidationFailure {
  return { ok: false, code, message };
}
