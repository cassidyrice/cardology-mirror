import {
  buildMyQuestionOnboardingEmails,
  buildMyQuestionPaymentEmails,
  type MyQuestionEmailMessage,
} from "./email";
import type { MyQuestionOrder } from "./orders";
import { signOrderAccess } from "./token";

const FULFILLMENT_ACCESS_DAYS = 45;

type NotificationDeps = {
  siteUrl: string;
  creatorEmail: string;
  signingSecret: string;
  send: (message: MyQuestionEmailMessage) => Promise<void>;
  now?: Date;
};

export async function sendMyQuestionPaymentNotifications(
  order: MyQuestionOrder,
  deps: NotificationDeps,
): Promise<void> {
  const fulfillmentUrl = await buildFulfillmentUrl(order.id, deps);
  const messages = buildMyQuestionPaymentEmails(order, {
    siteUrl: deps.siteUrl,
    creatorEmail: deps.creatorEmail,
    fulfillmentUrl,
  });
  await sendEvery(messages, deps.send);
}

export async function sendMyQuestionOnboardingNotifications(
  order: MyQuestionOrder,
  deps: NotificationDeps,
): Promise<void> {
  const fulfillmentUrl = await buildFulfillmentUrl(order.id, deps);
  const messages = buildMyQuestionOnboardingEmails(order, {
    creatorEmail: deps.creatorEmail,
    fulfillmentUrl,
  });
  await sendEvery(messages, deps.send);
}

async function buildFulfillmentUrl(
  orderId: string,
  deps: NotificationDeps,
): Promise<string> {
  const now = deps.now ?? new Date();
  const expiresAt = new Date(
    now.getTime() + FULFILLMENT_ACCESS_DAYS * 24 * 60 * 60 * 1_000,
  );
  const token = await signOrderAccess(
    { orderId, scope: "fulfill", expiresAt: expiresAt.toISOString() },
    deps.signingSecret,
  );
  return `${deps.siteUrl.replace(/\/$/, "")}/myquestion/fulfill?token=${encodeURIComponent(token)}`;
}

async function sendEvery(
  messages: MyQuestionEmailMessage[],
  send: NotificationDeps["send"],
): Promise<void> {
  const results = await Promise.allSettled(messages.map((message) => send(message)));
  const rejected = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (rejected) throw rejected.reason;
}
