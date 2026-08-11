import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  attachStripeSession,
  createPendingOrder,
  findOrderById,
  findOrderBySessionId,
  markOrderDelivered,
  markOrderPaid,
  markProductionStarted,
  submitIntakeAndAssign,
} from "../lib/my-question/orders";
import {
  createMyQuestionTestDb,
  type SqliteD1,
} from "./helpers/sqlite-d1";

const NOW = new Date("2026-08-10T20:00:00.000Z");

let db: SqliteD1;
let closeDb: () => void;

beforeEach(() => {
  ({ db, close: closeDb } = createMyQuestionTestDb());
});

afterEach(() => closeDb());

async function paidOrder(index: number) {
  const id = `order_${index}`;
  const sessionId = `cs_test_${index}`;
  await createPendingOrder(db, {
    id,
    primaryBirthdate: "1991-02-17",
    includeQuestionBlueprint: index % 2 === 0,
    createdAt: NOW.toISOString(),
    expiresAt: "2026-08-11T20:00:00.000Z",
  });
  await attachStripeSession(db, id, sessionId, NOW.toISOString());
  await markOrderPaid(db, {
    sessionId,
    email: `buyer${index}@example.com`,
    paymentIntentId: `pi_test_${index}`,
    amountCents: index % 2 === 0 ? 12_800 : 9_900,
    paidAt: NOW.toISOString(),
  });
  return { id, sessionId };
}

describe("My Question D1 orders", () => {
  test("creates a short-lived pending order and attaches one Stripe session", async () => {
    await createPendingOrder(db, {
      id: "order_1",
      primaryBirthdate: "1991-02-17",
      includeQuestionBlueprint: true,
      createdAt: NOW.toISOString(),
      expiresAt: "2026-08-11T20:00:00.000Z",
    });
    await attachStripeSession(db, "order_1", "cs_test_1", NOW.toISOString());

    expect(await findOrderById(db, "order_1")).toMatchObject({
      id: "order_1",
      stripeSessionId: "cs_test_1",
      status: "checkout_pending",
      primaryBirthdate: "1991-02-17",
      includeQuestionBlueprint: true,
    });
  });

  test("marks a paid order idempotently", async () => {
    const { sessionId } = await paidOrder(1);
    await markOrderPaid(db, {
      sessionId,
      email: "buyer1@example.com",
      paymentIntentId: "pi_test_1",
      amountCents: 9_900,
      paidAt: NOW.toISOString(),
    });

    expect(await findOrderBySessionId(db, sessionId)).toMatchObject({
      status: "paid_awaiting_intake",
      customerEmail: "buyer1@example.com",
      amountCents: 9_900,
    });
  });

  test("assigns three orders to a weekday and rolls the fourth forward", async () => {
    const orders = await Promise.all([1, 2, 3, 4].map(paidOrder));
    const assigned = [];
    for (const order of orders) {
      assigned.push(
        await submitIntakeAndAssign(db, {
          sessionId: order.sessionId,
          customerName: `Buyer ${order.id}`,
          question: "Why does this pattern keep repeating?",
          relevantBirthdates: [],
          completedAt: NOW.toISOString(),
        }),
      );
    }

    expect(
      assigned.map((order) => [order.fulfillmentDate, order.slotNumber]),
    ).toEqual([
      ["2026-08-11", 1],
      ["2026-08-11", 2],
      ["2026-08-11", 3],
      ["2026-08-12", 1],
    ]);
  });

  test("returns the original slot when onboarding is submitted again", async () => {
    const { sessionId } = await paidOrder(1);
    const first = await submitIntakeAndAssign(db, {
      sessionId,
      customerName: "First Name",
      question: "Why does this pattern keep repeating?",
      relevantBirthdates: [],
      completedAt: NOW.toISOString(),
    });
    const repeated = await submitIntakeAndAssign(db, {
      sessionId,
      customerName: "Changed Name",
      question: "A different question?",
      relevantBirthdates: ["1989-04-08"],
      completedAt: "2026-08-10T20:05:00.000Z",
    });

    expect(repeated.fulfillmentDate).toBe(first.fulfillmentDate);
    expect(repeated.slotNumber).toBe(first.slotNumber);
    expect(repeated.customerName).toBe("First Name");
    expect(repeated.question).toBe("Why does this pattern keep repeating?");
  });

  test("enforces production and delivery status transitions", async () => {
    const { id, sessionId } = await paidOrder(1);
    await submitIntakeAndAssign(db, {
      sessionId,
      customerName: "Buyer",
      question: "Why does this pattern keep repeating?",
      relevantBirthdates: [],
      completedAt: NOW.toISOString(),
    });

    const started = await markProductionStarted(
      db,
      id,
      "2026-08-11T14:00:00.000Z",
    );
    expect(started.status).toBe("in_production");

    const delivered = await markOrderDelivered(db, {
      orderId: id,
      deliveryUrl: "https://drive.google.com/file/d/example/view",
      deliveredAt: "2026-08-11T19:00:00.000Z",
      purgeAfter: "2026-11-09T19:00:00.000Z",
    });
    expect(delivered).toMatchObject({
      status: "delivered",
      deliveryUrl: "https://drive.google.com/file/d/example/view",
      detailsPurgeAfter: "2026-11-09T19:00:00.000Z",
    });
  });
});
