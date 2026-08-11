import type { MyQuestionEmailMessage } from "./email";
import type { MyQuestionOrder } from "./orders";

type DeliveryUrlResult =
  | { ok: true; value: string }
  | { ok: false; code: "invalid_delivery_url"; message: string };

export function validateMyQuestionDeliveryUrl(
  rawValue: unknown,
): DeliveryUrlResult {
  if (typeof rawValue !== "string") return invalidDeliveryUrl();
  const value = rawValue.trim();
  if (!value || value.length > 2_048) return invalidDeliveryUrl();

  try {
    const url = new URL(value);
    const isDriveFile = /^\/file\/d\/[^/]+(?:\/|$)/.test(url.pathname);
    const isDriveOpenLink =
      url.pathname === "/open" && Boolean(url.searchParams.get("id"));
    if (
      url.protocol !== "https:" ||
      url.hostname !== "drive.google.com" ||
      url.username ||
      url.password ||
      (!isDriveFile && !isDriveOpenLink)
    ) {
      return invalidDeliveryUrl();
    }
    return { ok: true, value: url.toString() };
  } catch {
    return invalidDeliveryUrl();
  }
}

export function buildMyQuestionDeliveryEmail(
  order: MyQuestionOrder,
  deliveryUrl: string,
  creatorEmail: string,
): MyQuestionEmailMessage {
  const validatedUrl = validateMyQuestionDeliveryUrl(deliveryUrl);
  if (!validatedUrl.ok) throw new Error(validatedUrl.message);
  const customerEmail = requiredValue(order.customerEmail, "customer email");
  const customerName = requiredValue(order.customerName, "customer name");
  const question = requiredValue(order.question, "question");
  const replyTo = requiredValue(creatorEmail, "creator email");

  return {
    to: customerEmail,
    replyTo,
    subject: "Your private My Question reading is ready",
    idempotencyKey: `my-question:${order.id}:delivery`,
    text: [
      `Hi ${customerName},`,
      "",
      "Your private My Question reading is ready:",
      validatedUrl.value,
      "",
      "Your submitted question:",
      question,
      "",
      "The reading covers your Birth Card, Planetary Ruling Card, combined pattern, current 52-day card, current Long Range card, and question-relevant timing, followed by one practical takeaway.",
      ...(order.includeQuestionBlueprint
        ? [
            "",
            "Your Question Blueprint is included in the private delivery folder.",
          ]
        : []),
      "",
      "This private link is intended to remain available for at least 12 months. Download your files for safekeeping.",
      "",
      "If the link is inaccessible or a file is incorrect, reply to this email so it can be corrected.",
    ].join("\n"),
  };
}

function invalidDeliveryUrl(): DeliveryUrlResult {
  return {
    ok: false,
    code: "invalid_delivery_url",
    message: "Enter a secure Google Drive file link.",
  };
}

function requiredValue(value: string | null | undefined, label: string): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw new Error(`My Question ${label} is missing`);
  return normalized;
}
