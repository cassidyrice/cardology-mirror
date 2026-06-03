"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile";

export default function SplashEntry() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      router.replace(profile ? "/today" : "/onboarding");
    }, 900);
    return () => clearTimeout(t);
  }, [ready, profile, router]);

  return (
    <main className="starfield relative flex min-h-dvh items-center justify-center overflow-hidden bg-cosmic">
      <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-up">
        <span className="eyebrow">Cardology</span>
        <h1 className="display foil-text animate-shimmer text-6xl tracking-tight">
          Mirror
        </h1>
        <span className="text-[0.6rem] uppercase tracking-wider2 text-faint">
          a reflection, not a forecast
        </span>
      </div>
    </main>
  );
}
