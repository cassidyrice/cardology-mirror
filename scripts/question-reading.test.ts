import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";
import type Stripe from "stripe";

mock.module("@cloudflare/next-on-pages", () => ({
  getOptionalRequestContext: () => undefined,
}));

const { POST: checkoutPost } = await import("../app/api/checkout/question-reading/route");
const { POST: confirmPost } = await import("../app/api/checkout/question-reading/confirm/route");
const { GET: passGet, POST: passPost } = await import("../app/api/reading-pass/route");
const { setQuestionTestStripe } = await import("../lib/stripe");
const {
  GET: inboxGet,
  POST: inboxPost,
} = await import("../app/api/ops/inbox/route");
const { buildQuestionReadingFacts } = await import("../lib/question-reading-facts");
const {
  CARD_BLUEPRINTS_STRIPE_ACCOUNT,
  ReadingPassError,
  setQuestionOrderTestDb,
  signOpsOrderToken,
  submitReadingPassQuestion,
} = await import("../lib/question-reading-service");
const {
  generateThreeReadingAngles,
  lintReadingDraft,
} = await import("../lib/question-reading-writer");
const { JokerNotSupportedError } = await import("../lib/reading");
const { normalizePhoneE164 } = await import("../lib/sms");

function createRealSqliteQuestionDb() {
  const sql = new Database(":memory:");
  sql.exec(readFileSync("migrations/0004_question_reading_orders.sql", "utf8"));
  return {
    prepare(query: string) {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bind(...values: any[]) {
          return {
            first: async <T>() => (sql.query(query).get(...values) as T | null) ?? null,
            all: async <T>() => ({ results: sql.query(query).all(...values) as T[] }),
            run: async () => sql.query(query).run(...values),
          };
        },
      };
    },
  };
}

describe("QuestionReadingFacts deterministic Cardology spread engine", () => {
  test("reproduces Candice (1981-03-19) + Alejandro (1971-09-11) on 2026-11-08 exactly", async () => {
    const facts = await buildQuestionReadingFacts({
      track: "chemistry-check",
      birth1: "1981-03-19",
      name1: "Candice",
      birth2: "1971-09-11",
      name2: "Alejandro",
      rel2: "ex / unfinished story",
      question: "Are we actually going to reconnect or is he just orbiting?",
      targetDate: "2026-11-08",
    });

    expect(facts.person1.birthCard).toBe("4♦");
    expect(facts.person1.rulingCard).toBe("8♦");
    expect(facts.person1.currentYear.age).toBe(45);
    expect(facts.person1.currentYear.activePeriod.planet).toBe("Saturn");
    expect(facts.person1.currentYear.activePeriod.bcCard).toBe("Q♥");
    expect(facts.person1.currentYear.activePeriod.startIso).toBe("2026-10-13");
    expect(facts.person1.currentYear.activePeriod.endIso).toBe("2026-12-03");
    expect(facts.person1.currentYear.selfEnvironmentAndDisplacement).toBe(true);
    expect(facts.person1.currentYear.environmentCard).toBe("4♦");
    expect(facts.person1.currentYear.displacementCard).toBe("4♦");

    expect(facts.person2?.birthCard).toBe("K♣");
    expect(facts.person2?.rulingCard).toBe("J♦");

    const compat = facts.compatibility!;
    expect(compat.hasMoonConnection).toBe(false);
    expect(compat.directionality).toBe("one-way-2-to-1");
    expect(compat.person2InPerson1).toHaveLength(0);
    expect(
      compat.person1InPerson2.some(
        (h) => h.subjectCard === "4♦" && h.ownerSpreadCard === "K♣" && h.seatKey === "mars",
      ),
    ).toBe(true);
    expect(
      compat.person1InPerson2.some(
        (h) => h.subjectCard === "4♦" && h.ownerSpreadCard === "J♦" && h.seatKey === "venus",
      ),
    ).toBe(true);

    const tenClubs = compat.overlappingWindows.find((w) => w.card === "10♣");
    expect(tenClubs).toBeDefined();
    expect(tenClubs?.startIso).toBe("2026-12-24");
    expect(tenClubs?.endIso).toBe("2027-01-24");
    expect(tenClubs?.days).toBe(32);
  });

  test("builds solo timing-map spread with all 7 planetary windows and refuses Dec 31 Joker", async () => {
    const solo = await buildQuestionReadingFacts({
      track: "timing-map",
      birth1: "1991-02-17",
      name1: "Maya",
      question: "When is the cleanest window to launch my studio this year?",
      targetDate: "2026-08-30",
    });

    expect(solo.person1.birthCard).toBe("8♦");
    expect(solo.person1.currentYear.periods).toHaveLength(7);
    expect(solo.person1.currentYear.activePeriod.planet).toBe("Jupiter");
    expect(solo.person1.currentYear.activePeriod.bcCard).toBe("2♠");
    expect(solo.person2).toBeNull();
    expect(solo.compatibility).toBeNull();

    await expect(
      buildQuestionReadingFacts({
        track: "timing-map",
        birth1: "1990-12-31",
        question: "What does my year look like?",
        targetDate: "2026-11-08",
      }),
    ).rejects.toThrow(JokerNotSupportedError);
  });
});

