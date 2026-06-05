"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Screen } from "@/components/ui";
import { saveProfile, loadProfile } from "@/lib/profile";
import { IntroSlide } from "@/components/onboarding/IntroSlide";
import { ProfileForm } from "@/components/onboarding/ProfileForm";

const SLIDES = [
  {
    eyebrow: "Mirror",
    line: "We don't read your future.",
    sub: "We name the pattern you're already running — the one steering you whether you see it or not.",
  },
  {
    eyebrow: "The engine",
    line: "Your birthday already dealt your hand.",
    sub: "A deterministic card system. No AI, no vibes — same birthday, same cards, every time.",
  },
  {
    eyebrow: "The deal",
    line: "We name the pattern. The rest is on you.",
    sub: "Every pattern here is one you can own, work, or keep pretending you don't have.",
  },
] as const;

// One step per intro slide, plus a final form step.
const FORM_STEP = SLIDES.length;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // If a profile already exists, skip straight to the app.
  useEffect(() => {
    if (loadProfile()) router.replace("/today");
  }, [router]);

  const onForm = step === FORM_STEP;
  const progress = (step + 1) / (SLIDES.length + 1);

  function next() {
    setStep((s) => Math.min(s + 1, FORM_STEP));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function complete({ name, birthdate }: { name: string; birthdate: string }) {
    saveProfile({ name, birthdate, createdAt: new Date().toISOString() });
    router.push("/today");
  }

  return (
    <main className="bg-cosmic starfield mx-auto min-h-dvh max-w-md">
      <Screen className="flex min-h-dvh flex-col">
        {/* Progress hairlines */}
        <div className="relative z-10 mb-2 flex gap-1.5">
          {Array.from({ length: SLIDES.length + 1 }).map((_, i) => (
            <span
              key={i}
              className="h-px flex-1 overflow-hidden bg-white/10"
              aria-hidden
            >
              <motion.span
                className="block h-full bg-gold"
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                style={{ originX: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </span>
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {SLIDES.length + 1}
        </p>

        {/* Content area */}
        <div className="relative z-10 flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {onForm ? (
              <ProfileForm key="form" onSubmit={complete} back={back} />
            ) : (
              <IntroSlide
                key={step}
                index={step}
                total={SLIDES.length}
                eyebrow={SLIDES[step].eyebrow}
                line={SLIDES[step].line}
                sub={SLIDES[step].sub}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Intro controls (hidden on form step, which has its own) */}
        {!onForm && (
          <div className="relative z-10 mt-10 flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="text-sm uppercase tracking-wider2 text-faint transition hover:text-mist disabled:opacity-0"
            >
              ← Back
            </button>
            <div
              className="flex-1"
              role="button"
              tabIndex={0}
              aria-label="Next"
              onClick={next}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  next();
                }
              }}
            />
            <button
              type="button"
              onClick={next}
              className="rounded-full border border-white/15 px-8 py-3 text-sm font-medium uppercase tracking-wider2 text-bone transition hover:border-gold hover:text-gold active:scale-[0.97]"
            >
              {step === SLIDES.length - 1 ? "Continue" : "Next"}
            </button>
          </div>
        )}
      </Screen>
    </main>
  );
}
