"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";

export function FreeCourseSignupForm({
  source,
  surface = "ink",
  onSuccess,
}: {
  source: string;
  surface?: "ink" | "paper";
  onSuccess?: () => void;
}) {
  const formId = useId();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      company: String(form.get("company") || ""),
      source,
    };

    try {
      const response = await fetch("/api/free-course/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { accessUrl?: string; error?: string };
      if (!response.ok || !body.accessUrl) {
        throw new Error(body.error || "Course access is temporarily unavailable.");
      }
      // No email/name — source attribution only.
      trackClientFunnelEvent("free_course_signup", {
        placement: source,
      });
      onSuccess?.();
      window.location.assign(body.accessUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Course access is temporarily unavailable.");
      setStatus("error");
    }
  }

  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const companyId = `${formId}-company`;
  const paper = surface === "paper";
  const labelClass = paper
    ? "mb-1.5 block text-sm font-semibold text-brand-ink"
    : "mb-1.5 block text-sm font-semibold text-bone";
  const requiredClass = paper ? "text-brand-oxblood" : "text-gold";
  const inputClass = paper
    ? "min-h-12 w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 text-brand-ink outline-none transition placeholder:text-brand-ink-faint focus:border-brand-oxblood focus:ring-2 focus:ring-brand-oxblood/20"
    : "min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-bone outline-none transition placeholder:text-faint focus:border-gold";
  const finePrintClass = paper
    ? "text-xs leading-relaxed text-brand-ink-soft"
    : "text-xs leading-relaxed text-faint";
  const linkClass = paper
    ? "text-brand-oxblood underline underline-offset-4"
    : "text-gold underline underline-offset-4";
  const errorClass = paper
    ? "rounded-[3px] border border-brand-oxblood/30 bg-brand-oxblood/5 p-3 text-sm text-brand-oxblood"
    : "rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200";
  const buttonClass = paper
    ? "accent-button large-button w-full disabled:cursor-wait disabled:opacity-60"
    : "min-h-12 w-full rounded-full bg-foil px-6 py-3 font-serif text-base text-ink transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60";

  return (
    <form onSubmit={submit} className="mt-7 space-y-4" noValidate={false}>
      <div>
        <label htmlFor={nameId} className={labelClass}>
          Name <span aria-hidden="true" className={requiredClass}>*</span>
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          className={inputClass}
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor={emailId} className={labelClass}>
          Email address <span aria-hidden="true" className={requiredClass}>*</span>
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={companyId}>Company</label>
        <input id={companyId} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className={finePrintClass}>
        By requesting access, you agree to receive the course link and occasional Card Blueprints emails.
        Unsubscribe anytime. See the{" "}
        <Link href="/privacy-policy" className={linkClass}>privacy policy</Link>.
      </p>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button
        type="submit"
        disabled={status === "submitting"}
        className={buttonClass}
      >
        {status === "submitting" ? "Opening your course…" : "Send me the free course →"}
      </button>
    </form>
  );
}
