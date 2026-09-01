---
description: GSC + Cloudflare funnel + Stripe → five-line growth read
---
1. Newest GSC export: `ls -t ~/Downloads/*Performance-on-Search*.zip | head -1` (unzip to scratch if not already; if older than 3 days, ask Cass to export a fresh one from Search Console → Performance → Export).
2. `bash scripts/growth-report.sh 14` (Cloudflare funnel). For Stripe use the Stripe MCP (account **Card Blueprint** `acct_1U1a1dChx1yAVyrs`, livemode): `GetCheckoutSessions` for the window, count complete vs expired by amount. (The script's Stripe section needs the secret key in the shell, which the auto-mode classifier blocks.)
3. Reply with at most five lines: clicks trend, top page share, calculator completions → CTA clicks → checkouts → sales (14d), the one page with the biggest CTR upside (high impressions, CTR < 5%, position 5–15), and the single next action. Append the numbers to `~/cardblueprints-ops/STATE.md` under "Numbers that matter".
