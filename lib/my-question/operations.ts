import type { MyQuestionOrderStatus } from "./orders";

export type MyQuestionOpsAction =
  | "remind_1h"
  | "remind_24h"
  | "remind_72h"
  | "flag_refund_due"
  | "refund_and_close"
  | "purge_intake";

export type MyQuestionOpsRecord = {
  id: string;
  status: MyQuestionOrderStatus;
  paidAt: string | null;
  manualExtensionUntil: string | null;
  reminder1hSentAt: string | null;
  reminder24hSentAt: string | null;
  reminder72hSentAt: string | null;
  detailsPurgeAfter: string | null;
};

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;

export function decideMyQuestionOperations(
  order: MyQuestionOpsRecord,
  now: Date,
  _autoRefundsEnabled: boolean,
): MyQuestionOpsAction[] {
  if (order.status === "delivered" && order.detailsPurgeAfter) {
    const purgeAt = Date.parse(order.detailsPurgeAfter);
    return Number.isFinite(purgeAt) && purgeAt <= now.getTime()
      ? ["purge_intake"]
      : [];
  }
  if (order.status !== "paid_awaiting_intake" || !order.paidAt) return [];
  const paidAt = Date.parse(order.paidAt);
  if (!Number.isFinite(paidAt)) return [];
  const ageMs = now.getTime() - paidAt;
  if (ageMs >= 14 * DAY_MS) {
    const extensionUntil = order.manualExtensionUntil
      ? Date.parse(order.manualExtensionUntil)
      : Number.NaN;
    const extensionActive =
      Number.isFinite(extensionUntil) && extensionUntil > now.getTime();
    if (!extensionActive) {
      return [
        _autoRefundsEnabled ? "refund_and_close" : "flag_refund_due",
      ];
    }
  }
  if (ageMs >= HOUR_MS && !order.reminder1hSentAt) return ["remind_1h"];
  if (ageMs >= DAY_MS && !order.reminder24hSentAt) return ["remind_24h"];
  if (ageMs >= 3 * DAY_MS && !order.reminder72hSentAt) return ["remind_72h"];
  return [];
}
