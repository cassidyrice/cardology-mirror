import type { MyQuestionEmailMessage } from "./email";
import {
  buildMyQuestionDeliveryEmail,
  validateMyQuestionDeliveryUrl,
} from "./fulfillment";
import {
  findOrderById,
  markOrderDelivered,
  markProductionStarted,
  type D1DatabaseLike,
  type MyQuestionOrder,
} from "./orders";
import { verifyOrderAccess } from "./token";

export type FulfillmentResult =
  | { ok: true; value: MyQuestionOrder }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
    };

type FulfillmentAccessDeps = {
  db: D1DatabaseLike;
  signingSecret: string;
  now?: Date;
};

type DeliveryDeps = FulfillmentAccessDeps & {
  creatorEmail: string;
  send: (message: MyQuestionEmailMessage) => Promise<void>;
};

export async function loadMyQuestionFulfillment(
  token: string,
  deps: FulfillmentAccessDeps,
): Promise<FulfillmentResult> {
  const access = await verifyOrderAccess(
    token,
    deps.signingSecret,
    "fulfill",
    deps.now ?? new Date(),
  );
  if (!access.ok) return invalidAccess();

  const order = await findOrderById(deps.db, access.payload.orderId);
  if (!order) return invalidAccess();
  return { ok: true, value: order };
}

export async function startMyQuestionProduction(
  token: string,
  deps: FulfillmentAccessDeps,
): Promise<FulfillmentResult> {
  const loaded = await loadMyQuestionFulfillment(token, deps);
  if (!loaded.ok) return loaded;

  try {
    const startedAt = (deps.now ?? new Date()).toISOString();
    const order = await markProductionStarted(
      deps.db,
      loaded.value.id,
      startedAt,
    );
    return { ok: true, value: order };
  } catch {
    return {
      ok: false,
      status: 409,
      code: "invalid_order_state",
      message: "This order cannot enter production from its current state.",
    };
  }
}

export async function deliverMyQuestionOrder(
  input: { token: string; deliveryUrl: unknown },
  deps: DeliveryDeps,
): Promise<FulfillmentResult> {
  const loaded = await loadMyQuestionFulfillment(input.token, deps);
  if (!loaded.ok) return loaded;
  if (loaded.value.status === "delivered") {
    return { ok: true, value: loaded.value };
  }

  const deliveryUrl = validateMyQuestionDeliveryUrl(input.deliveryUrl);
  if (!deliveryUrl.ok) {
    return {
      ok: false,
      status: 400,
      code: deliveryUrl.code,
      message: deliveryUrl.message,
    };
  }
  if (
    loaded.value.status !== "ready" &&
    loaded.value.status !== "in_production"
  ) {
    return {
      ok: false,
      status: 409,
      code: "invalid_order_state",
      message: "This order cannot be delivered from its current state.",
    };
  }

  try {
    await deps.send(
      buildMyQuestionDeliveryEmail(
        loaded.value,
        deliveryUrl.value,
        deps.creatorEmail,
      ),
    );
  } catch {
    return {
      ok: false,
      status: 502,
      code: "delivery_notification_failed",
      message: "Delivery email failed. The order was not marked delivered.",
    };
  }

  const deliveredAt = deps.now ?? new Date();
  const purgeAfter = new Date(
    deliveredAt.getTime() + 90 * 24 * 60 * 60 * 1_000,
  );
  try {
    const order = await markOrderDelivered(deps.db, {
      orderId: loaded.value.id,
      deliveryUrl: deliveryUrl.value,
      deliveredAt: deliveredAt.toISOString(),
      purgeAfter: purgeAfter.toISOString(),
    });
    return { ok: true, value: order };
  } catch {
    return {
      ok: false,
      status: 500,
      code: "delivery_state_failed",
      message:
        "Delivery email was sent, but the order record needs manual review.",
    };
  }
}

function invalidAccess(): FulfillmentResult {
  return {
    ok: false,
    status: 403,
    code: "invalid_access",
    message: "This private fulfillment link is invalid or expired.",
  };
}
