import Image from "next/image";

import { LinkButton, SectionShell } from "@/components/ui";
import { TESTIMONIALS, testimonialByline } from "@/lib/testimonials";

const TIFFANY = TESTIMONIALS.find((t) => t.author === "Tiffany")!;

/** Spec quote is the short Tiffany line; full review stays in testimonials.ts. */
const TIFFANY_HOME_QUOTE =
  "I bought the Deep Dive, found out I was the Five of Clubs, and a lot of my life stopped looking random.";

export function DeepDiveSection() {
  return (
    <SectionShell tone="paperDeep">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,14rem)_1fr] lg:items-center lg:gap-14">
        <Image
          src="/og/products/52xseven-blueprint.png"
          alt="The 52xSeven Blueprint: your whole Cardology year in one place"
          width={1200}
          height={630}
          className="mx-auto w-64 border border-brand-line shadow-[0_12px_40px_rgba(20,17,13,0.14)] lg:mx-0 lg:w-full"
        />
        <div>
          <h2 className="type-h2">Your whole year, on one map. $19.</h2>
          <p className="mt-4 max-w-[34em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
            Your birth card, the 52-day chapter you are in right now, all seven chapters, and the yearly story arc in one phone-friendly app. Open it the moment you pay, come back to it all year.
          </p>
          <figure className="mt-6 max-w-[34em]">
            <blockquote className="text-[0.95rem] leading-relaxed text-brand-ink-soft">
              &ldquo;{TIFFANY_HOME_QUOTE}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-bronze">
              {testimonialByline(TIFFANY)}
            </figcaption>
          </figure>
          <p className="mt-6">
            <LinkButton href="/products/52xseven-blueprint" variant="accent">
              Get the 52xSeven Blueprint
            </LinkButton>
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
