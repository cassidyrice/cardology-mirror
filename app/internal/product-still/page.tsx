import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { YearBlueprintApp } from "@/components/year/YearBlueprintApp";
import { buildYearBlueprint } from "@/lib/year-blueprint";

/**
 * Internal render harness for product still shots (scripts/product-still.ts).
 * Disabled unless PRODUCT_STILL=1, so it 404s in production. It renders the
 * purchased 52xSeven Blueprint in its phone frame on a transparent backdrop so
 * Playwright can screenshot the device at high DPI.
 */
export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product still",
  robots: { index: false, follow: false },
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

type SearchParams = Promise<{ birthdate?: string; screen?: string }>;

export default async function ProductStillPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (process.env.PRODUCT_STILL !== "1") notFound();

  const { birthdate, screen } = await searchParams;
  const iso = birthdate && ISO.test(birthdate) ? birthdate : "1991-02-17";
  const data = await buildYearBlueprint(iso);

  return (
    <div
      id="still-stage"
      style={{
        background: "transparent",
        display: "inline-flex",
        width: "max-content",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        margin: 0,
      }}
    >
      {/* The frame's outer drop shadow would clip to a hard dark rectangle at the
          canvas edge. Strip it here and let the page apply a CSS drop-shadow that
          follows the rounded device outline on any background. */}
      <style>{`#still-stage .still-shot > div { box-shadow: inset 0 0 0 8px #050308 !important; }`}</style>
      <div style={{ width: 400 }}>
      <YearBlueprintApp
        className="still-shot"
        data={data}
        mode="full"
        framed
        initialScreen={screen === "card" || screen === "chapters" || screen === "story" ? screen : "now"}
      />
      </div>
    </div>
  );
}
