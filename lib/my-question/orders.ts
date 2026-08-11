import { candidateFulfillmentDates, MY_QUESTION_DAILY_CAPACITY } from "./core";

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ success: boolean; results: T[] }>;
  run(): Promise<{ success: boolean; meta: { changes?: number } }>;
}

export interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatementLike;
}

export type MyQuestionOrderStatus =
  | "checkout_pending"
  | "paid_awaiting_intake"
  | "ready"
  | "in_production"
  | "delivered"
  | "refunded"
  | "closed";

export type MyQuestionOrder = {
  id: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  status: MyQuestionOrderStatus;
  primaryBirthdate: string;
  includeQuestionBlueprint: boolean;
  customerEmail: string | null;
  customerName: string | null;
  question: string | null;
  relevantBirthdates: string[];
  amountCents: number | null;
  fulfillmentDate: string | null;
  slotNumber: number | null;
  deliveryUrl: string | null;
  createdAt: string;
  checkoutExpiresAt: string;
  paidAt: string | null;
  onboardingCompletedAt: string | null;
  productionStartedAt: string | null;
  deliveredAt: string | null;
  detailsPurgeAfter: string | null;
};

type OrderRow = {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: MyQuestionOrderStatus;
  primary_birthdate: string;
  include_question_blueprint: number;
  customer_email: string | null;
  customer_name: string | null;
  question: string | null;
  relevant_birthdates_json: string;
  amount_cents: number | null;
  fulfillment_date: string | null;
  slot_number: number | null;
  delivery_url: string | null;
  created_at: string;
  checkout_expires_at: string;
  paid_at: string | null;
  onboarding_completed_at: string | null;
  production_started_at: string | null;
  delivered_at: string | null;
  details_purge_after: string | null;
};

