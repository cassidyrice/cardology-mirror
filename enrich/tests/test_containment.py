"""source_text containment is fuzzy and rejects invented facts."""

from __future__ import annotations

from enrich.containment import containment_score, fact_is_contained


SOURCE = (
    "Charles James Kirk was an American right-wing political activist, "
    "entrepreneur, and media personality. He co-founded Turning Point USA in 2012."
)


def test_exact_substring_is_contained() -> None:
    ok, score = fact_is_contained(
        "Charles James Kirk was an American right-wing political activist",
        SOURCE,
    )
    assert ok
    assert score == 1.0


def test_case_and_whitespace_are_ignored() -> None:
    ok, score = fact_is_contained(
        "  CHARLES   JAMES KIRK was an American  ",
        SOURCE,
    )
    assert ok
    assert score == 1.0


def test_near_copy_passes_threshold() -> None:
    score = containment_score(
        "Charles James Kirk was an American right-wing political activist and entrepreneur",
        SOURCE,
    )
    assert score >= 0.85


def test_invented_fact_is_rejected() -> None:
    ok, score = fact_is_contained(
        "He won an Olympic gold medal in figure skating in 2018.",
        SOURCE,
    )
    assert not ok
    assert score < 0.85


def test_empty_fact_is_rejected() -> None:
    ok, score = fact_is_contained("", SOURCE)
    assert not ok
    assert score == 0.0
