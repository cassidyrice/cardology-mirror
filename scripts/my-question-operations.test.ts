import { describe, expect, test } from "bun:test";

import {
  decideMyQuestionOperations,
  type MyQuestionOpsRecord,
} from "../lib/my-question/operations";

const waitingOrder: MyQuestionOpsRecord = {
  id: "mq_waiting",
  status: "paid_awaiting_intake",
  paidAt: "2026-08-10T12:00:00.000Z",
  manualExtensionUntil: null,
  reminder1hSentAt: null,
  reminder24hSentAt: null,
  reminder72hSentAt: null,
  detailsPurgeAfter: null,
};

describe("My Question scheduled operation decisions", () => {
  test("sends the first onboarding reminder at one hour, once", () => {
    expect(
      decideMyQuestionOperations(
        waitingOrder,
        new Date("2026-08-10T12:59:59.999Z"),
        false,
      ),
    ).toEqual([]);
    expect(
      decideMyQuestionOperations(
        waitingOrder,
        new Date("2026-08-10T13:00:00.000Z"),
        false,
      ),
    ).toEqual(["remind_1h"]);
    expect(
      decideMyQuestionOperations(
        {
          ...waitingOrder,
          reminder1hSentAt: "2026-08-10T13:00:00.000Z",
        },
        new Date("2026-08-10T13:00:01.000Z"),
        false,
      ),
    ).toEqual([]);
  });

  test("sends the 24-hour and 72-hour reminders in order", () => {
    const afterFirst = {
      ...waitingOrder,
      reminder1hSentAt: "2026-08-10T13:00:00.000Z",
    };
    expect(
      decideMyQuestionOperations(
        afterFirst,
        new Date("2026-08-11T12:00:00.000Z"),
        false,
      ),
    ).toEqual(["remind_24h"]);

    expect(
      decideMyQuestionOperations(
        {
          ...afterFirst,
          reminder24hSentAt: "2026-08-11T12:00:00.000Z",
        },
        new Date("2026-08-13T12:00:00.000Z"),
        false,
      ),
    ).toEqual(["remind_72h"]);
  });

  test("flags a 14-day incomplete order and requires a separate flag for automatic refund", () => {
    const fullyReminded = {
      ...waitingOrder,
      reminder1hSentAt: "2026-08-10T13:00:00.000Z",
      reminder24hSentAt: "2026-08-11T12:00:00.000Z",
      reminder72hSentAt: "2026-08-13T12:00:00.000Z",
    };
    const dueAt = new Date("2026-08-24T12:00:00.000Z");

    expect(decideMyQuestionOperations(fullyReminded, dueAt, false)).toEqual([
      "flag_refund_due",
    ]);
    expect(decideMyQuestionOperations(fullyReminded, dueAt, true)).toEqual([
      "refund_and_close",
    ]);
    expect(
      decideMyQuestionOperations(
        {
          ...fullyReminded,
          manualExtensionUntil: "2026-08-25T12:00:00.000Z",
        },
        dueAt,
        true,
      ),
    ).toEqual([]);
  });

  test("purges delivered intake only when its purge timestamp is due", () => {
    const delivered = {
      ...waitingOrder,
      status: "delivered" as const,
      detailsPurgeAfter: "2026-11-08T14:00:00.000Z",
    };
    expect(
      decideMyQuestionOperations(
        delivered,
        new Date("2026-11-08T13:59:59.999Z"),
        false,
      ),
    ).toEqual([]);
    expect(
      decideMyQuestionOperations(
        delivered,
        new Date("2026-11-08T14:00:00.000Z"),
        false,
      ),
    ).toEqual(["purge_intake"]);
  });
});
