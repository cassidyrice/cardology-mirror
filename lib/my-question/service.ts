import {
  localDateIso,
  orderTotalCents,
  validatePrimaryBirthdate,
  validateQuestion,
  validateRelevantBirthdates,
} from "./core";
import {
  attachStripeSession,
  createPendingOrder,
  findOrderBySessionId,
  markOrderPaid,
  submitIntakeAndAssign,
  type D1DatabaseLike,
  type MyQuestionOrder,
} from "./orders";

export type MyQuestionCheckoutSession = {
  id: string;
  url: string | null;
  status: string | null;
  payment_status: string;
  amount_total: number | null;
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  payment_intent?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
};

export type MyQuestionStripe = {
  checkout: {
    sessions: {
      create(
        params: Record<string, unknown>,
      ): Promise<MyQuestionCheckoutSession>;
      retrieve(sessionId: string): Promise<MyQuestionCheckoutSession>;
      expire(sessionId: string): Promise<MyQuestionCheckoutSession>;
    };
  };
};

export type MyQuestionCheckoutConfig = {
  checkoutEnabled: boolean;
  proofApproved: boolean;
  basePriceId?: string;
  blueprintPriceId?: string;
  siteUrl: string;
};

type ServiceFailure = {
  ok: false;
  code: string;
  message: string;
  status: number;
  field?: string;
};

type ServiceSuccess<T> = { ok: true; value: T };
export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export async function prepareMyQuestionCheckout(
  input: {
    primaryBirthdate: string;
    includeQuestionBlueprint: boolean;
  },
  deps: {
    db: D1DatabaseLike;
    stripe: MyQuestionStripe;
    config: MyQuestionCheckoutConfig;
    now?: Date;
    idFactory?: () => string;
  },
): Promise<
  ServiceResult<{
    checkoutUrl: string;
    sessionId: string;
    order: MyQuestionOrder;
  }>
> {
  const now = deps.now ?? new Date();
  const birthdate = validatePrimaryBirthdate(
    input.primaryBirthdate,
    localDateIso(now),
  );
  if (!birthdate.ok) {
    return serviceFail(birthdate.code, birthdate.message, 400, "birthdate");
  }

  const { config } = deps;
  if (
    !config.checkoutEnabled ||
    !config.proofApproved ||
    !config.basePriceId ||
    (input.includeQuestionBlueprint && !config.blueprintPriceId)
  ) {
    return serviceFail(
      "checkout_unavailable",
      "Secure checkout is not open yet. No payment was taken.",
      503,
    );
  }

  const orderId = (deps.idFactory ?? crypto.randomUUID)();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
  let session: MyQuestionCheckoutSession | null = null;

  try {
    await createPendingOrder(deps.db, {
      id: orderId,
      primaryBirthdate: birthdate.value,
      includeQuestionBlueprint: input.includeQuestionBlueprint,
      createdAt,
      expiresAt: expiresAt.toISOString(),
    });

    const metadata = {
      offer_slug: "my-question",
      offer_name: "My Question",
      product_kind: "personal_video_reading",
      order_id: orderId,
      question_blueprint: input.includeQuestionBlueprint ? "yes" : "no",
    };
    const lineItems = [{ price: config.basePriceId, quantity: 1 }];
    if (input.includeQuestionBlueprint) {
      lineItems.push({ price: config.blueprintPriceId!, quantity: 1 });
    }

    session = await deps.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${config.siteUrl}/myquestion/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.siteUrl}/myquestion#order`,
      client_reference_id: orderId,
      metadata,
      payment_intent_data: { metadata },
      customer_creation: "always",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      expires_at: Math.floor(expiresAt.getTime() / 1_000),
      custom_text: {
        submit: {
          message:
            "Your exact delivery date is reserved after the required onboarding form is complete.",
        },
      },
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");

    const order = await attachStripeSession(
      deps.db,
      orderId,
      session.id,
      createdAt,
    );
    return {
      ok: true,
      value: {
        checkoutUrl: session.url,
        sessionId: session.id,
        order,
      },
    };
  } catch (error) {
    if (session?.id) {
      try {
        await deps.stripe.checkout.sessions.expire(session.id);
      } catch {
        // The unusable session will also expire at Stripe's configured deadline.
      }
    }
    console.error("[my-question] checkout preparation failed", error);
    return serviceFail(
      "checkout_unavailable",
      "Secure checkout could not be prepared. No usable checkout was opened.",
      503,
    );
  }
}

