"""366 public calendar days for /born-on/{month}-{day} (includes February 29)."""

from __future__ import annotations

from calendar import monthrange

MONTH_SLUGS = (
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
)


def month_slug(month: int) -> str:
    if not 1 <= month <= 12:
        raise ValueError(f"month out of range: {month}")
    return MONTH_SLUGS[month - 1]


def day_slug(month: int, day: int) -> str:
    return f"{month_slug(month)}-{day}"


def day_label(month: int, day: int) -> str:
    return f"{month_slug(month).title()} {day}"


def calendar_days() -> list[tuple[int, int]]:
    """Every month-day that has a live /born-on page, including February 29."""
    days: list[tuple[int, int]] = []
    for month in range(1, 13):
        # Leap-year February so February 29 is included once.
        last = 29 if month == 2 else monthrange(2024, month)[1]
        for day in range(1, last + 1):
            days.append((month, day))
    if len(days) != 366:
        raise RuntimeError(f"expected 366 calendar days, got {len(days)}")
    if (2, 29) not in days:
        raise RuntimeError("February 29 missing from the born-on calendar")
    if (12, 31) not in days:
        raise RuntimeError("December 31 missing from the born-on calendar")
    return days
