"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProfile } from "@/lib/profile";
import { useGate } from "@/lib/useGate";
import { Screen, Eyebrow, Divider } from "@/components/ui";
import { StreamedMarkdown } from "@/components/reading/StreamedMarkdown";
import { ComposingState } from "@/components/reading/ComposingState";
import { AccessGate } from "@/components/gate/AccessGate";

type Phase = "idle" | "streaming" | "done" | "error";

export default function ReadingPage() {
  const { profile, ready } = useProfile();
  const { token, unlocked, ready: gateReady, clear } = useGate();
  const router = useRouter();

  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  const generate = useCallback(async () => {
    if (!profile?.birthdate) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setText("");
    setErrorMsg(null);
    setPhase("streaming");

    try {
      const res = await fetch("/api/deepdive", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ birthdate: profile.birthdate }),
        signal: ac.signal,
      });

      if (res.status === 402) {
        clear();
        setPhase("idle");
        return;
      }

      if (!res.ok || !res.body) {
        let msg = "Something interrupted the read.";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {
          /* non-json */
        }
        setErrorMsg(msg);
        setPhase("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setText((prev) => prev + chunk);
      }
      setPhase("done");
    } catch (e) {
      if (ac.signal.aborted) return;
      setErrorMsg(e instanceof Error ? e.message : "Something interrupted the read.");
      setPhase("error");
    }
  }, [profile?.birthdate, token, clear]);

  // Auto-start once unlocked, when the profile is ready.
  useEffect(() => {
    if (!ready || !gateReady || !unlocked || !profile?.birthdate) return;
    if (startedFor.current === profile.birthdate) return;
    startedFor.current = profile.birthdate;
    generate();
  }, [ready, gateReady, unlocked, profile?.birthdate, generate]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!ready) {
    return (
      <Screen className="bg-cosmic starfield">
        <div className="mx-auto max-w-md pt-32 text-center">
          <p className="eyebrow animate-pulse">opening the mirror…</p>
        </div>
      </Screen>
    );
  }
  if (!profile) return null;

  const showComposing = phase === "streaming" && text.length === 0;
  const showGate = gateReady && !unlocked;

  return (
    <Screen className="bg-cosmic starfield">
      <div className="mx-auto max-w-md">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Eyebrow className="mb-2">Deep Dive · A Mirror, Not a Forecast</Eyebrow>
          <h1 className="display text-3xl text-bone">Your Reading</h1>
          <p className="mt-2 text-sm text-faint">
            For {profile.name || "you"} — drawn only from your cards.
          </p>
        </motion.header>

        <Divider />

        {showGate && <AccessGate />}

        {!showGate && showComposing && <ComposingState />}

        {phase === "error" && (
          <div className="animate-fade-up pt-4 text-center">
            <Eyebrow className="mb-3">The mirror clouded over</Eyebrow>
            <p className="prose-reading text-mist">{errorMsg}</p>
            <button
              onClick={generate}
              className="mt-6 rounded-full border border-haze px-6 py-2.5 text-sm text-bone transition hover:border-gold hover:text-gold active:scale-[0.97]"
            >
              Try again
            </button>
          </div>
        )}

        {text.length > 0 && (
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <StreamedMarkdown text={text} />
            {phase === "streaming" && (
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-gold align-middle" />
            )}
          </motion.article>
        )}

        {phase === "done" && (
          <div className="animate-fade-up mt-12 flex flex-col items-center gap-3 text-center">
            <Divider className="w-full" />
            <p className="text-xs uppercase tracking-wider2 text-faint">
              None of this is destiny. It is data to work with.
            </p>
            <button
              onClick={generate}
              className="mt-2 rounded-full border border-haze px-6 py-2.5 text-sm text-bone transition hover:border-gold hover:text-gold active:scale-[0.97]"
            >
              Re-read the mirror
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
