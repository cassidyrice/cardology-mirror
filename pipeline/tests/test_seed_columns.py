"""--from-seed accepts the documented 5-column celebrity CSV."""

from __future__ import annotations

import csv
from pathlib import Path

import pytest

from pipeline.build_dataset import (
    SEED_CSV_COLUMNS,
    require_seed_csv,
    require_seed_psv,
    validate_seed_csv_columns,
)

HEADER = Path(__file__).resolve().parents[1] / "data" / "seed" / "celebrity_birth_cards.header.csv"
FIXTURE_CSV = Path(__file__).resolve().parents[1] / "data" / "fixtures" / "celebrity_birth_cards.csv"


def test_header_template_has_required_columns() -> None:
    with HEADER.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        validate_seed_csv_columns(reader.fieldnames)
        assert tuple(reader.fieldnames) == SEED_CSV_COLUMNS
        assert list(reader) == []


def test_fixture_csv_uses_same_columns() -> None:
    with FIXTURE_CSV.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        validate_seed_csv_columns(reader.fieldnames)
        rows = list(reader)
    assert {row["name"] for row in rows} == {
        "Ada Fixture",
        "Bea Fixture",
        "Cal Fixture",
        "Dee Fixture",
    }
    assert all(row["birth_card"] for row in rows)
    assert all(row["slug"] for row in rows)


def test_missing_columns_are_rejected() -> None:
    with pytest.raises(SystemExit) as exc:
        validate_seed_csv_columns(["name", "slug"])
    assert "birth_date" in str(exc.value)
    assert "birth_card" in str(exc.value)


def test_require_seed_csv_fails_on_missing_explicit_path(tmp_path: Path) -> None:
    with pytest.raises(SystemExit) as exc:
        require_seed_csv(tmp_path / "missing.csv")
    assert "seed CSV not found" in str(exc.value)


def test_require_seed_psv_fails_on_missing_explicit_path(tmp_path: Path) -> None:
    with pytest.raises(SystemExit) as exc:
        require_seed_psv(tmp_path / "missing.psv")
    assert "seed PSV not found" in str(exc.value)
