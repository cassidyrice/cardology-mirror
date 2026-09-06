/** Video tier gate. Off by default (2026-09-05 audit direction: one commercial test at a time).
 *  Set VIDEO_TIER_ENABLED=1 on the Pages project to expose the order pages and the success-page upsell. */
export function videoTierEnabled(): boolean {
  return (process.env.VIDEO_TIER_ENABLED || "").trim() === "1";
}
