import { permanentRedirect } from "next/navigation";

// Retired offer (Oct 2026). The only offers now are the three readings in lib/readings.ts,
// shown after a card is revealed. Past buyers keep access through /my-purchases.
export default function RetiredOfferPage() {
  permanentRedirect("/birth-card-calculator");
}
