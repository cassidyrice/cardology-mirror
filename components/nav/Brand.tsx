"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { clearProfile } from "@/lib/profile";

interface BrandProps {
  /** Small eyebrow/section label shown under the wordmark. */
  label?: string;
}

/**
 * Reusable wordmark/header for the top of screens.
 * Includes a subtle gear affordance to "start over" (clearProfile + onboarding).
 */
export default function Brand({ label }: BrandProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function startOver() {
    clearProfile();
    setOpen(false);
    router.replace("/onboarding");
  }

  return (
    <header className="relative flex items-center justify-between pt-6 pb-4">
      <div className="flex flex-col">
        <span className="display foil-text text-xl tracking-tight">Mirror</span>
        {label ? <span className="eyebrow mt-1">{label}</span> : null}
      </div>

      <button
        type="button"
        aria-label="Settings"
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-faint transition hover:text-mist active:scale-90 active:text-gold"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="card-surface absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden p-1"
          >
            <button
              type="button"
              onClick={startOver}
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-bone transition-colors hover:bg-haze/60"
            >
              <span className="block">Start over</span>
              <span className="eyebrow mt-0.5 block normal-case tracking-normal text-faint">
                Clears your profile
              </span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
