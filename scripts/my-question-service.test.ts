import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { findOrderById } from "../lib/my-question/orders";
import {
  completePaidOnboarding,
  prepareMyQuestionCheckout,
  verifyPaidMyQuestionOrder,
  type MyQuestionStripe,
} from "../lib/my-question/service";
import {
  createMyQuestionTestDb,
  type SqliteD1,
} from "./helpers/sqlite-d1";

const NOW = new Date("2026-08-10T20:00:00.000Z");
const CONFIG = {
  checkoutEnabled: true,
  proofApproved: true,
  basePriceId: "price_base",
  blueprintPriceId: "price_blueprint",
  siteUrl: "https://cardblueprints.com",
};

class FakeStripe implements MyQuestionStripe {
  created: Record<string, unknown>[] = [];
  expired: string[] = [];
  session = {
    id: "cs_test_my_question",
    url: "https://checkout.stripe.test/session",
    status: "open",
    payment_status: "unpaid",
    amount_total: 12_800,
    customer_details: { email: "buyer@example.com" },
    customer_email: null,
    payment_intent: "pi_test_my_question",
    metadata: {
      offer_slug: "my-question",
      order_id: "order_test",
      question_blueprint: "yes",
    },
  };

  checkout: MyQuestionStripe["checkout"];

  constructor() {
    this.checkout = {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          this.created.push(params);
          return this.session;
        },
        retrieve: async () => this.session,
        expire: async (sessionId: string) => {
          this.expired.push(sessionId);
          return this.session;
        },
      },
    };
  }
}

let db: SqliteD1;
let closeDb: () => void;
let stripe: FakeStripe;

beforeEach(() => {
  ({ db, close: closeDb } = createMyQuestionTestDb());
  stripe = new FakeStripe();
});

afterEach(() => closeDb());

describe("My Question checkout service", () => {
  test("fails before Stripe when proof approval is absent", async () => {
    const result = await prepareMyQuestionCheckout(
      {
        primaryBirthdate: "1991-02-17",
        includeQuestionBlueprint: false,
      },
      {
        db,
        stripe,
        config: { ...CONFIG, proofApproved: false },
        now: NOW,
        idFactory: () => "order_test",
      },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "checkout_unavailable",
    });
    expect(stripe.created).toHaveLength(0);
  });

  test("rejects December 31 before storing or charging", async () => {
    const result = await prepareMyQuestionCheckout(
      {
        primaryBirthdate: "1991-12-31",
        includeQuestionBlueprint: false,
      },
      {
        db,
        stripe,
        config: CONFIG,
        now: NOW,
        idFactory: () => "order_test",
      },
    );

    expect(result).toMatchObject({ ok: false, code: "joker_boundary" });
    expect(stripe.created).toHaveLength(0);
    expect(await findOrderById(db, "order_test")).toBeNull();
  });

  test("creates server-priced base and add-on line items without Stripe metadata PII", async () => {
    const result = await prepareMyQuestionCheckout(
      {
        primaryBirthdate: "1991-02-17",
        includeQuestionBlueprint: true,
      },
      {
        db,
        stripe,
        config: CONFIG,
        now: NOW,
        idFactory: () => "order_test",
      },
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        checkoutUrl: "https://checkout.stripe.test/session",
        sessionId: "cs_test_my_question",
      },
    });
    expect(stripe.created[0]).toMatchObject({
      mode: "payment",
      line_items: [
        { price: "price_base", quantity: 1 },
        { price: "price_blueprint", quantity: 1 },
      ],
      success_url:
        "https://cardblueprints.com/myquestion/onboarding?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://cardblueprints.com/myquestion#order",
      metadata: {
        offer_slug: "my-question",
        order_id: "order_test",
        question_blueprint: "yes",
      },
    });
    expect(JSON.stringify(stripe.created[0])).not.toContain("1991-02-17");
    expect(await findOrderById(db, "order_test")).toMatchObject({
      stripeSessionId: "cs_test_my_question",
      includeQuestionBlueprint: true,
    });
  });
});

describe("My Question paid-session gate", () => {
  async function prepare() {
    return prepareMyQuestionCheckout(
      {
        primaryBirthdate: "1991-02-17",
        includeQuestionBlueprint: true,
      },
      {
        db,
        stripe,
        config: CONFIG,
        now: NOW,
        idFactory: () => "order_test",
      },
    );
  }

  test("rejects an unpaid Checkout Session", async () => {
    await prepare();
    const result = await verifyPaidMyQuestionOrder(
      "cs_test_my_question",
      { db, stripe, now: NOW },
    );

    expect(result).toMatchObject({ ok: false, code: "payment_not_verified" });
  });

  test("rejects an amount that does not match the stored order", async () => {
    await prepare();
    stripe.session.status = "complete";
    stripe.session.payment_status = "paid";
    stripe.session.amount_total = 9_900;

    const result = await verifyPaidMyQuestionOrder(
      "cs_test_my_question",
      { db, stripe, now: NOW },
    );

    expect(result).toMatchObject({ ok: false, code: "payment_mismatch" });
    expect(await findOrderById(db, "order_test")).toMatchObject({
      status: "checkout_pending",
    });
  });

  test("syncs a correctly paid order and assigns intake once", async () => {
    await prepare();
    stripe.session.status = "complete";
    stripe.session.payment_status = "paid";

    const result = await completePaidOnboarding(
      {
        sessionId: "cs_test_my_question",
        customerName: "  Buyer Name  ",
        question: "Why does this relationship keep repeating the same conflict?",
        relevantBirthdates: ["1989-04-08"],
      },
      { db, stripe, now: NOW },
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        status: "ready",
        customerName: "Buyer Name",
        customerEmail: "buyer@example.com",
        fulfillmentDate: "2026-08-11",
        slotNumber: 1,
        relevantBirthdates: ["1989-04-08"],
      },
    });

    const repeated = await completePaidOnboarding(
      {
        sessionId: "cs_test_my_question",
        customerName: "Different Name",
        question: "A different question?",
        relevantBirthdates: [],
      },
      { db, stripe, now: new Date("2026-08-10T20:05:00.000Z") },
    );
    expect(repeated).toMatchObject({
      ok: true,
      value: {
        customerName: "Buyer Name",
        question: "Why does this relationship keep repeating the same conflict?",
        fulfillmentDate: "2026-08-11",
        slotNumber: 1,
      },
    });
  });

  test("rejects prohibited intake before assigning capacity", async () => {
    await prepare();
    stripe.session.status = "complete";
    stripe.session.payment_status = "paid";

    const result = await completePaidOnboarding(
      {
        sessionId: "cs_test_my_question",
        customerName: "Buyer",
        question: "Which stock should I invest everything in?",
        relevantBirthdates: [],
      },
      { db, stripe, now: NOW },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "prohibited_question",
      field: "question",
    });
    expect(await findOrderById(db, "order_test")).toMatchObject({
      status: "paid_awaiting_intake",
      fulfillmentDate: null,
    });
  });
});
