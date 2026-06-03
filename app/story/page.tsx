"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProfile } from "@/lib/profile";
import { useReading } from "@/lib/useReading";
import { useGate } from "@/lib/useGate";
import { Screen, Eyebrow, Divider } from "@/components/ui";
import { StreamedMarkdown } from "@/components/reading/StreamedMarkdown";
import { ComposingState } from "@/components/reading/ComposingState";
import { ArcRail } from "@/components/story/ArcRail";
import { AccessGate } from "@/components/gate/AccessGate";

type Phase = "idle" | "streaming" | "done" | "error";

export default function StoryArcPage() {
  const { profile, ready } = useProfile();
  const { token, unlocked, ready: gateReady, clear } = useGate();
  const router = useRouter();
  const { data: reading } = useReading(profile?.birthdate);

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
      const res = await fetch("/api/storyarc", {
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
        let msg = "Something interrupted the story.";
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
        setText((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setPhase("done");
    } catch (e) {
      if (ac.signal.aborted) return;
      setErrorMsg(e instanceof Error ? e.message : "Something interrupted the story.");
      setPhase("error");
    }
  }, [profile?.birthdate, token, clear]);

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
          <p className="eyebrow animate-pulse">tracing your arc…</p>
        </div>
      </Screen>
    );
  }
  if (!profile) return null;

  const showComposing = phase === "streaming" && text.length === 0;

  return (
    <Screen className="bg-cosmic starfield">
      <div className="mx-auto max-w-md">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-7"
        >
          <Eyebrow className="mb-2">Story Arc · Your Year</Eyebrow>
          <h1 className="display text-3xl text-bone">
            Where this year is taking you
          </h1>
          <p className="mt-2 text-sm text-faint">
            For {profile.name || "you"} — your long-range chapter, the deep turn
            beneath it, and the horizon it points toward.
          </p>
        </motion.header>

        {reading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <ArcRail reading={reading} />
          </motion.div>
        )}

        <Divider />

        {gateReady && !unlocked && (
          <AccessGate
            title="Unlock your year's arc"
            blurb="Your cards above are yours to read. The written arc — chapter, turn, and horizon — is generated for you. Enter your email and access code to open it."
          />
        )}

        {unlocked && showComposing && <ComposingState />}

        {phase === "error" && (
          <div className="animate-fade-up pt-4 text-center">
            <Eyebrow className="mb-3">The thread slipped</Eyebrow>
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
              A direction to walk, not a destiny to wait for.
            </p>
            <button
              onClick={generate}
              className="mt-2 rounded-full border border-haze px-6 py-2.5 text-sm text-bone transition hover:border-gold hover:text-gold active:scale-[0.97]"
            >
              Trace it again
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
