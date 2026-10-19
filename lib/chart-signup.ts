/**
 * Server-only: save a birthdate-chart lead to Buttondown (list "cardblueprint")
 * with the API key in BUTTONDOWN_API_KEY. Tags carry the card, never the birthday.
 */
import { BIRTHDATE_CHART_TAG } from "@/lib/birthdate-chart";

export const BUTTONDOWN_SUBSCRIBERS_API = "https://api.buttondown.com/v1/subscribers";
export const CHART_SIGNUP_SOURCES = ["calculator-result", "home-reveal"] as const;
export type ChartSignupSource = (typeof CHART_SIGNUP_SOURCES)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARD_SLUG = /^(?:(?:ace|[2-9]|10|jack|queen|king)-of-(?:hearts|clubs|diamonds|spades)|joker)$/;

export type ChartSignup = { email: string; source: ChartSignupSource; slug: string };

export function normalizeChartSignup(raw: Record<string, unknown>): ChartSignup {
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) throw new Error("Enter a valid email address");
  const source = typeof raw.source === "string" ? raw.source : "";
  if (!(CHART_SIGNUP_SOURCES as readonly string[]).includes(source)) throw new Error("Invalid request");
  const slug = typeof raw.slug === "string" ? raw.slug : "";
  if (!CARD_SLUG.test(slug)) throw new Error("Invalid request");
  return { email, source: source as ChartSignupSource, slug };
}

export function chartSignupTags(signup: ChartSignup): string[] {
  return [BIRTHDATE_CHART_TAG, signup.source, `card-${signup.slug}`];
}

/** Creates the subscriber, or adds the tags if they already exist. */
export async function subscribeChartLead(
  signup: ChartSignup,
  apiKey: string,
  referrerUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (!apiKey) throw new Error("BUTTONDOWN_API_KEY is not set");
  const res = await fetcher(BUTTONDOWN_SUBSCRIBERS_API, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
      "X-Buttondown-Collision-Behavior": "add",
    },
    body: JSON.stringify({
      email_address: signup.email,
      tags: chartSignupTags(signup),
      referrer_url: referrerUrl.slice(0, 500),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Buttondown ${res.status}: ${detail.slice(0, 200)}`);
  }
}
