import { permanentRedirect } from "next/navigation";

import { DEEP_DIVE_PRODUCT_PATH } from "@/lib/deep-dive";

// Retired 2026-09-13: the $19 52xSeven Blueprint is no longer sold. middleware.ts
// answers this path with an edge 301; this stub covers any render that slips past it.
export default function RetiredFiftyTwoBySevenPage() {
  permanentRedirect(DEEP_DIVE_PRODUCT_PATH);
}
