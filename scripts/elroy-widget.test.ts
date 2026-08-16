import { describe, expect, test } from "bun:test";
import {
  canSubmitElroy,
  elroyUiReducer,
  formatElroyRulingCards,
  initialElroyUiState,
  isElroyEligiblePath,
  parseElroyBirthContext,
  readElroySuppression,
  shouldScheduleElroyTeaser,
  writeElroySuppression,
  ELROY_SUPPRESSION_KEY,
  THIRTY_DAYS_MS,
} from "../lib/elroy/widget";

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

describe("isElroyEligiblePath", () => {
  test("allows marketing routes", () => {
    expect(isElroyEligiblePath("/")).toBe(true);
    expect(isElroyEligiblePath("/birth-card-calculator")).toBe(true);
  });

  test("excludes checkout, legal, free-course, gate", () => {
    expect(isElroyEligiblePath("/checkout/personal-card-blueprint")).toBe(false);
    expect(isElroyEligiblePath("/privacy-policy")).toBe(false);
    expect(isElroyEligiblePath("/free-course")).toBe(false);
    expect(isElroyEligiblePath("/gate")).toBe(false);
  });
});

describe("shouldScheduleElroyTeaser", () => {
  test("does not auto-schedule the homepage teaser on small screens", () => {
    expect(shouldScheduleElroyTeaser("/", true)).toBe(false);
  });

  test("protects every mobile conversion route from the automatic teaser", () => {
    for (const path of [
      "/",
      "/birth-card-calculator",
      "/birth-card-compatibility-calculator",
      "/products/personal-card-blueprint",
    ]) {
      expect(shouldScheduleElroyTeaser(path, true)).toBe(false);
    }
  });

  test("normalizes query strings, hashes, and trailing slashes", () => {
    expect(
      shouldScheduleElroyTeaser(
        "/birth-card-calculator/?birthdate=2001-01-15#result",
        true,
      ),
    ).toBe(false);
    expect(
      shouldScheduleElroyTeaser(
        "/birth-card-compatibility-calculator/#result",
        true,
      ),
    ).toBe(false);
    expect(
      shouldScheduleElroyTeaser(
        "/products/personal-card-blueprint/?ref=elroy#details",
        true,
      ),
    ).toBe(false);
  });

  test("keeps the automatic teaser on protected routes for desktop visitors", () => {
    for (const path of [
      "/",
      "/birth-card-calculator",
      "/birth-card-compatibility-calculator",
      "/products/personal-card-blueprint",
    ]) {
      expect(shouldScheduleElroyTeaser(path, false)).toBe(true);
    }
  });

  test("keeps the automatic teaser on other eligible mobile routes", () => {
    expect(shouldScheduleElroyTeaser("/blog/how-to-use-cardology", true)).toBe(
      true,
    );
  });

  test("never schedules the automatic teaser on excluded routes", () => {
    for (const path of [
      "/checkout/personal-card-blueprint",
      "/privacy-policy/",
      "/free-course?step=1",
      "/gate#signup",
    ]) {
      expect(shouldScheduleElroyTeaser(path, false)).toBe(false);
      expect(shouldScheduleElroyTeaser(path, true)).toBe(false);
    }
  });
});

describe("suppression", () => {
  test("lasts 30 days and fails open on bad values", () => {
    const storage = memoryStorage();
    const now = Date.UTC(2026, 7, 8);
    expect(readElroySuppression(storage, now)).toBe(false);
    writeElroySuppression(storage, now);
    expect(readElroySuppression(storage, now + 1000)).toBe(true);
    expect(readElroySuppression(storage, now + THIRTY_DAYS_MS + 1)).toBe(false);
    storage.setItem(ELROY_SUPPRESSION_KEY, "nope");
    expect(readElroySuppression(storage, now)).toBe(false);
  });
});

describe("parseElroyBirthContext", () => {
  test("accepts ISO dates only", () => {
    expect(parseElroyBirthContext({ birthdate: "2001-01-15" })).toBe("2001-01-15");
    expect(parseElroyBirthContext({ birthdate: "bad" })).toBeNull();
  });
});

describe("formatElroyRulingCards", () => {
  test("renders human-readable ruling-card labels", () => {
    expect(formatElroyRulingCards(["7♣"])).toBe("7 of Clubs");
    expect(formatElroyRulingCards(["7♣", "K♠"])).toBe(
      "7 of Clubs and King of Spades",
    );
  });

  test("omits invalid codes", () => {
    expect(formatElroyRulingCards(["bad", "Q♦"])).toBe("Queen of Diamonds");
  });
});

describe("elroyUiReducer", () => {
  test("joker cannot continue to email", () => {
    let state = initialElroyUiState();
    state = elroyUiReducer(state, {
      type: "REVEAL_JOKER",
      birthdate: "1990-12-31",
    });
    state = elroyUiReducer(state, { type: "CONTINUE_TO_EMAIL" });
    expect(state.step).toBe("joker-boundary");
  });

  test("standard reveal can continue to email and requires consent+email to submit", () => {
    let state = initialElroyUiState();
    state = elroyUiReducer(state, {
      type: "REVEAL_STANDARD",
      birthdate: "2001-01-15",
      birthCard: "Q♦",
      birthCardLabel: "Queen of Diamonds",
    });
    state = elroyUiReducer(state, { type: "CONTINUE_TO_EMAIL" });
    expect(state.step).toBe("email");
    expect(canSubmitElroy(state)).toBe(false);
    state = elroyUiReducer(state, { type: "SET_EMAIL", value: "not-an-email" });
    state = elroyUiReducer(state, { type: "SET_CONSENT", value: true });
    expect(canSubmitElroy(state)).toBe(false);
    state = elroyUiReducer(state, { type: "SET_EMAIL", value: "p@example.com" });
    expect(canSubmitElroy(state)).toBe(true);
    state = elroyUiReducer(state, { type: "SUBMIT" });
    expect(state.step).toBe("submitting");
  });

  test("retry returns to email step", () => {
    let state = initialElroyUiState();
    state = elroyUiReducer(state, {
      type: "REVEAL_STANDARD",
      birthdate: "2001-01-15",
      birthCard: "Q♦",
      birthCardLabel: "Queen of Diamonds",
    });
    state = elroyUiReducer(state, { type: "CONTINUE_TO_EMAIL" });
    state = elroyUiReducer(state, { type: "FAIL", message: "nope" });
    state = elroyUiReducer(state, { type: "RETRY" });
    expect(state.step).toBe("email");
    expect(state.errorMessage).toBe("");
  });
});
