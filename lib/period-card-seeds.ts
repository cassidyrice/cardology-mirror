import { allCardSeo } from "./seo-cards";
import type { PeriodCardSeed } from "./period-meanings";

/**
 * Keep the engine-backed card catalog on the server. The period tool only
 * serializes the fields its client-side interpretation builder needs.
 */
export function allPeriodCardSeeds(): PeriodCardSeed[] {
  return allCardSeo().map(
    ({
      code,
      label,
      slug,
      color,
      title,
      suitDomain,
      rank,
      under,
      sweetSpot,
      over,
    }) => ({
      code,
      label,
      slug,
      color,
      title,
      suitDomain,
      rank,
      under,
      sweetSpot,
      over,
    }),
  );
}
