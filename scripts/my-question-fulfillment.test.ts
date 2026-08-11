import { describe, expect, test } from "bun:test";

import {
  buildMyQuestionDeliveryEmail,
  validateMyQuestionDeliveryUrl,
} from "../lib/my-question/fulfillment";
import type { MyQuestionOrder } from "../lib/my-question/orders";

const order: MyQuestionOrder = {
  id: "mq_order_delivery",
  stripeSessionId: "cs_test_delivery",
  stripePaymentIntentId: "pi_test_delivery",
  status: "in_production",
  primaryBirthdate: "1991-02-17",
  includeQuestionBlueprint: true,
  customerEmail: "reader@example.com",
  customerName: "Cassidy",
  question: "What should I understand about the pattern I am moving through?",
  relevantBirthdates: [],
  amountCents: 12_800,
  fulfillmentDate: "2026-08-12",
  slotNumber: 2,
  deliveryUrl: null,
  createdAt: "2026-08-10T12:00:00.000Z",
  checkoutExpiresAt: "2026-08-11T12:00:00.000Z",
  paidAt: "2026-08-10T12:01:00.000Z",
  onboardingCompletedAt: "2026-08-10T12:05:00.000Z",
  productionStartedAt: "2026-08-10T13:00:00.000Z",
  deliveredAt: null,
  detailsPurgeAfter: null,
};

describe("My Question fulfillment", () => {
  test("accepts only secure Google Drive delivery URLs", () => {
    expect(
      validateMyQuestionDeliveryUrl(
        "https://drive.google.com/file/d/abc123/view?usp=sharing",
      ),
    ).toEqual({
      ok: true,
      value: "https://drive.google.com/file/d/abc123/view?usp=sharing",
    });
    expect(
      validateMyQuestionDeliveryUrl(
        "http://drive.google.com/file/d/abc123/view",
      ).ok,
    ).toBe(false);
    expect(
      validateMyQuestionDeliveryUrl(
        "https://drive.google.com.evil.example/file/d/abc123/view",
      ).ok,
    ).toBe(false);
    expect(
      validateMyQuestionDeliveryUrl("https://example.com/reading.mp4").ok,
    ).toBe(false);
  });

  test("delivery email restates the question, private link, access period, and correction route", () => {
    const message = buildMyQuestionDeliveryEmail(
      order,
      "https://drive.google.com/file/d/abc123/view?usp=sharing",
      "creator@example.com",
    );

    expect(message).toMatchObject({
      to: "reader@example.com",
      replyTo: "creator@example.com",
      idempotencyKey: "my-question:mq_order_delivery:delivery",
    });
    expect(message.text).toContain(order.question!);
    expect(message.text).toContain(
      "https://drive.google.com/file/d/abc123/view?usp=sharing",
    );
    expect(message.text).toContain("at least 12 months");
    expect(message.text).toContain("reply to this email");
    expect(message.text).toContain("Question Blueprint");
  });
});
