#!/usr/bin/env python3
"""Read-only, paginated Card Blueprint cash-revenue report. Never prints customer data."""
import argparse
import collections
import datetime as dt
import json
import os
import subprocess
import time

ACCOUNT = "acct_1U1a1dChx1yAVyrs"


def stripe(*args):
    result = subprocess.run(["stripe", *args], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError("Stripe request failed; verify CLI authentication and permissions")
    return json.loads(result.stdout)


def pages(path, params=(), reader=stripe):
    cursor = None
    while True:
        args = ["get", path, "--live", "--limit", "100", *params]
        if cursor:
            args += ["--starting-after", cursor]
        result = reader(*args)
        rows = result.get("data", [])
        yield from rows
        if not result.get("has_more"):
            return
        if not rows or rows[-1]["id"] == cursor:
            raise RuntimeError("Stripe pagination did not advance; refusing incomplete report")
        cursor = rows[-1]["id"]


def summarize(charges, refunds, sessions, excluded_sessions, owner_emails):
    groups = collections.defaultdict(lambda: dict(orders=0, sales_cents=0, tax_cents=0,
        refunds_cents=0, payment_fees_cents=0, refunded_order_count=0))
    excluded = collections.Counter()
    def classify(charge):
        session = sessions.get(charge.get("payment_intent")) or {}
        metadata = session.get("metadata") or charge.get("metadata") or {}
        email = ((session.get("customer_details") or {}).get("email") or
                 session.get("customer_email") or charge.get("receipt_email") or "").lower()
        if session.get("id") in excluded_sessions or metadata.get("revenue_test") == "true" or email in owner_emails:
            return None, session, "owner-or-marked-test"
        if email.endswith(("@example.test", "@example.com")):
            return None, session, "synthetic-address"
        if charge.get("currency") != "usd":
            return None, session, "non-usd-review"
        offer = metadata.get("offer_slug")
        return offer or "unattributed-account-payment", session, None
    for charge in charges:
        if not charge.get("paid") or charge.get("status") != "succeeded" or charge.get("amount", 0) <= 0:
            continue
        offer, session, reason = classify(charge)
        if reason:
            excluded[reason] += 1
            continue
        tax = (session.get("total_details") or {}).get("amount_tax") or 0
        row = groups[offer]
        row["orders"] += 1
        row["sales_cents"] += charge["amount"] - tax
        row["tax_cents"] += tax
        row["refunded_order_count"] += bool(charge.get("amount_refunded"))
        balance = charge.get("balance_transaction")
        if isinstance(balance, dict):
            row["payment_fees_cents"] += balance.get("fee") or 0
    for refund, charge in refunds:
        if refund.get("status") != "succeeded":
            continue
        offer, _, reason = classify(charge)
        if not reason:
            groups[offer]["refunds_cents"] += refund["amount"]
    for row in groups.values():
        row["revenue_after_refunds_cents"] = row["sales_cents"] - row["refunds_cents"]
        row["after_payment_fees_cents"] = row["revenue_after_refunds_cents"] - row["payment_fees_cents"]
    attributed = [v for k, v in groups.items() if k != "unattributed-account-payment"]
    return {"offers": dict(sorted(groups.items())), "excluded": dict(excluded),
        "attributed_revenue_after_refunds_cents": sum(r["revenue_after_refunds_cents"] for r in attributed),
        "attributed_after_payment_fees_cents": sum(r["after_payment_fees_cents"] for r in attributed)}


def self_test():
    responses = iter([{"data": [{"id": "a"}], "has_more": True}, {"data": [{"id": "b"}], "has_more": False}])
    calls = []
    def reader(*args):
        calls.append(args)
        return next(responses)
    assert len(list(pages("/v1/charges", reader=reader))) == 2
    assert calls[1][-2:] == ("--starting-after", "a")
    charge = {"id": "ch_a", "payment_intent": "pi_a", "paid": True, "status": "succeeded", "currency": "usd",
        "amount": 7100, "balance_transaction": {"fee": 230}}
    old = {**charge, "id": "ch_old", "payment_intent": "pi_old"}
    sessions = {"pi_a": {"id": "cs_a", "total_details": {"amount_tax": 200}, "metadata": {"offer_slug": "card-blueprint-app"}},
        "pi_old": {"id": "cs_old", "metadata": {"offer_slug": "deep-dive"}}}
    report = summarize([charge], [({"status": "succeeded", "amount": 1300}, old)], sessions, set(), set())
    assert report["attributed_revenue_after_refunds_cents"] == 5600  # refund of an older order still counts
    assert report["attributed_after_payment_fees_cents"] == 5370
    assert summarize([charge], [], sessions, {"cs_a"}, set())["attributed_revenue_after_refunds_cents"] == 0
    assert summarize([{**charge, "paid": False}], [], sessions, set(), set())["offers"] == {}
    print("PASS: complete pagination, tax exclusion, cross-period refunds, fees, owner/test and unpaid exclusion")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--end", help="Exclusive UTC date, YYYY-MM-DD; omit for current time")
    parser.add_argument("--exclude-session", action="append", default=[])
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if not 1 <= args.days <= 90:
        parser.error("days must be between 1 and 90")
    auth = stripe("whoami", "--format", "json")
    if not auth.get("authenticated") or auth.get("account_id") != ACCOUNT:
        raise RuntimeError("Refusing revenue from an account other than Card Blueprint")
    end = int(dt.datetime.fromisoformat(args.end).replace(tzinfo=dt.timezone.utc).timestamp()) if args.end else int(time.time())
    start = end - args.days * 86400
    params = ["-d", f"created[gte]={start}", "-d", f"created[lt]={end}"]
    charges = list(pages("/v1/charges", [*params, "-e", "data.balance_transaction"]))
    by_id = {c["id"]: c for c in charges}
    refunds = []
    for refund in pages("/v1/refunds", params):
        cid = refund.get("charge")
        if cid not in by_id:
            by_id[cid] = stripe("get", cid, "--live")
        refunds.append((refund, by_id[cid]))
    sessions = {}
    for intent in {c.get("payment_intent") for c in by_id.values()} - {None}:
        matches = list(pages("/v1/checkout/sessions", ["-d", f"payment_intent={intent}"]))
        if len(matches) > 1:
            raise RuntimeError("Ambiguous payment-to-session mapping; refusing revenue attribution")
        if matches:
            sessions[intent] = matches[0]
    owners = {x.strip().lower() for x in os.environ.get("REVENUE_OWNER_EMAILS", "").split(",") if x.strip()}
    report = summarize(charges, refunds, sessions, set(args.exclude_session), owners)
    report.update(account=ACCOUNT, livemode=True, currency="usd", complete_pagination=True,
        start_utc=dt.datetime.fromtimestamp(start,dt.timezone.utc).isoformat(),
        end_utc_exclusive=dt.datetime.fromtimestamp(end,dt.timezone.utc).isoformat(),
        owner_exclusion_configured=bool(owners or args.exclude_session),
        limits=["Cash window uses charge/refund timestamps; unpaid and zero-dollar sessions are not revenue.",
            "Unattributed account payments are reported separately and excluded from the site target.",
            "Refund amounts are subtracted in full; tax-inclusive refunds make this conservative.",
            "Payment fees are charge fees, not a full balance-transaction accounting of fee credits or disputes.",
            "Hosting, generation costs, owner time and unmarked owner tests remain unverified."])
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
