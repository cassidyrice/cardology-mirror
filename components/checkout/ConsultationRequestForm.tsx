"use client";
import { useState, type FormEvent } from "react";
import { CONSULT_SUCCESS_COPY } from "@/lib/blueprint-report";

export function ConsultationRequestForm({ sessionId }: { sessionId: string }) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || sent) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/consultation", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, topic: form.get("topic"), timeZone: form.get("timeZone"), note: form.get("note") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please retry shortly.");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your request was not confirmed. Please retry shortly.");
    } finally { setPending(false); }
  }
  return <div data-sensitive className="max-w-xl">
    {sent ? <p role="status" className="border border-brand-line p-5">{CONSULT_SUCCESS_COPY}</p> :
      <form onSubmit={submit} className="space-y-5">
        <p>Tell Cass what you want to explore and your time zone. He will contact you using the email from your purchase to arrange your 45-minute call.</p>
        <label className="block">What would you like to explore?
          <textarea name="topic" required minLength={3} maxLength={1500} rows={4} className="mt-2 block w-full rounded border border-brand-line bg-brand-ivory p-3" />
        </label>
        <label className="block">Your time zone
          <input name="timeZone" required minLength={2} maxLength={100} placeholder="For example, America/Denver or Mountain Time" className="mt-2 block w-full rounded border border-brand-line bg-brand-ivory p-3" />
        </label>
        <label className="block">Extra note (optional)
          <textarea name="note" maxLength={1000} rows={2} className="mt-2 block w-full rounded border border-brand-line bg-brand-ivory p-3" />
        </label>
        {error && <p role="alert" className="border border-brand-oxblood p-3">{error}</p>}
        <button disabled={pending} type="submit" className="rounded bg-brand-ink px-5 py-3 text-white disabled:opacity-60">{pending ? "Sending request…" : "Send my request"}</button>
        <p className="text-sm">Your consultation is already included. Cass will arrange the time personally.</p>
      </form>}
  </div>;
}
