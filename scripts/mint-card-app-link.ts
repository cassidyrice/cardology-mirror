// Print a Card Blueprint App link for a birthdate, for previewing the app
// without a purchase. Needs the same REPORT_TOKEN_SECRET the site uses
// (from .env.local; never print it).
//
//   bun scripts/mint-card-app-link.ts 1988-07-14 [email] [base-url]
import { CARD_APP_SLUG } from "../lib/card-app-slug";
import { canonicalCalendarDate } from "../lib/birthdate";
import { mintReportToken } from "../lib/report-token";

const [birthArg, email = "preview@cardblueprints.com", base = "https://cardblueprints.com"] = process.argv.slice(2);
const birthdate = birthArg ? canonicalCalendarDate(birthArg) : null;
if (!birthdate) {
  console.error("usage: bun scripts/mint-card-app-link.ts YYYY-MM-DD [email] [base-url]");
  process.exit(1);
}
const token = await mintReportToken(email, CARD_APP_SLUG, "preview", birthdate, 30);
console.log(`${base.replace(/\/$/, "")}/blueprint?token=${encodeURIComponent(token)}`);
