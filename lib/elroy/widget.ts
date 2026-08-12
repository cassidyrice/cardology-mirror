import { parseCard } from "@/lib/cards";
import { isValidElroyEmail } from "@/lib/elroy/input";

export const ELROY_SUPPRESSION_KEY = "cardblueprints.elroy.suppress_until";
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const EXCLUDED_PREFIXES = [
  "/checkout",
  "/gate",
  "/free-course",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
];

export function isElroyEligiblePath(pathname: string): boolean {
  if (!pathname || !pathname.startsWith("/")) return false;
  const path = pathname.split("?")[0] || "/";
  return !EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function readElroySuppression(storage: Storage, nowMs: number): boolean {
  try {
    const raw = storage.getItem(ELROY_SUPPRESSION_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) {
      storage.removeItem(ELROY_SUPPRESSION_KEY);
      return false;
    }
    if (until <= nowMs) {
      storage.removeItem(ELROY_SUPPRESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function writeElroySuppression(storage: Storage, nowMs: number): void {
  try {
    storage.setItem(ELROY_SUPPRESSION_KEY, String(nowMs + THIRTY_DAYS_MS));
  } catch {
    // private mode — ignore
  }
}

export function parseElroyBirthContext(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const birthdate = (detail as { birthdate?: unknown }).birthdate;
  if (typeof birthdate !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return null;
  return birthdate;
}

export function formatElroyRulingCards(codes: string[]): string {
  return codes
    .map((code) => parseCard(code)?.label || "")
    .filter(Boolean)
    .join(" and ");
}

export type ElroyStep =
  | "welcome"
  | "birthdate"
  | "card-reveal"
  | "joker-boundary"
  | "email"
  | "submitting"
  | "reading"
  | "error";

export type ElroyUiState = {
  step: ElroyStep;
  birthdate: string;
  birthCard: string;
  birthCardLabel: string;
  email: string;
  consent: boolean;
  errorMessage: string;
  reading: {
    core: string;
    tension: string;
    reflection: string;
    disclaimer: string;
    rulingCards: string[];
  } | null;
  emailSent: boolean | null;
};

export type ElroyUiAction =
  | { type: "RESET"; birthdate?: string }
  | { type: "SET_BIRTHDATE"; value: string }
  | {
      type: "REVEAL_STANDARD";
      birthdate: string;
      birthCard: string;
      birthCardLabel: string;
    }
  | { type: "REVEAL_JOKER"; birthdate: string }
  | { type: "CONTINUE_TO_EMAIL" }
  | { type: "SET_EMAIL"; value: string }
  | { type: "SET_CONSENT"; value: boolean }
  | { type: "SUBMIT" }
  | {
      type: "SUCCESS";
      reading: NonNullable<ElroyUiState["reading"]>;
      emailSent: boolean;
    }
  | { type: "FAIL"; message: string; soft?: boolean }
  | { type: "RETRY" };

export function initialElroyUiState(birthdate = ""): ElroyUiState {
  return {
    step: birthdate ? "birthdate" : "welcome",
    birthdate,
    birthCard: "",
    birthCardLabel: "",
    email: "",
    consent: false,
    errorMessage: "",
    reading: null,
    emailSent: null,
  };
}

export function elroyUiReducer(
  state: ElroyUiState,
  action: ElroyUiAction,
): ElroyUiState {
  switch (action.type) {
    case "RESET":
      return initialElroyUiState(action.birthdate || "");
    case "SET_BIRTHDATE":
      return { ...state, birthdate: action.value, step: "birthdate" };
    case "REVEAL_STANDARD":
      return {
        ...state,
        step: "card-reveal",
        birthdate: action.birthdate,
        birthCard: action.birthCard,
        birthCardLabel: action.birthCardLabel,
        errorMessage: "",
      };
    case "REVEAL_JOKER":
      return {
        ...state,
        step: "joker-boundary",
        birthdate: action.birthdate,
        birthCard: "Joker",
        birthCardLabel: "Joker",
        errorMessage: "",
      };
    case "CONTINUE_TO_EMAIL":
      if (state.step !== "card-reveal") return state;
      return { ...state, step: "email", errorMessage: "" };
    case "SET_EMAIL":
      return { ...state, email: action.value };
    case "SET_CONSENT":
      return { ...state, consent: action.value };
    case "SUBMIT":
      if (state.step !== "email" && state.step !== "error") return state;
      if (!state.consent || !state.email) return state;
      return { ...state, step: "submitting", errorMessage: "" };
    case "SUCCESS":
      return {
        ...state,
        step: "reading",
        reading: action.reading,
        emailSent: action.emailSent,
      };
    case "FAIL":
      return {
        ...state,
        step: "error",
        errorMessage: action.message,
      };
    case "RETRY":
      return {
        ...state,
        step: "email",
        errorMessage: "",
      };
    default:
      return state;
  }
}

export function canSubmitElroy(state: ElroyUiState): boolean {
  return (
    (state.step === "email" || state.step === "error") &&
    state.consent &&
    isValidElroyEmail(state.email)
  );
}
