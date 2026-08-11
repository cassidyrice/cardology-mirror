import { describe, expect, test } from "bun:test";

import {
  buildMyQuestionOnboardingEmails,
  buildMyQuestionPaymentEmails,
} from "../lib/my-question/email";
import type { MyQuestionOrder } from "../lib/my-question/orders";

const order: MyQuestionOrder = {
  id: "mq_order_123",
  stripeSessionId: "cs_test_paid_123",
  stripePaymentIntentId: "pi_test_123",
  status: "ready",
  primaryBirthdate: "1991-02-17",
  includeQuestionBlueprint: true,
  customerEmail: "reader@example.com",
  customerName: "Cassidy",
  question:
    "Why has this year felt so hard, and what should I understand about the pattern I am moving through?",
  relevantBirthdates: ["1990-01-10"],
  amountCents: 12_800,
  fulfillmentDate: "2026-08-12",
  slotNumber: 2,
  deliveryUrl: null,
  createdAt: "2026-08-10T12:00:00.000Z",
  checkoutExpiresAt: "2026-08-11T12:00:00.000Z",
  paidAt: "2026-08-10T12:01:00.000Z",
  onboardingCompletedAt: "2026-08-10T12:05:00.000Z",
  productionStartedAt: null,
  deliveredAt: null,
  detailsPurgeAfter: null,
};

describe("My Question operational email copy", () => {
  test("payment emails give the buyer a verified onboarding link and warn that no date is reserved", () => {
    const messages = buildMyQuestionPaymentEmails(order, {
      siteUrl: "https://cardblueprints.com",
      creatorEmail: "creator@example.com",
      fulfillmentUrl: "https://cardblueprints.com/myquestion/fulfill?token=signed",
    });

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      to: "reader@example.com",
      idempotencyKey: "my-question:mq_order_123:customer-payment",
    });
    expect(messages[0].text).toContain(
      "https://cardblueprints.com/myquestion/onboarding?session_id=cs_test_paid_123",
    );
    expect(messages[0].text).toContain(
      "No production date is reserved until onboarding is complete.",
    );
    expect(messages[1]).toMatchObject({
      to: "creator@example.com",
      idempotencyKey: "my-question:mq_order_123:creator-payment",
    });
    expect(messages[1].text).toContain("Question Blueprint: included");
    expect(messages[1].text).toContain("$128.00 USD");
    expect(messages[1].text).toContain("token=signed");
  });

  test("onboarding emails restate the question and exact assigned date", () => {
    const messages = buildMyQuestionOnboardingEmails(order, {
      creatorEmail: "creator@example.com",
      fulfillmentUrl: "https://cardblueprints.com/myquestion/fulfill?token=signed",
    });

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      to: "reader@example.com",
      idempotencyKey: "my-question:mq_order_123:customer-onboarding",
    });
    expect(messages[0].text).toContain("Wednesday, August 12, 2026");
    expect(messages[0].text).toContain(order.question!);
    expect(messages[1]).toMatchObject({
      to: "creator@example.com",
      idempotencyKey: "my-question:mq_order_123:creator-onboarding",
    });
    expect(messages[1].text).toContain("Slot: 2 of 3");
    expect(messages[1].text).toContain("Relevant birthdates: 1990-01-10");
    expect(messages[1].text).toContain("token=signed");
  });

  test("refuses to build operational mail when paid order data is incomplete", () => {
    expect(() =>
      buildMyQuestionPaymentEmails(
        { ...order, customerEmail: null },
        {
          siteUrl: "https://cardblueprints.com",
          creatorEmail: "creator@example.com",
          fulfillmentUrl: "https://cardblueprints.com/myquestion/fulfill?token=signed",
        },
      ),
    ).toThrow("customer email");
  });
});
