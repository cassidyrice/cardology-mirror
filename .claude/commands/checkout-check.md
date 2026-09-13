---
description: Prove the $47 One Question Reading checkout works end to end right now
---
1. `curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -A "Mozilla/5.0 (iPhone)" --data "birthdate=1988-07-14&source=birth-card-calculator" https://cardblueprints.com/checkout/deep-dive/session` → expect `303` to `checkout.stripe.com`.
2. `curl -sI https://cardblueprints.com/birth-card-calculator | grep -i permissions-policy` → must contain `payment=(self "https://js.stripe.com")`.
3. `bash scripts/growth-report.sh 3` → check `checkout_error` count is 0 and `checkout_started` > 0.
4. Stripe (Card Blueprint account): list checkout sessions from the last 3 days; report complete vs expired.
Reply in two lines: works / broken (with the failing step), and sessions-vs-sales for the last 3 days.
