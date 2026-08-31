"use client";

import { useEffect, useState } from "react";

import { ShareBirthResultButton } from "@/components/share/ShareCardCanvas";
import {
  renderBirthSharePng,
  renderEmptyBirthSharePng,
  SHARE_LAYOUT,
  SHARE_TEMPLATE_PATHS,
} from "@/lib/share-cards";

export function BirthShareHero({ birthCard }: { birthCard?: string }) {
  const [src, setSrc] = useState<string>(SHARE_TEMPLATE_PATHS.birthResult);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function paint() {
      const { blob } = birthCard
        ? await renderBirthSharePng({ birthCard })
        : await renderEmptyBirthSharePng();
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    }

    paint().catch(() => {
      if (!cancelled) setSrc(SHARE_TEMPLATE_PATHS.birthResult);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [birthCard]);

  const { w, h } = SHARE_LAYOUT.birthResult.canvas;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <img
        src={src}
        alt={birthCard ? "Your birth card" : "Birth card"}
        width={w}
        height={h}
        className="mx-auto max-h-[70svh] w-auto rounded-[3px] border border-brand-line"
      />
      {birthCard ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-brand-paper via-brand-paper/90 to-transparent px-4 pb-4 pt-16">
          <ShareBirthResultButton
            birthCard={birthCard}
            placement="birth-card-calculator-hero-share"
            className="accent-button large-button w-full max-w-xs"
          />
        </div>
      ) : null}
    </div>
  );
}
