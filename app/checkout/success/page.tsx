import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { offerBySlug, type ReadingOffer } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Reading purchase confirmed",
  description: "Share the intake details for your Cardology Pro reading.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  session_id?: string;
  offer?: string;
  intake?: string;
  error?: string;
}>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const offer = sp.offer ? offerBySlug(sp.offer) : undefined;
  const sessionId = sp.session_id ?? "";
  const submitted = sp.intake === "ok";
  const formError = sp.error === "missing-fields";

  // Try to enrich with Stripe session details (customer email, paid status).
  // Failure here is non-fatal — we still render the intake form.
  let customerEmail = "";
  let paid = false;
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_details?.email ?? session.customer_email ?? "";
      paid = session.payment_status === "paid";
    } catch (e) {
      console.warn("[checkout/success] could not retrieve session", e);
    }
  }

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Readings", href: "/readings" },
        { label: "Confirmed", href: "/checkout/success" },
      ]}
    >
      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Payment received</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          {submitted
            ? "Intake received. Your reading is in the queue."
            : offer
              ? `Thank you. Your ${offer.priceLabel} ${offer.name} is paid.`
              : "Thank you. Your reading is paid."}
        </h1>
        {!submitted && (
          <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
            {offer
              ? offerInstructions(offer)
              : "Share the birth details and focus so Cass can prepare your reading."}
          </p>
        )}
        {paid && customerEmail && !submitted && (
          <p className="mt-3 text-sm text-[#5b5148]">
            Receipt sent to <strong>{customerEmail}</strong>.
          </p>
        )}
      </header>

      {formError && (
        <div className="mb-5 border border-[#9e3d24]/40 bg-[#9e3d24]/10 p-4 text-sm text-[#9e3d24]">
          Email and birth date are required. Please fill them in and resubmit.
        </div>
      )}

      {submitted ? (
        <ThankYou />
      ) : (
        <IntakeForm
          offer={offer}
          sessionId={sessionId}
          defaultEmail={customerEmail}
        />
      )}
    </SeoShell>
  );
}

function offerInstructions(offer: ReadingOffer): string {
  if (offer.slug === "basic-birth-card-report") {
    return "Share the birth date the report should focus on. Anything else you want included is optional.";
  }
  if (offer.slug === "one-question-reading") {
    return "Share the birth date and the focused question — person, relationship, or situation.";
  }
  return "Share the birth details, the focus, and any context that will make the deep dive useful.";
}

function IntakeForm({
  offer,
  sessionId,
  defaultEmail,
}: {
  offer?: ReadingOffer;
  sessionId: string;
  defaultEmail: string;
}) {
  const questionRequired = offer?.slug !== "basic-birth-card-report";

  return (
    <form
      action="/api/intake"
      method="POST"
      className="grid gap-5 border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5"
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="offer_slug" value={offer?.slug ?? ""} />
      <input type="hidden" name="offer_name" value={offer?.name ?? ""} />

      <Field
        label="Your email"
        name="email"
        type="email"
        required
        defaultValue={defaultEmail}
        hint="Where the finished reading will be sent."
      />
      <Field
        label="Birth date for the reading"
        name="subject_birthdate"
        type="date"
        required
        hint="Full date the reading should focus on."
      />
      <Field
        label="Other person's birth date (optional)"
        name="other_birthdate"
        type="date"
        hint="If the reading involves a relationship or comparison."
      />
      <TextField
        label={questionRequired ? "Your question or focus" : "Anything you want included (optional)"}
        name="question"
        required={questionRequired}
        rows={4}
        hint={
          questionRequired
            ? "One focused question about a person, relationship, or situation."
            : "Optional context. The report is built from the birth date alone."
        }
      />
      <TextField
        label="Anything else"
        name="notes"
        rows={3}
        hint="Optional. Names, context, timing, or what you want clarity on."
      />

      <button type="submit" className="paper-button large-button mt-2 text-center">
        Send intake details
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="font-bold uppercase text-xs tracking-wider text-[#14110d]">
        {label}
        {required && <span className="text-[#9e3d24]"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1.5 block w-full border border-[#14110d]/20 bg-white/70 px-3 py-2 font-serif text-base text-[#14110d] focus:border-[#14110d]/60 focus:outline-none"
      />
      {hint && <span className="mt-1 block text-xs leading-relaxed text-[#5b5148]">{hint}</span>}
    </label>
  );
}

function TextField({
  label,
  name,
  required,
  rows,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  rows: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="font-bold uppercase text-xs tracking-wider text-[#14110d]">
        {label}
        {required && <span className="text-[#9e3d24]"> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        className="mt-1.5 block w-full border border-[#14110d]/20 bg-white/70 px-3 py-2 font-serif text-base leading-relaxed text-[#14110d] focus:border-[#14110d]/60 focus:outline-none"
      />
      {hint && <span className="mt-1 block text-xs leading-relaxed text-[#5b5148]">{hint}</span>}
    </label>
  );
}

function ThankYou() {
  return (
    <section className="border border-[#14110d]/15 bg-[#eadfcd]/70 p-6">
      <h2 className="font-serif text-2xl text-[#14110d]">What happens next</h2>
      <ul className="mt-3 space-y-2 text-base leading-relaxed text-[#3d352d]">
        <li>Cass receives your intake immediately and confirms by email.</li>
        <li>The reading is prepared from the deterministic birth-card system, then written for your question.</li>
        <li>Delivered digitally to the email you provided.</li>
      </ul>
      <p className="mt-4 text-sm text-[#5b5148]">
        Need to add or correct something?{" "}
        <Link href="/contact" className="text-[#9e3d24] underline underline-offset-4">
          Send a note via contact
        </Link>{" "}
        and reference your purchase email.
      </p>
    </section>
  );
}
