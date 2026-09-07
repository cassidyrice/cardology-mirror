import Link from "next/link";
import { tattooFor } from "@/lib/tattoos";

export function TattooBlock({ slug, label }: { slug: string; label: string }) {
  const tattoo = tattooFor(slug);
  if (!tattoo) return null;
  const court = ["A", "J", "Q", "K"].includes(tattoo.rank);
  return (
    <figure className="mt-4">
      <img
        src={tattoo.image}
        alt={`${label} pip tattoo on the ${tattoo.bodyLabel}`}
        width={900}
        height={1200}
        loading="lazy"
        decoding="async"
        className="w-full rounded-2xl border border-white/10"
      />
      <figcaption className="mt-3 text-sm leading-relaxed text-mist">
        {court
          ? `A single ${tattoo.suit.replace(/s$/, "")} pip on the ${tattoo.bodyLabel} — court cards have a face on the card, not in the tattoo.`
          : `The exact ${tattoo.pipCount}-pip ${label} field on the ${tattoo.bodyLabel}. No card border, no index.`}{" "}
        Generated reference, not a client&rsquo;s skin.{" "}
        <Link href="/playing-card-tattoo-meaning" className="text-gold underline underline-offset-4">
          All 52 pip tattoos
        </Link>
        .
      </figcaption>
    </figure>
  );
}
