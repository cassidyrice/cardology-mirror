"""Locked 5 U.S.C. § 6103(a) fixed-date federal holidays.

Dates are not invented. Source: Cornell LII text of 5 U.S.C. § 6103(a)
https://www.law.cornell.edu/uscode/text/5/6103

Only holidays that name a calendar month and day are included.
Floating Monday/Thursday holidays are omitted. Weekend observed
shifts in § 6103(b) and OPM calendars are ignored.

Birth cards are computed only by ``pipeline.birthcard`` (D1: Dec 31 = Joker).
Year is unused. None of these five dates is December 31.
"""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.birthcard import birth_card

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JSONL = ROOT / "seo-pages" / "data" / "holidays.jsonl"

USC_CITATION = "5 U.S.C. § 6103(a)"
USC_URL = "https://www.law.cornell.edu/uscode/text/5/6103"
OPM_CALENDARS_URL = "https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"

# Statutory names and dates from § 6103(a). Do not add a year.
FIXED_HOLIDAYS: tuple[tuple[str, str, int, int], ...] = (
    ("new-years-day", "New Year's Day", 1, 1),
    ("juneteenth", "Juneteenth National Independence Day", 6, 19),
    ("independence-day", "Independence Day", 7, 4),
    ("veterans-day", "Veterans Day", 11, 11),
    ("christmas-day", "Christmas Day", 12, 25),
)

# Named in § 6103(a) but not a fixed month-and-day. Do not map.
FLOATING_HOLIDAYS: tuple[tuple[str, str], ...] = (
    ("martin-luther-king-jr-day", "Birthday of Martin Luther King, Jr., the third Monday in January"),
    ("washingtons-birthday", "Washington's Birthday, the third Monday in February"),
    ("memorial-day", "Memorial Day, the last Monday in May"),
    ("labor-day", "Labor Day, the first Monday in September"),
    ("columbus-day", "Columbus Day, the second Monday in October"),
    ("thanksgiving-day", "Thanksgiving Day, the fourth Thursday in November"),
)

# § 6103(c) — not a nationwide § 6103(a) holiday. Do not map.
EXCLUDED_OTHER: tuple[tuple[str, str], ...] = (
    ("inauguration-day", "Inauguration Day, January 20 of each fourth year after 1965 (§ 6103(c) only)"),
)


def holiday_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for slug, name, month, day in FIXED_HOLIDAYS:
        rows.append(
            {
                "slug": slug,
                "name": name,
                "month": month,
                "day": day,
                "card": birth_card(month, day),
                "usc_citation": USC_CITATION,
                "usc_url": USC_URL,
                "opm_calendars_url": OPM_CALENDARS_URL,
                "date_kind": "fixed",
                "observed_shift": "ignored",
            }
        )
    return rows


def write_holidays_jsonl(path: Path | None = None) -> Path:
    out = path or DEFAULT_JSONL
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [json.dumps(row, ensure_ascii=False) for row in holiday_rows()]
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


def main() -> int:
    path = write_holidays_jsonl()
    print(f"Wrote {len(FIXED_HOLIDAYS)} fixed holidays → {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