describe("3-angle AI reading writer & deterministic fallback", () => {
  const originalFetch = globalThis.fetch;
  const savedMirrorKey = process.env.MIRROR_LLM_KEY;
  const savedOpenAiKey = process.env.OPENAI_API_KEY;
  const savedAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const savedXaiKey = process.env.XAI_API_KEY;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (savedMirrorKey === undefined) delete process.env.MIRROR_LLM_KEY;
    else process.env.MIRROR_LLM_KEY = savedMirrorKey;
    if (savedOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = savedOpenAiKey;
    if (savedAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = savedAnthropicKey;
    if (savedXaiKey === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = savedXaiKey;
  });

  test("deterministic fallback returns 3 distinct clean angles with email + SMS bodies", async () => {
    delete process.env.MIRROR_LLM_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.XAI_API_KEY;

    const facts = await buildQuestionReadingFacts({
      track: "chemistry-check",
      birth1: "1981-03-19",
      name1: "Candice",
      birth2: "1971-09-11",
      name2: "Alejandro",
      question: "Should I reach out before December or wait?",
      targetDate: "2026-11-08",
    });

    const res = await generateThreeReadingAngles(facts);
    expect(res.source).toBe("deterministic-fallback");
    expect(res.angles).toHaveLength(3);
    expect(res.angles.map((a) => a.key)).toEqual(["verdict", "mirror", "timeline"]);

    for (const draft of res.angles) {
      expect(draft.subject.length).toBeGreaterThan(10);
      expect(draft.emailBody).toContain("4♦");
      expect(draft.emailBody).toContain("K♣");
      expect(draft.smsBody).toContain("4♦");
      expect(draft.smsBody).toContain("— Cass");
      expect(draft.lintWarnings).toEqual([]);
    }
  });

  test("LLM path parses JSON, enforces 3 distinct angles, and scrubs banned woo phrases", async () => {
    delete process.env.MIRROR_LLM_KEY;
    process.env.OPENAI_API_KEY = "sk-test-dummy";
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  angles: [
                    {
                      angle: 1,
                      key: "verdict",
                      label: "Direct Verdict & Date Window",
                      thesis: "4♦ lands in his Mars and Venus while Dec 24 – Jan 24 opens 10♣.",
                      subject: "Your 4♦ + 8♦ Card Blueprint Reading",
                      emailBody:
                        "Hi Candice,\n\nThe universe says wait until Dec 24 – Jan 24 when you both sit in 10♣ while your 4♦ holds Mars and Venus in his spread. Make one clean ask inside that window and watch what he actually does.\n\nCass",
                      smsBody:
                        "Candice — your 4♦ sits in Alejandro's Mars and Venus seats, and Dec 24 – Jan 24 puts both of you in 10♣ at once. Ask cleanly in that window instead of guessing. — Cass",
                    },
                    {
                      angle: 2,
                      key: "mirror",
                      label: "Behavioral Mirror & Blind Spot",
                      thesis: "Age 45 puts 4♦ in its own Environment and Displacement.",
                      subject: "The 4♦ loop underneath your question",
                      emailBody:
                        "Hi Candice,\n\nAt 45 your 4♦ sits in its own Environment and Displacement while Saturn runs Q♥ through Dec 3. Stop auditing his silence for proof of safety before you name what you want.\n\nCass",
                      smsBody:
                        "Candice — at 45 your 4♦ is in its own Environment & Displacement while Saturn runs Q♥ through Dec 3. Don't confuse waiting for control. — Cass",
                    },
                    {
                      angle: 3,
                      key: "timeline",
                      label: "Season-by-Season Timing Map",
                      thesis: "Saturn Q♥ through Dec 3, Uranus next, 10♣ overlap Dec 24 – Jan 24.",
                      subject: "Your dated 4♦ + 8♦ calendar windows",
                      emailBody:
                        "Hi Candice,\n\nRight now Saturn runs Q♥ through Dec 3, then Dec 24 – Jan 24 puts both of you in 10♣ simultaneously for 32 days. Hold your boundary now and let late December carry the conversation.\n\nCass",
                      smsBody:
                        "Candice — Saturn Q♥ runs through Dec 3, then Dec 24 – Jan 24 puts you and Alejandro in 10♣ together for 32 days. Use that window. — Cass",
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as unknown as typeof fetch;

    const facts = await buildQuestionReadingFacts({
      track: "chemistry-check",
      birth1: "1981-03-19",
      name1: "Candice",
      birth2: "1971-09-11",
      name2: "Alejandro",
      question: "Should I reach out before December or wait?",
      targetDate: "2026-11-08",
    });

    const res = await generateThreeReadingAngles(facts, { steeringNote: "Keep it extra crisp." });
    expect(res.source).toBe("llm");
    expect(res.angles[0].emailBody).not.toMatch(/\bthe universe\b/i);
    expect(res.angles[0].emailBody).toContain("the deck");
    expect(lintReadingDraft("Trust the process and manifest vibrations")).toHaveLength(3);
  });
});

describe("Zero-leave embedded checkout, confirmation, and /ops/inbox approval + SMS/Email delivery", () => {
  const originalFetch = globalThis.fetch;
  const sentEmails: Array<{ to: string; subject: string; text: string }> = [];
  const sentTwilioSms: Array<{ to: string; body: string }> = [];
  const createdSessions = new Map<string, Record<string, unknown>>();

  beforeEach(() => {
    sentEmails.length = 0;
    sentTwilioSms.length = 0;
    createdSessions.clear();

    process.env.OPS_INBOX_SECRET = "test-ops-signing-secret-32-bytes-long";
    process.env.OPS_INBOX_TOKEN = "test-master-ops-token";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.INTAKE_FROM_EMAIL = "Cass <readings@cardblueprints.com>";
    process.env.EMAIL_FROM = "Cass <readings@cardblueprints.com>";
    process.env.INTAKE_EMAIL = "cass@cardblueprints.com";
    process.env.TWILIO_ACCOUNT_SID = "AC00000000000000000000000000000000";
    process.env.TWILIO_AUTH_TOKEN = "twilio_test_token";
    process.env.TWILIO_FROM_NUMBER = "+14065550100";
    delete process.env.MIRROR_LLM_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.XAI_API_KEY;

    setQuestionOrderTestDb(createRealSqliteQuestionDb());

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("api.resend.com/emails")) {
        const payload = JSON.parse(String(init?.body ?? "{}")) as {
          to: string | string[];
          subject: string;
          text: string;
        };
        sentEmails.push({
          to: Array.isArray(payload.to) ? payload.to[0] : payload.to,
          subject: payload.subject,
          text: payload.text,
        });
        return new Response(JSON.stringify({ id: `email_${sentEmails.length}` }), { status: 200 });
      }
      if (url.includes("api.twilio.com/2010-04-01/Accounts/")) {
        const params = new URLSearchParams(String(init?.body ?? ""));
        sentTwilioSms.push({
          to: params.get("To") ?? "",
          body: params.get("Body") ?? "",
        });
        return new Response(JSON.stringify({ sid: `SM_${sentTwilioSms.length}` }), { status: 201 });
      }
      throw new Error(`Unexpected external fetch in test: ${url}`);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setQuestionOrderTestDb(null);
    setQuestionTestStripe(null);
  });

  function buildMockStripe(accountId = CARD_BLUEPRINTS_STRIPE_ACCOUNT): Stripe {
    let seq = 0;
    return {
      accounts: {
        retrieve: async () => ({ id: accountId }),
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            seq += 1;
            const id = `cs_test_embedded_${seq}`;
            const lineItems = params.line_items as Array<{
              price_data?: { unit_amount?: number };
            }>;
            const amountTotal = lineItems?.[0]?.price_data?.unit_amount ?? 9900;
            const session = {
              id,
              client_secret: `${id}_secret_xyz`,
              ui_mode: params.ui_mode,
              redirect_on_completion: params.redirect_on_completion,
              allow_promotion_codes: params.allow_promotion_codes,
              payment_status: "paid",
              amount_total: amountTotal,
              currency: "usd",
              customer_email: params.customer_email ?? null,
              customer_details: {
                email: (params.customer_email as string | undefined) || "buyer@example.com",
              },
              metadata: params.metadata ?? {},
            };
            createdSessions.set(id, session);
            return session;
          },
          retrieve: async (id: string) => {
            const found = createdSessions.get(id);
            if (!found) throw new Error("not found");
            return found;
          },
        },
      },
    } as unknown as Stripe;
  }

  test("normalizes US and international E.164 phone numbers cleanly", () => {
    expect(normalizePhoneE164("(406) 555-0199")).toBe("+14065550199");
    expect(normalizePhoneE164("1-406-555-0199")).toBe("+14065550199");
    expect(normalizePhoneE164("+44 7911 123456")).toBe("+447911123456");
    expect(normalizePhoneE164("12345")).toBeNull();
  });

  test("refuses wrong Stripe merchant account, rejects Dec 31 Joker, and enforces SMS consent", async () => {
    setQuestionTestStripe(buildMockStripe("acct_WRONG_MERCHANT"));
    const wrongMerchantRes = await checkoutPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          track: "timing-map",
          birth1: "1991-02-17",
          question: "When should I make my career move this year?",
          deliveryChannel: "email",
          buyerEmail: "maya@example.com",
        }),
      }),
    );
    expect(wrongMerchantRes.status).toBe(503);

    setQuestionTestStripe(buildMockStripe(CARD_BLUEPRINTS_STRIPE_ACCOUNT));

    const jokerRes = await checkoutPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          track: "timing-map",
          birth1: "1990-12-31",
          question: "What is my timing window?",
          deliveryChannel: "email",
          buyerEmail: "joker@example.com",
        }),
      }),
    );
    expect(jokerRes.status).toBe(422);
    const jokerBody = (await jokerRes.json()) as { code?: string };
    expect(jokerBody.code).toBe("JOKER_UNSUPPORTED");

    const missingConsentRes = await checkoutPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          track: "timing-map",
          birth1: "1991-02-17",
          question: "When should I move?",
          deliveryChannel: "sms",
          buyerPhone: "(406) 555-0199",
          smsConsent: false,
        }),
      }),
    );
    expect(missingConsentRes.status).toBe(400);
  });

  test("full lifecycle: $99 embedded checkout with Question 1 -> confirm -> 3 angles -> /ops/inbox approve -> SMS + Email sent", async () => {
    const stripe = buildMockStripe(CARD_BLUEPRINTS_STRIPE_ACCOUNT);
    setQuestionTestStripe(stripe);

    // 1. $99 Solo Question #1 at checkout (email)
    const soloRes = await checkoutPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          track: "card-blueprint-reading",
          birth1: "1991-02-17",
          name1: "Maya",
          question: "When is the cleanest window to launch my studio this year?",
          deliveryChannel: "email",
          buyerEmail: "maya@example.com",
        }),
      }),
    );
    expect(soloRes.status).toBe(200);
    const soloJson = (await soloRes.json()) as {
      clientSecret: string;
      sessionId: string;
      orderId: string;
      amountCents: number;
    };
    expect(soloJson.amountCents).toBe(9900);
    expect(soloJson.clientSecret).toContain("_secret_");
    const soloSession = createdSessions.get(soloJson.sessionId)!;
    expect(soloSession.ui_mode).toBe("embedded_page");
    expect(soloSession.redirect_on_completion).toBe("never");
    expect(soloSession.allow_promotion_codes).toBe(true);

    // 2. $99 Card Blueprint Reading with 2nd person birthday included (SMS + backup email)
    const compatRes = await checkoutPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          track: "card-blueprint-reading",
          birth1: "1981-03-19",
          name1: "Candice",
          birth2: "1971-09-11",
          name2: "Alejandro",
          rel2: "ex",
          question: "Are we going to reconnect this winter or should I close the door?",
          deliveryChannel: "sms",
          buyerPhone: "(406) 555-0199",
          buyerEmail: "candice@example.com",
          smsConsent: true,
          placement: "home-stage",
        }),
      }),
    );
    expect(compatRes.status).toBe(200);
    const compatJson = (await compatRes.json()) as {
      sessionId: string;
      orderId: string;
      amountCents: number;
    };
    expect(compatJson.amountCents).toBe(9900);

    // 3. Confirm inline checkout completion (and verify idempotency on duplicate call)
    const confirm1 = await confirmPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: compatJson.sessionId }),
      }),
    );
    expect(confirm1.status).toBe(200);
    const confirmBody = (await confirm1.json()) as {
      status: string;
      orderId: string;
      track: string;
      deliveryChannel: string;
      turnaround: string;
      passToken: string;
      passUrl: string;
      suggestedQuestionsUrl: string;
      questionsUsed: number;
      questionsRemaining: number;
      maxQuestions: number;
    };
    expect(confirmBody.orderId).toBe(compatJson.orderId);
    expect(confirmBody.status).toBe("awaiting_approval");
    expect(confirmBody.deliveryChannel).toBe("sms");
    expect(confirmBody.turnaround).toContain("48 hours");
    expect(confirmBody.turnaround).toContain("24 hours");
    expect(confirmBody.passToken).toBeTruthy();
    expect(confirmBody.passUrl).toContain("/reading-pass?token=");
    expect(confirmBody.suggestedQuestionsUrl).toBe(
      "/downloads/card-blueprint-suggested-questions.pdf",
    );
    expect(confirmBody.questionsUsed).toBe(1);
    expect(confirmBody.questionsRemaining).toBe(2);
    expect(confirmBody.maxQuestions).toBe(3);

    // Buyer receipt + operator alert email with signed /ops/inbox magic link
    expect(sentEmails).toHaveLength(2);
    expect(sentEmails[0].to).toBe("candice@example.com");
    expect(sentEmails[0].text).toContain("/downloads/card-blueprint-suggested-questions.pdf");
    expect(sentEmails[0].text).toContain("/reading-pass?token=");
    expect(sentEmails[1].to).toBe("cass@cardblueprints.com");
    expect(sentEmails[1].text).toContain("/ops/inbox?order=");

    // Second confirm call is idempotent and does NOT spam duplicate emails
    const confirm2 = await confirmPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: compatJson.sessionId }),
      }),
    );
    expect(confirm2.status).toBe(200);
    expect(sentEmails).toHaveLength(2);

    // 4. Unauthenticated /api/ops/inbox is 401; signed magic link loads the order & 3 angles
    const unauthRes = await inboxGet(new NextRequest("https://cardblueprints.com/api/ops/inbox"));
    expect(unauthRes.status).toBe(401);

    const sig = await signOpsOrderToken(compatJson.orderId);
    const magicGetRes = await inboxGet(
      new NextRequest(
        `https://cardblueprints.com/api/ops/inbox?order=${encodeURIComponent(compatJson.orderId)}&sig=${encodeURIComponent(sig)}`,
      ),
    );
    expect(magicGetRes.status).toBe(200);
    const inboxData = (await magicGetRes.json()) as {
      mode: string;
      orders: Array<{
        id: string;
        status: string;
        questionNumber: number;
        maxQuestions: number;
        angles: Array<{ angle: number; subject: string; emailBody: string; smsBody: string }>;
        manualSmsHref: string | null;
      }>;
    };
    expect(inboxData.mode).toBe("single");
    expect(inboxData.orders[0].questionNumber).toBe(1);
    expect(inboxData.orders[0].maxQuestions).toBe(3);
    expect(inboxData.orders[0].angles).toHaveLength(3);
    expect(inboxData.orders[0].manualSmsHref).toContain("sms:+14065550199");

    // 5. Regenerate angles with steering note
    const regenRes = await inboxPost(
      new NextRequest("https://cardblueprints.com/api/ops/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate",
          orderId: compatJson.orderId,
          sig,
          steeringNote: "Highlight the Dec 24 10♣ window immediately.",
        }),
      }),
    );
    expect(regenRes.status).toBe(200);

    // 6. Approve Angle 1 and deliver via Twilio SMS + backup Email
    const angle1 = inboxData.orders[0].angles[0];
    const approveRes = await inboxPost(
      new NextRequest("https://cardblueprints.com/api/ops/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          orderId: compatJson.orderId,
          sig,
          angle: 1,
          subject: angle1.subject,
          emailBody: angle1.emailBody,
          smsBody: angle1.smsBody,
        }),
      }),
    );
    expect(approveRes.status).toBe(200);
    const approveJson = (await approveRes.json()) as {
      ok: boolean;
      order: { status: string; approvedAngle: number };
      smsSent: boolean;
      emailSent: boolean;
      requiresManualSmsTap: boolean;
    };
    expect(approveJson.ok).toBe(true);
    expect(approveJson.order.status).toBe("sent");
    expect(approveJson.order.approvedAngle).toBe(1);
    expect(approveJson.smsSent).toBe(true);
    expect(approveJson.emailSent).toBe(true);
    expect(approveJson.requiresManualSmsTap).toBe(false);
    expect(sentTwilioSms).toHaveLength(1);
    expect(sentTwilioSms[0].to).toBe("+14065550199");
    expect(sentEmails).toHaveLength(3);
    expect(sentEmails[2].to).toBe("candice@example.com");
    expect(sentEmails[2].text).toContain("2 of 3 questions remaining in your 48-hour window");
  });

  test("48-hour Reading Pass: pay first without typing Q1 -> Suggested Questions PDF -> submit Q1, Q2 (pair), Q3 -> reject Q4 (409) & expired window (410)", async () => {
    const pdfBytes = readFileSync("public/downloads/card-blueprint-suggested-questions.pdf");
    expect(pdfBytes.byteLength).toBeGreaterThan(5000);
    expect(pdfBytes.subarray(0, 8).toString("latin1")).toContain("%PDF-1.4");

    const stripe = buildMockStripe(CARD_BLUEPRINTS_STRIPE_ACCOUNT);
    setQuestionTestStripe(stripe);

    // 1. Buyer pays $99 first with question left blank
    const checkoutRes = await checkoutPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          birth1: "1991-02-17",
          name1: "Maya",
          question: "",
          deliveryChannel: "email",
          buyerEmail: "maya@example.com",
        }),
      }),
    );
    expect(checkoutRes.status).toBe(200);
    const checkoutJson = (await checkoutRes.json()) as {
      sessionId: string;
      orderId: string;
      amountCents: number;
    };
    expect(checkoutJson.amountCents).toBe(9900);

    // 2. Confirm sets status = awaiting_question, 0 of 3 questions used
    const confirmRes = await confirmPost(
      new NextRequest("https://cardblueprints.com/api/checkout/question-reading/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: checkoutJson.sessionId }),
      }),
    );
    expect(confirmRes.status).toBe(200);
    const confirmJson = (await confirmRes.json()) as {
      status: string;
      passToken: string;
      suggestedQuestionsUrl: string;
      accessExpiresAt: string;
      questionsUsed: number;
      questionsRemaining: number;
      maxQuestions: number;
    };
    expect(confirmJson.status).toBe("awaiting_question");
    expect(confirmJson.questionsUsed).toBe(0);
    expect(confirmJson.questionsRemaining).toBe(3);
    expect(confirmJson.maxQuestions).toBe(3);
    expect(confirmJson.suggestedQuestionsUrl).toBe(
      "/downloads/card-blueprint-suggested-questions.pdf",
    );

    // Only receipt email sent so far (no operator approval alert until Q1 is submitted)
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("maya@example.com");

    // 3. Submit Question 1 (solo), Question 2 (2-person compatibility), and Question 3 via /api/reading-pass
    const q1Res = await passPost(
      new NextRequest("https://cardblueprints.com/api/reading-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          token: confirmJson.passToken,
          question: "Which 52-day window this year favors raising my studio rates?",
        }),
      }),
    );
    expect(q1Res.status).toBe(200);
    const q1Json = (await q1Res.json()) as {
      submittedQuestionNumber: number;
      submittedOrderId: string;
      pass: { questionsUsed: number; questionsRemaining: number };
    };
    expect(q1Json.submittedQuestionNumber).toBe(1);
    expect(q1Json.submittedOrderId).toBe(checkoutJson.orderId);
    expect(q1Json.pass.questionsUsed).toBe(1);
    expect(q1Json.pass.questionsRemaining).toBe(2);

    // Approve Q1 in /ops/inbox so Q2 gets prior answered Q&A context
    const sig1 = await signOpsOrderToken(q1Json.submittedOrderId);
    const inbox1Res = await inboxGet(
      new NextRequest(
        `https://cardblueprints.com/api/ops/inbox?order=${encodeURIComponent(q1Json.submittedOrderId)}&sig=${encodeURIComponent(sig1)}`,
      ),
    );
    const inbox1 = (await inbox1Res.json()) as {
      orders: Array<{ angles: Array<{ subject: string; emailBody: string; smsBody: string }> }>;
    };
    await inboxPost(
      new NextRequest("https://cardblueprints.com/api/ops/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          orderId: q1Json.submittedOrderId,
          sig: sig1,
          angle: 1,
          subject: inbox1.orders[0].angles[0].subject,
          emailBody: inbox1.orders[0].angles[0].emailBody,
          smsBody: inbox1.orders[0].angles[0].smsBody,
        }),
      }),
    );

    const q2Res = await passPost(
      new NextRequest("https://cardblueprints.com/api/reading-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          token: confirmJson.passToken,
          birth2: "1989-10-04",
          name2: "Devon",
          question: "Why do Devon and I stall out every time we talk about moving in together?",
        }),
      }),
    );
    expect(q2Res.status).toBe(200);
    const q2Json = (await q2Res.json()) as {
      submittedQuestionNumber: number;
      submittedOrderId: string;
      pass: { questionsUsed: number; questionsRemaining: number };
    };
    expect(q2Json.submittedQuestionNumber).toBe(2);
    expect(q2Json.pass.questionsUsed).toBe(2);
    expect(q2Json.pass.questionsRemaining).toBe(1);

    // Verify expired 48h window check BEFORE using question #3 slot
    const after48hMs = new Date(confirmJson.accessExpiresAt).getTime() + 1_000;
    let expiredErr: unknown = null;
    try {
      await submitReadingPassQuestion({
        rootOrderId: checkoutJson.orderId,
        question: "Trying to ask after 48 hours have elapsed since purchase.",
        nowMs: after48hMs,
      });
    } catch (err) {
      expiredErr = err;
    }
    expect(expiredErr).toBeInstanceOf(ReadingPassError);
    expect((expiredErr as InstanceType<typeof ReadingPassError>).status).toBe(410);
    expect((expiredErr as InstanceType<typeof ReadingPassError>).code).toBe("WINDOW_EXPIRED");

    // Submit Question 3 within window
    const q3Res = await passPost(
      new NextRequest("https://cardblueprints.com/api/reading-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          token: confirmJson.passToken,
          question: "What blind spot in my 8♦ spread keeps making me overwork through Saturn?",
        }),
      }),
    );
    expect(q3Res.status).toBe(200);
    const q3Json = (await q3Res.json()) as {
      submittedQuestionNumber: number;
      pass: { questionsUsed: number; questionsRemaining: number; canSubmitQuestion: boolean };
    };
    expect(q3Json.submittedQuestionNumber).toBe(3);
    expect(q3Json.pass.questionsUsed).toBe(3);
    expect(q3Json.pass.questionsRemaining).toBe(0);
    expect(q3Json.pass.canSubmitQuestion).toBe(false);

    // 4. Question 4 MUST be rejected with HTTP 409 QUESTION_LIMIT_REACHED
    const q4Res = await passPost(
      new NextRequest("https://cardblueprints.com/api/reading-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://cardblueprints.com" },
        body: JSON.stringify({
          token: confirmJson.passToken,
          question: "Can I sneak in a fourth question on the same order?",
        }),
      }),
    );
    expect(q4Res.status).toBe(409);
    const q4Json = (await q4Res.json()) as { code?: string };
    expect(q4Json.code).toBe("QUESTION_LIMIT_REACHED");

    // 5. GET /api/reading-pass?token=... returns delivered Q1 answer + pending Q2/Q3
    const stateRes = await passGet(
      new NextRequest(
        `https://cardblueprints.com/api/reading-pass?token=${encodeURIComponent(confirmJson.passToken)}`,
      ),
    );
    expect(stateRes.status).toBe(200);
    const stateJson = (await stateRes.json()) as {
      ok: boolean;
      pass: {
        questionsUsed: number;
        questions: Array<{ questionNumber: number; status: string; approvedBody: string | null }>;
      };
    };
    expect(stateJson.ok).toBe(true);
    expect(stateJson.pass.questionsUsed).toBe(3);
    expect(stateJson.pass.questions[0].status).toBe("sent");
    expect(stateJson.pass.questions[0].approvedBody).toBeTruthy();
    expect(stateJson.pass.questions[1].status).toBe("awaiting_approval");
    expect(stateJson.pass.questions[2].status).toBe("awaiting_approval");
  });
});
