"""366-day birth-card parity vs the in-repo engine / optional hermes.py.

hermes.py is not in this repository. These tests compare against
``lib/engine-core/engine_data.js`` ``SOLAR_TO_CARD`` plus the spread-engine
wrap (``solar_value <= 0`` → ``+52``), which maps Dec 31 → K♠.

D1 (locked): this pipeline maps Dec 31 → Joker and must never emit K♠ for
that date. The Dec 31 case is therefore an intentional disagreement with
hermes / ``engine.js`` ``getBirthCard``. If a local ``hermes.py`` is present
and also returns Joker, the disagreement flag below is skipped.

Lineage note (elsewhere than the mapping): the published spread engine wraps
solar 0 to 52 so Year-0 grids stay 52-wide; SEO/public birth-card pages use
the Joker boundary instead.
"""

from __future__ import annotations

import calendar
import importlib.util
import json
import os
import re
from collections.abc import Callable
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card, solar_value

REPO_ROOT = Path(__file__).resolve().parents[2]
ENGINE_DATA = REPO_ROOT / "lib" / "engine-core" / "engine_data.js"
LEAP_YEAR = 2024

_SOLAR_TO_CARD_RE = re.compile(r"const SOLAR_TO_CARD = (\{.*?\});", re.DOTALL)


def _engine_solar_to_card() -> dict[str, str]:
    text = ENGINE_DATA.read_text(encoding="utf-8")
    match = _SOLAR_TO_CARD_RE.search(text)
    assert match, "SOLAR_TO_CARD not found in engine_data.js"
    return json.loads(match.group(1))


def _engine_wrapped_card(month: int, day: int) -> str:
    """Spread-engine getBirthCard: wrap solar_value <= 0 by +52."""
    sv = 55 - (2 * month + day)
    if sv <= 0:
        sv += 52
    return _engine_solar_to_card()[str(sv)]


def _load_hermes_fn() -> Callable[[int, int], str] | None:
    candidates: list[Path] = []
    env = os.environ.get("HERMES_PY")
    if env:
        candidates.append(Path(env))
    candidates.extend(
        [
            REPO_ROOT / "hermes.py",
            REPO_ROOT / "pipeline" / "hermes.py",
            REPO_ROOT / "scripts" / "hermes.py",
        ]
    )
    for path in candidates:
        if not path.is_file():
            continue
        spec = importlib.util.spec_from_file_location("hermes_ref", path)
        if spec is None or spec.loader is None:
            continue
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for name in ("birth_card", "get_birth_card", "birthcard"):
            fn = getattr(module, name, None)
            if callable(fn):
                return fn
    return None


def _calendar_days() -> list[tuple[int, int]]:
    days: list[tuple[int, int]] = []
    for month in range(1, 13):
        last = calendar.monthrange(LEAP_YEAR, month)[1]
        for day in range(1, last + 1):
            days.append((month, day))
    return days


def test_formula_spot_checks() -> None:
    assert birth_card(1, 1) == "K♠"
    assert birth_card(1, 29) == "J♣"
    assert birth_card(9, 5) == "6♦"
    assert birth_card(2, 29) == "9♣"
    assert birth_card(12, 31) == "Joker"


def test_dec_31_is_joker_not_king_of_spades() -> None:
    assert solar_value(12, 31) <= 0
    assert birth_card(12, 31) == "Joker"
    assert birth_card(12, 31) != "K♠"


def test_feb_29_computed_directly() -> None:
    # Do not remap leap day to Feb 28 (Feb 28 is 10♣).
    assert birth_card(2, 29) == "9♣"
    assert birth_card(2, 28) == "10♣"
    assert birth_card(2, 29) != birth_card(2, 28)


@pytest.mark.parametrize(("month", "day"), _calendar_days())
def test_366_day_parity_vs_engine_or_hermes(month: int, day: int) -> None:
    pipeline_card = birth_card(month, day)
    reference = _load_hermes_fn() or _engine_wrapped_card
    ref_card = reference(month, day)

    if month == 12 and day == 31:
        assert pipeline_card == "Joker"
        if ref_card != "Joker":
            # Intentional D1 disagreement with hermes / engine wrap → K♠.
            assert ref_card == "K♠"
        return

    assert pipeline_card == ref_card


def test_all_366_days_are_covered() -> None:
    assert len(_calendar_days()) == 366
