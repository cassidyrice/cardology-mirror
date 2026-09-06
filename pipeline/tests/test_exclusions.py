"""D3 description block + age / precision / year exclusions."""

from __future__ import annotations

from datetime import date

from pipeline.exclusions import ExclusionReason, classify_person


TODAY = date(2026, 9, 6)


def _base(**overrides: object) -> dict:
    row = {
        "qid": "Q0FIX1",
        "name": "Ada Fixture",
        "description": "English mathematician and writer",
        "birth_date": "1991-02-17",
        "birth_year": 1991,
        "precision": 11,
        "wikipedia_description": "English mathematician and writer",
    }
    row.update(overrides)
    return row


def test_keeps_ordinary_adult() -> None:
    assert classify_person(_base(), today=TODAY) is None


def test_d3_description_keywords_are_case_insensitive() -> None:
    for phrase in (
        "American serial killer",
        "Convicted Murderer",
        "listed as a TERRORIST",
        "former dictator of a state",
    ):
        reason = classify_person(
            _base(wikipedia_description=phrase, description="writer"),
            today=TODAY,
        )
        assert reason == ExclusionReason.DESCRIPTION_KEYWORD, phrase


def test_d3_does_not_trip_on_murder_without_murderer() -> None:
    assert (
        classify_person(
            _base(wikipedia_description="author of a murder mystery"),
            today=TODAY,
        )
        is None
    )


def test_excludes_minors() -> None:
    reason = classify_person(_base(birth_date="2010-01-01", birth_year=2010), today=TODAY)
    assert reason == ExclusionReason.MINOR


def test_excludes_imprecise_birth() -> None:
    reason = classify_person(_base(precision=10), today=TODAY)
    assert reason == ExclusionReason.PRECISION


def test_excludes_birth_year_before_1900() -> None:
    reason = classify_person(
        _base(birth_date="1899-12-31", birth_year=1899),
        today=TODAY,
    )
    assert reason == ExclusionReason.YEAR_BEFORE_1900


def test_manual_blocklist() -> None:
    reason = classify_person(
        _base(qid="Q0BLOCK"),
        today=TODAY,
        blocklist={"Q0BLOCK", "blocked-name"},
    )
    assert reason == ExclusionReason.BLOCKLIST
