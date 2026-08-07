"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function FreeCourseSignupForm({ source }: { source: string }) {
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
      window.location.assign(body.accessUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Course access is temporarily unavailable.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4" noValidate={false}>
      <div>
        <label htmlFor="free-course-name" className="mb-1.5 block text-sm font-semibold text-bone">
          Name <span aria-hidden="true" className="text-gold">*</span>
        </label>
        <input
          id="free-course-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          className="min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-bone outline-none transition placeholder:text-faint focus:border-gold"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="free-course-email" className="mb-1.5 block text-sm font-semibold text-bone">
          Email address <span aria-hidden="true" className="text-gold">*</span>
        </label>
        <input
          id="free-course-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          className="min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-bone outline-none transition placeholder:text-faint focus:border-gold"
          placeholder="you@example.com"
        />
      </div>
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="free-course-company">Company</label>
        <input id="free-course-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-xs leading-relaxed text-faint">
        By requesting access, you agree to receive the course link and occasional Card Blueprints emails.
        Unsubscribe anytime. See the{" "}
        <Link href="/privacy-policy" className="text-gold underline underline-offset-4">privacy policy</Link>.
      </p>
      {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="min-h-12 w-full rounded-full bg-foil px-6 py-3 font-serif text-base text-ink transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
      >
        {status === "submitting" ? "Opening your course…" : "Send me the free course →"}
      </button>
    </form>
  );
}
