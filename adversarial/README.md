# Adversarial birth-card table (Day 0 WP2)

Independent second implementation of the 366-day birth-card table. This folder is isolated on purpose.

**Do not import pipeline, hermes, app, or any in-repo helper code.** If those files exist elsewhere in the repo, ignore them. This table is generated only from the formula below.

## Formula

```
solar_value = 55 − (2 × month + day)
if solar_value ≤ 0: Joker
deck order: 1=A♥ … 13=K♥, 14=A♣ … 26=K♣, 27=A♦ … 39=K♦, 40=A♠ … 52=K♠
card = deck[solar_value]
```

Cass lock D1: Dec 31 must be **Joker** (not K♠). The formula yields `solar_value = 0` on 12-31, which maps to Joker.

## Spot checks

- Jan 1 → K♠
- Jan 29 → J♣
- Sep 5 → 6♦
- Feb 29 → 9♣
- Dec 31 → Joker

## How to regenerate

From this directory, with Python 3 (stdlib only — no extra packages):

```bash
cd adversarial
python3 birthcard_table.py
python3 test_birthcard_table.py
```

`birthcard_table.py` writes `birthcard_table.csv` (header `mm-dd,card` plus 366 calendar rows, including Feb 29) and asserts the spot checks before writing.

The generator and test import only the Python standard library and each other. They must not import anything from `app/`, `lib/`, `scripts/`, or other project packages.