export async function createPendingOrder(
  db: D1DatabaseLike,
  input: {
    id: string;
    primaryBirthdate: string;
    includeQuestionBlueprint: boolean;
    createdAt: string;
    expiresAt: string;
  },
): Promise<MyQuestionOrder> {
  await db
    .prepare(
      `INSERT INTO my_question_orders (
        id,
        status,
        primary_birthdate,
        include_question_blueprint,
        created_at,
        checkout_expires_at,
        updated_at
      ) VALUES (?, 'checkout_pending', ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.primaryBirthdate,
      input.includeQuestionBlueprint ? 1 : 0,
      input.createdAt,
      input.expiresAt,
      input.createdAt,
    )
    .run();

  return requiredOrder(await findOrderById(db, input.id));
}

export async function attachStripeSession(
  db: D1DatabaseLike,
  orderId: string,
  sessionId: string,
  attachedAt: string,
): Promise<MyQuestionOrder> {
  const current = requiredOrder(await findOrderById(db, orderId));
  if (current.stripeSessionId === sessionId) return current;
  if (current.stripeSessionId) {
    throw new Error("Order is already attached to another Stripe session");
  }
  if (current.status !== "checkout_pending") {
    throw new Error("Only pending orders can attach a Stripe session");
  }

  await db
    .prepare(
      `UPDATE my_question_orders
       SET stripe_session_id = ?, stripe_session_attached_at = ?, updated_at = ?
       WHERE id = ? AND stripe_session_id IS NULL AND status = 'checkout_pending'`,
    )
    .bind(sessionId, attachedAt, attachedAt, orderId)
    .run();

  const updated = requiredOrder(await findOrderById(db, orderId));
  if (updated.stripeSessionId !== sessionId) {
    throw new Error("Stripe session could not be attached");
  }
  return updated;
}

export async function markOrderPaid(
  db: D1DatabaseLike,
  input: {
    sessionId: string;
    email: string;
    paymentIntentId: string | null;
    amountCents: number;
    paidAt: string;
  },
): Promise<MyQuestionOrder> {
  const current = requiredOrder(await findOrderBySessionId(db, input.sessionId));
  if (current.status === "refunded" || current.status === "closed") {
    throw new Error("Closed orders cannot be marked paid");
  }

  const nextStatus =
    current.status === "checkout_pending"
      ? "paid_awaiting_intake"
      : current.status;
  await db
    .prepare(
      `UPDATE my_question_orders
       SET status = ?,
           customer_email = ?,
           stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, ?),
           amount_cents = ?,
           paid_at = COALESCE(paid_at, ?),
           updated_at = ?
       WHERE stripe_session_id = ?`,
    )
    .bind(
      nextStatus,
      input.email.trim().toLowerCase(),
      input.paymentIntentId,
      input.amountCents,
      input.paidAt,
      input.paidAt,
      input.sessionId,
    )
    .run();

  return requiredOrder(await findOrderBySessionId(db, input.sessionId));
}

export async function submitIntakeAndAssign(
  db: D1DatabaseLike,
  input: {
    sessionId: string;
    customerName: string;
    question: string;
    relevantBirthdates: string[];
    completedAt: string;
  },
): Promise<MyQuestionOrder> {
  const current = requiredOrder(await findOrderBySessionId(db, input.sessionId));
  if (
    current.fulfillmentDate &&
    current.slotNumber &&
    ["ready", "in_production", "delivered"].includes(current.status)
  ) {
    return current;
  }
  if (current.status !== "paid_awaiting_intake") {
    throw new Error("Paid onboarding is not available for this order");
  }

  const candidates = candidateFulfillmentDates(
    new Date(input.completedAt),
    65,
  );
  for (const fulfillmentDate of candidates) {
    for (let slotNumber = 1; slotNumber <= MY_QUESTION_DAILY_CAPACITY; slotNumber += 1) {
      try {
        const row = await db
          .prepare(
            `UPDATE my_question_orders
             SET status = 'ready',
                 customer_name = ?,
                 question = ?,
                 relevant_birthdates_json = ?,
                 fulfillment_date = ?,
                 slot_number = ?,
                 onboarding_completed_at = ?,
                 updated_at = ?
             WHERE id = ?
               AND status = 'paid_awaiting_intake'
               AND fulfillment_date IS NULL
             RETURNING *`,
          )
          .bind(
            input.customerName.trim(),
            input.question,
            JSON.stringify(input.relevantBirthdates),
            fulfillmentDate,
            slotNumber,
            input.completedAt,
            input.completedAt,
            current.id,
          )
          .first<OrderRow>();
        if (row) return mapOrder(row);

        const existing = requiredOrder(await findOrderById(db, current.id));
        if (existing.fulfillmentDate && existing.slotNumber) return existing;
      } catch (error) {
        if (!isUniqueConstraint(error)) throw error;
      }
    }
  }

  throw new Error("No fulfillment slot is available in the scheduling window");
}

export async function markProductionStarted(
  db: D1DatabaseLike,
  orderId: string,
  startedAt: string,
): Promise<MyQuestionOrder> {
  const current = requiredOrder(await findOrderById(db, orderId));
  if (current.status === "in_production" || current.status === "delivered") {
    return current;
  }
  if (current.status !== "ready") {
    throw new Error("Only ready orders can enter production");
  }

  await db
    .prepare(
      `UPDATE my_question_orders
       SET status = 'in_production', production_started_at = ?, updated_at = ?
       WHERE id = ? AND status = 'ready'`,
    )
    .bind(startedAt, startedAt, orderId)
    .run();
  return requiredOrder(await findOrderById(db, orderId));
}

export async function markOrderDelivered(
  db: D1DatabaseLike,
  input: {
    orderId: string;
    deliveryUrl: string;
    deliveredAt: string;
    purgeAfter: string;
  },
): Promise<MyQuestionOrder> {
  const current = requiredOrder(await findOrderById(db, input.orderId));
  if (current.status === "delivered") return current;
  if (current.status !== "ready" && current.status !== "in_production") {
    throw new Error("Only ready or in-production orders can be delivered");
  }

  await db
    .prepare(
      `UPDATE my_question_orders
       SET status = 'delivered',
           delivery_url = ?,
           delivered_at = ?,
           details_purge_after = ?,
           updated_at = ?
       WHERE id = ? AND status IN ('ready', 'in_production')`,
    )
    .bind(
      input.deliveryUrl,
      input.deliveredAt,
      input.purgeAfter,
      input.deliveredAt,
      input.orderId,
    )
    .run();
  return requiredOrder(await findOrderById(db, input.orderId));
}

export async function findOrderById(
  db: D1DatabaseLike,
  id: string,
): Promise<MyQuestionOrder | null> {
  const row = await db
    .prepare("SELECT * FROM my_question_orders WHERE id = ? LIMIT 1")
    .bind(id)
    .first<OrderRow>();
  return row ? mapOrder(row) : null;
}

export async function findOrderBySessionId(
  db: D1DatabaseLike,
  sessionId: string,
): Promise<MyQuestionOrder | null> {
  const row = await db
    .prepare(
      "SELECT * FROM my_question_orders WHERE stripe_session_id = ? LIMIT 1",
    )
    .bind(sessionId)
    .first<OrderRow>();
  return row ? mapOrder(row) : null;
}

function mapOrder(row: OrderRow): MyQuestionOrder {
  return {
    id: row.id,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    status: row.status,
    primaryBirthdate: row.primary_birthdate,
    includeQuestionBlueprint: row.include_question_blueprint === 1,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    question: row.question,
    relevantBirthdates: safeBirthdateJson(row.relevant_birthdates_json),
    amountCents: row.amount_cents,
    fulfillmentDate: row.fulfillment_date,
    slotNumber: row.slot_number,
    deliveryUrl: row.delivery_url,
    createdAt: row.created_at,
    checkoutExpiresAt: row.checkout_expires_at,
    paidAt: row.paid_at,
    onboardingCompletedAt: row.onboarding_completed_at,
    productionStartedAt: row.production_started_at,
    deliveredAt: row.delivered_at,
    detailsPurgeAfter: row.details_purge_after,
  };
}

function safeBirthdateJson(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function requiredOrder(order: MyQuestionOrder | null): MyQuestionOrder {
  if (!order) throw new Error("My Question order was not found");
  return order;
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    error instanceof Error &&
    /unique constraint|constraint failed|d1_error.*unique/i.test(error.message)
  );
}
