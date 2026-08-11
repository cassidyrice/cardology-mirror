"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import type { MyQuestionOrderStatus } from "@/lib/my-question/orders";

type ActionFailure = {
  ok: false;
  code: string;
  message: string;
};

type ActionSuccess = {
  ok: true;
  status: MyQuestionOrderStatus;
  productionStartedAt?: string | null;
  deliveryUrl?: string | null;
  deliveredAt?: string | null;
};

export function MyQuestionFulfillmentControls({
  token,
  initialStatus,
  initialDeliveryUrl,
}: {
  token: string;
  initialStatus: MyQuestionOrderStatus;
  initialDeliveryUrl: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [deliveryUrl, setDeliveryUrl] = useState(initialDeliveryUrl ?? "");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function runAction(action: "start" | "deliver") {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/my-question/fulfill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action,
          token,
          ...(action === "deliver" ? { deliveryUrl } : {}),
        }),
      });
      const body = (await response.json()) as ActionFailure | ActionSuccess;
      if (!response.ok || !body.ok) {
        setError(
          body.ok
            ? "The order could not be updated. Refresh this private page and try again."
            : body.message,
        );
        return;
      }
      setStatus(body.status);
      if (body.deliveryUrl) setDeliveryUrl(body.deliveryUrl);
    } catch {
      setError("The order could not be updated. Check the connection and try again.");
    } finally {
      setWorking(false);
    }
  }

  function handleDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAction("deliver");
  }

  if (status === "delivered") {
    return (
      <section className="rounded-sm border border-brand-line-strong bg-brand-ivory p-6">
        <h2 className="font-serif text-2xl font-semibold text-brand-ink">Delivery recorded</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
          The customer delivery email was sent before this order was marked delivered.
        </p>
        {deliveryUrl ? (
          <a
            href={deliveryUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex min-h-11 items-center rounded-sm border border-brand-line-strong px-4 py-2.5 font-semibold text-brand-ink underline-offset-4 hover:underline"
          >
            Open delivered Google Drive file
          </a>
        ) : null}
      </section>
    );
  }

  if (status === "checkout_pending" || status === "paid_awaiting_intake") {
    return (
      <section className="rounded-sm border border-brand-line-strong bg-brand-ivory p-6">
        <h2 className="font-serif text-2xl font-semibold text-brand-ink">Waiting for onboarding</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
          Do not start production. The customer has not completed valid intake, so no production date is reserved.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-brand-line-strong bg-brand-ivory p-6 sm:p-7">
      <h2 className="font-serif text-2xl font-semibold text-brand-ink">Creator controls</h2>

      {status === "ready" ? (
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-brand-ink-soft">
            Start production only when you begin the human interpretation or recording work. This state change affects refund handling.
          </p>
          <button
            type="button"
            disabled={working}
            onClick={() => void runAction("start")}
            className="mt-5 min-h-11 rounded-sm bg-brand-ink px-5 py-2.5 font-semibold text-brand-paper transition hover:bg-brand-ink-soft disabled:cursor-wait disabled:opacity-60"
          >
            {working ? "Updating..." : "Mark production started"}
          </button>
        </div>
      ) : null}

      {status === "in_production" ? (
        <form onSubmit={handleDelivery} className="mt-5">
          <label htmlFor="deliveryUrl" className="block text-sm font-semibold text-brand-ink">
            Private Google Drive file link
          </label>
          <p id="delivery-url-help" className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
            Verify the video, optional PDF, sharing permissions, and customer identity before sending.
          </p>
          <input
            id="deliveryUrl"
            name="deliveryUrl"
            type="url"
            required
            inputMode="url"
            autoComplete="off"
            placeholder="https://drive.google.com/file/d/.../view"
            value={deliveryUrl}
            onChange={(event) => setDeliveryUrl(event.target.value)}
            aria-describedby="delivery-url-help delivery-warning"
            className="mt-3 min-h-12 w-full rounded-sm border border-brand-line-strong bg-brand-paper px-4 py-3 text-base text-brand-ink outline-none transition focus:border-brand-oxblood focus:ring-2 focus:ring-brand-gold-soft"
          />
          <p id="delivery-warning" className="mt-3 text-xs leading-relaxed text-brand-ink-soft">
            This action emails the customer immediately. The database changes to delivered only after the email provider accepts the message.
          </p>
          <button
            type="submit"
            disabled={working}
            className="mt-5 min-h-11 rounded-sm bg-brand-oxblood px-5 py-2.5 font-semibold text-brand-paper transition hover:bg-brand-oxblood-deep disabled:cursor-wait disabled:bg-brand-ink-soft"
          >
            {working ? "Sending..." : "Email customer and mark delivered"}
          </button>
        </form>
      ) : null}

      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 rounded-sm border border-brand-oxblood bg-brand-paper-deep px-4 py-3 text-sm leading-relaxed text-brand-ink outline-none"
        >
          {error}
        </div>
      ) : null}
    </section>
  );
}
