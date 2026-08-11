import type { MyQuestionOrder } from "./orders";

export type MyQuestionEmailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  idempotencyKey: string;
};

export function buildMyQuestionPaymentEmails(
  order: MyQuestionOrder,
  input: {
    siteUrl: string;
    creatorEmail: string;
    fulfillmentUrl: string;
  },
): MyQuestionEmailMessage[] {
  const customerEmail = requiredCustomerEmail(order);
  const sessionId = requiredValue(order.stripeSessionId, "Stripe session");
  const creatorEmail = requiredValue(input.creatorEmail, "creator email");
  const amountCents = requiredNumber(order.amountCents, "paid amount");
  const onboardingUrl = `${input.siteUrl.replace(/\/$/, "")}/myquestion/onboarding?session_id=${encodeURIComponent(sessionId)}`;

  return [
    {
      to: customerEmail,
      subject: "Your My Question payment is confirmed",
      text: [
        "Thank you. Your My Question payment is confirmed.",
        "",
        "Complete the required private onboarding form:",
        onboardingUrl,
        "",
        "No production date is reserved until onboarding is complete.",
        "After valid onboarding, the page will show your exact assigned weekday delivery date.",
        "",
        "If the link does not work, reply to this email with your Stripe receipt.",
      ].join("\n"),
      replyTo: creatorEmail,
      idempotencyKey: `my-question:${order.id}:customer-payment`,
    },
    {
      to: creatorEmail,
      subject: `My Question payment received: ${customerEmail}`,
      text: [
        "A My Question payment was received.",
        "",
        `Order: ${order.id}`,
        `Customer email: ${customerEmail}`,
        `Amount: ${formatMoney(amountCents)} USD`,
        `Question Blueprint: ${order.includeQuestionBlueprint ? "included" : "not included"}`,
        `Primary birthdate: ${order.primaryBirthdate}`,
        `Stripe session: ${sessionId}`,
        "",
        "Private order link:",
        input.fulfillmentUrl,
        "",
        "The question and production date remain pending until onboarding is complete.",
      ].join("\n"),
      replyTo: customerEmail,
      idempotencyKey: `my-question:${order.id}:creator-payment`,
    },
  ];
}

export function buildMyQuestionOnboardingEmails(
  order: MyQuestionOrder,
  input: {
    creatorEmail: string;
    fulfillmentUrl: string;
  },
): MyQuestionEmailMessage[] {
  const customerEmail = requiredCustomerEmail(order);
  const customerName = requiredValue(order.customerName, "customer name");
  const question = requiredValue(order.question, "question");
  const fulfillmentDate = requiredValue(
    order.fulfillmentDate,
    "fulfillment date",
  );
  const slotNumber = requiredNumber(order.slotNumber, "slot number");
  const creatorEmail = requiredValue(input.creatorEmail, "creator email");
  const relevantBirthdates = order.relevantBirthdates.length
    ? order.relevantBirthdates.join(", ")
    : "none";

  return [
    {
      to: customerEmail,
      subject: `Your My Question date is ${formatFulfillmentDate(fulfillmentDate)}`,
      text: [
        `Thank you, ${customerName}. Your onboarding is complete.`,
        "",
        `Assigned delivery date: ${formatFulfillmentDate(fulfillmentDate)}`,
        "",
        "Your submitted question:",
        question,
        "",
        "Your private video will connect your Birth Card, Planetary Ruling Card, combined pattern, current 52-day card, current Long Range card, and question-relevant timing to one practical takeaway.",
        ...(order.includeQuestionBlueprint
          ? [
              "",
              "Your order also includes the 4-6 page Question Blueprint.",
            ]
          : []),
        "",
        "Reply to this email if you need to correct submitted information before production begins.",
      ].join("\n"),
      replyTo: creatorEmail,
      idempotencyKey: `my-question:${order.id}:customer-onboarding`,
    },
    {
      to: creatorEmail,
      subject: `My Question ready for ${formatFulfillmentDate(fulfillmentDate)}: ${customerName}`,
      text: [
        "A paid My Question order completed onboarding.",
        "",
        `Order: ${order.id}`,
        `Customer: ${customerName}`,
        `Customer email: ${customerEmail}`,
        `Primary birthdate: ${order.primaryBirthdate}`,
        `Relevant birthdates: ${relevantBirthdates}`,
        `Question Blueprint: ${order.includeQuestionBlueprint ? "included" : "not included"}`,
        `Assigned date: ${formatFulfillmentDate(fulfillmentDate)}`,
        `Slot: ${slotNumber} of 3`,
        "",
        "Question:",
        question,
        "",
        "Private fulfillment link:",
        input.fulfillmentUrl,
      ].join("\n"),
      replyTo: customerEmail,
      idempotencyKey: `my-question:${order.id}:creator-onboarding`,
    },
  ];
}

function requiredCustomerEmail(order: MyQuestionOrder): string {
  const email = requiredValue(order.customerEmail, "customer email")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) throw new Error("My Question customer email is invalid");
  return email;
}

function requiredValue(value: string | null | undefined, label: string): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw new Error(`My Question ${label} is missing`);
  return normalized;
}

function requiredNumber(value: number | null | undefined, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`My Question ${label} is missing`);
  }
  return value;
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatFulfillmentDate(dateIso: string): string {
  const parsed = new Date(`${dateIso}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("My Question fulfillment date is invalid");
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