export async function verifyPaidMyQuestionOrder(
  sessionId: string,
  deps: {
    db: D1DatabaseLike;
    stripe: MyQuestionStripe;
    now?: Date;
  },
): Promise<ServiceResult<MyQuestionOrder>> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return serviceFail(
      "payment_not_verified",
      "This payment session could not be verified.",
      403,
    );
  }

  try {
    const session = await deps.stripe.checkout.sessions.retrieve(sessionId);
    const order = await findOrderBySessionId(deps.db, sessionId);
    const orderId = session.metadata?.order_id ?? "";
    if (
      !order ||
      order.id !== orderId ||
      session.metadata?.offer_slug !== "my-question"
    ) {
      return serviceFail(
        "payment_not_verified",
        "This payment session is not connected to a My Question order.",
        403,
      );
    }

    const paid =
      session.status === "complete" && session.payment_status === "paid";
    if (!paid) {
      return serviceFail(
        "payment_not_verified",
        "Payment has not been verified for this order.",
        402,
      );
    }

    const expectedAmount = orderTotalCents(order.includeQuestionBlueprint);
    const metadataBlueprint =
      session.metadata?.question_blueprint === "yes";
    if (
      session.amount_total !== expectedAmount ||
      metadataBlueprint !== order.includeQuestionBlueprint
    ) {
      return serviceFail(
        "payment_mismatch",
        "The paid amount does not match the stored order. Contact support before continuing.",
        409,
      );
    }

    const email = (
      session.customer_details?.email ??
      session.customer_email ??
      ""
    )
      .trim()
      .toLowerCase();
    if (!email || !email.includes("@")) {
      return serviceFail(
        "customer_email_missing",
        "The paid session did not include a usable customer email.",
        409,
      );
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    const synced = await markOrderPaid(deps.db, {
      sessionId,
      email,
      paymentIntentId,
      amountCents: expectedAmount,
      paidAt: (deps.now ?? new Date()).toISOString(),
    });
    return { ok: true, value: synced };
  } catch (error) {
    console.error("[my-question] paid-session verification failed", error);
    return serviceFail(
      "payment_not_verified",
      "This payment session could not be verified.",
      503,
    );
  }
}

export async function completePaidOnboarding(
  input: {
    sessionId: string;
    customerName: string;
    question: string;
    relevantBirthdates: string[];
  },
  deps: {
    db: D1DatabaseLike;
    stripe: MyQuestionStripe;
    now?: Date;
  },
): Promise<ServiceResult<MyQuestionOrder>> {
  const now = deps.now ?? new Date();
  const paid = await verifyPaidMyQuestionOrder(input.sessionId, {
    ...deps,
    now,
  });
  if (!paid.ok) return paid;
  if (
    paid.value.fulfillmentDate &&
    ["ready", "in_production", "delivered"].includes(paid.value.status)
  ) {
    return paid;
  }

  const customerName = input.customerName.trim().replace(/\s+/g, " ");
  if (!customerName || customerName.length > 80) {
    return serviceFail(
      "invalid_customer_name",
      "Enter the name the reading should address, using 80 characters or fewer.",
      400,
      "customerName",
    );
  }

  const question = validateQuestion(input.question);
  if (!question.ok) {
    return serviceFail(question.code, question.message, 400, "question");
  }
  const relevantBirthdates = validateRelevantBirthdates(
    input.relevantBirthdates,
    localDateIso(now),
  );
  if (!relevantBirthdates.ok) {
    return serviceFail(
      relevantBirthdates.code,
      relevantBirthdates.message,
      400,
      "relevantBirthdates",
    );
  }

  try {
    const order = await submitIntakeAndAssign(deps.db, {
      sessionId: input.sessionId,
      customerName,
      question: question.value,
      relevantBirthdates: relevantBirthdates.value,
      completedAt: now.toISOString(),
    });
    return { ok: true, value: order };
  } catch (error) {
    console.error("[my-question] onboarding assignment failed", error);
    return serviceFail(
      "onboarding_unavailable",
      "Your payment is safe, but onboarding could not be saved. Try again or contact support.",
      503,
    );
  }
}

function serviceFail(
  code: string,
  message: string,
  status: number,
  field?: string,
): ServiceFailure {
  return { ok: false, code, message, status, ...(field ? { field } : {}) };
}
