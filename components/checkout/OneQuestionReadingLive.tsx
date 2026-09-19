"use client";

import { useEffect, useState } from "react";

type State =
  | { phase: "writing" }
  | { phase: "ready"; text: string }
  | { phase: "failed" };

const POLL_MS = 3000;
/** The webhook normally writes it. Only take over if nothing has appeared by now. */
const TAKE_OVER_AFTER_MS = 30000;
const GIVE_UP_AFTER_MS = 240000;

export default function OneQuestionReadingLive({
  sessionId,
  email,
}: {
  sessionId: string;
  email: string;
}) {
  const [state, setState] = useState<State>({ phase: "writing" });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const started = Date.now();

    const poll = async () => {
      while (!cancelled) {
        const waited = Date.now() - started;
        // `start=1` asks the server to write it here instead of waiting on the webhook.
        const start = waited > TAKE_OVER_AFTER_MS ? "&start=1" : "";
        try {
          const res = await fetch(
            `/api/one-question?session_id=${encodeURIComponent(sessionId)}${start}`,
            { cache: "no-store" },
          );
          const body = (await res.json()) as { status?: string; text?: string };
          if (cancelled) return;
          if (body.status === "ready" && body.text) {
            setState({ phase: "ready", text: body.text });
            return;
          }
        } catch {
          // a dropped poll is not a failure; the next one decides
        }
        if (Date.now() - started > GIVE_UP_AFTER_MS) {
          if (!cancelled) setState({ phase: "failed" });
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Preserve existing confirmation copy; only add the purchased text when stored.
  return state.phase === "ready" ? (
    <article aria-live="polite" className="mt-4 whitespace-pre-wrap border-l-2 border-brand-line-strong pl-5 font-serif text-[1.05rem] leading-relaxed text-brand-ink">
      {state.text}
    </article>
  ) : null;
}
