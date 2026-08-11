import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import type { MyQuestionEmailMessage } from "../lib/my-question/email";
import {
  attachStripeSession,
  createPendingOrder,
  findOrderById,
  markOrderPaid,
  submitIntakeAndAssign,
} from "../lib/my-question/orders";
import {
  deliverMyQuestionOrder,
  loadMyQuestionFulfillment,
  startMyQuestionProduction,
} from "../lib/my-question/fulfillment-service";
import { signOrderAccess } from "../lib/my-question/token";
import { createMyQuestionTestDb, type SqliteD1 } from "./helpers/sqlite-d1";

const signingSecret = "test-signing-secret-with-more-than-32-characters";
const now = new Date("2026-08-10T14:00:00.000Z");
let db: SqliteD1;
let close: () => void;
let token: string;

beforeEach(async () => {
  ({ db, close } = createMyQuestionTestDb());
  await createPendingOrder(db, {
    id: "mq_fulfillment_1",
    primaryBirthdate: "1991-02-17",
    includeQuestionBlueprint: true,
    createdAt: "2026-08-10T12:00:00.000Z",
    expiresAt: "2026-08-11T12:00:00.000Z",
  });
  await attachStripeSession(
    db,
    "mq_fulfillment_1",
    "cs_test_fulfillment_1",
    "2026-08-10T12:00:05.000Z",
  );
  await markOrderPaid(db, {
    sessionId: "cs_test_fulfillment_1",
    email: "reader@example.com",
    paymentIntentId: "pi_test_fulfillment_1",
    amountCents: 12_800,
    paidAt: "2026-08-10T12:01:00.000Z",
  });
  await submitIntakeAndAssign(db, {
    sessionId: "cs_test_fulfillment_1",
    customerName: "Cassidy",
    question: "What should I understand about the pattern I am moving through?",
    relevantBirthdates: [],
    completedAt: "2026-08-10T12:05:00.000Z",
  });
  token = await signOrderAccess(
    {
      orderId: "mq_fulfillment_1",
      scope: "fulfill",
      expiresAt: "2026-09-24T14:00:00.000Z",
    },
    signingSecret,
  );
});

afterEach(() => close());

describe("My Question fulfillment service", () => {
  test("loads a ready order only through a valid fulfill-scoped token", async () => {
    const result = await loadMyQuestionFulfillment(token, {
      db,
      signingSecret,
      now,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value).toMatchObject({
      id: "mq_fulfillment_1",
      status: "ready",
      question: "What should I understand about the pattern I am moving through?",
    });

    const onboardingToken = await signOrderAccess(
      {
        orderId: "mq_fulfillment_1",
        scope: "onboarding",
        expiresAt: "2026-09-24T14:00:00.000Z",
      },
      signingSecret,
    );
    const rejected = await loadMyQuestionFulfillment(onboardingToken, {
      db,
      signingSecret,
      now,
    });
    expect(rejected).toEqual({
      ok: false,
      status: 403,
      code: "invalid_access",
      message: "This private fulfillment link is invalid or expired.",
    });
  });

  test("starts production idempotently through the signed creator link", async () => {
    const first = await startMyQuestionProduction(token, {
      db,
      signingSecret,
      now,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.message);
    expect(first.value.status).toBe("in_production");
    expect(first.value.productionStartedAt).toBe(now.toISOString());

    const second = await startMyQuestionProduction(token, {
      db,
      signingSecret,
      now: new Date("2026-08-10T15:00:00.000Z"),
    });
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error(second.message);
    expect(second.value.productionStartedAt).toBe(now.toISOString());
  });

  test("does not mark an order delivered when its customer email fails", async () => {
    await startMyQuestionProduction(token, { db, signingSecret, now });

    const result = await deliverMyQuestionOrder(
      {
        token,
        deliveryUrl:
          "https://drive.google.com/file/d/abc123/view?usp=sharing",
      },
      {
        db,
        signingSecret,
        creatorEmail: "creator@example.com",
        now,
        send: async () => {
          throw new Error("provider unavailable");
        },
      },
    );

    expect(result).toEqual({
      ok: false,
      status: 502,
      code: "delivery_notification_failed",
      message: "Delivery email failed. The order was not marked delivered.",
    });
    const stored = await findOrderById(db, "mq_fulfillment_1");
    expect(stored?.status).toBe("in_production");
    expect(stored?.deliveryUrl).toBeNull();
  });

  test("emails the private link before marking delivery and starts the 90-day purge clock", async () => {
    await startMyQuestionProduction(token, { db, signingSecret, now });
    const sent: Array<{ to: string; text: string }> = [];
    const deliveryUrl =
      "https://drive.google.com/file/d/abc123/view?usp=sharing";

    const result = await deliverMyQuestionOrder(
      { token, deliveryUrl },
      {
        db,
        signingSecret,
        creatorEmail: "creator@example.com",
        now,
        send: async (message: MyQuestionEmailMessage) => {
          sent.push(message);
        },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "reader@example.com" });
    expect(sent[0].text).toContain(deliveryUrl);
    expect(result.value).toMatchObject({
      status: "delivered",
      deliveryUrl,
      deliveredAt: "2026-08-10T14:00:00.000Z",
      detailsPurgeAfter: "2026-11-08T14:00:00.000Z",
    });
  });
});
