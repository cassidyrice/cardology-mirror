"""Retry containment requires near-verbatim source_text spans."""

from __future__ import annotations

from enrich.containment import (
    check_evidence_facts,
    containment_score,
    fact_is_near_verbatim,
)


SOURCE = (
    "Shaivonte Aician Gilgeous-Alexander, also known by his initials SGA, "
    "is a Canadian professional basketball player for the Oklahoma City Thunder "
    "of the National Basketball Association (NBA). He is a four-time NBA All-Star, "
    "a four-time All-NBA First Team member, and two-time NBA Most Valuable Player (MVP)."
)


def test_exact_substring_is_near_verbatim() -> None:
    ok, score = fact_is_near_verbatim(
        "He is a four-time NBA All-Star",
        SOURCE,
    )
    assert ok
    assert score == 1.0


def test_case_and_whitespace_are_ignored() -> None:
    ok, score = fact_is_near_verbatim(
        "  HE   is a four-time   NBA All-Star  ",
        SOURCE,
    )
    assert ok
    assert score == 1.0


def test_trivial_punctuation_is_ignored() -> None:
    ok, score = fact_is_near_verbatim(
        "National Basketball Association NBA",
        SOURCE,
    )
    assert ok
    assert score == 1.0


def test_pronoun_rewrite_is_rejected() -> None:
    ok, score = fact_is_near_verbatim(
        "He is a two-time NBA Most Valuable Player (MVP) and four-time All-NBA First Team member.",
        SOURCE,
    )
    assert not ok
    assert score == 0.0


def test_merged_sentences_are_rejected() -> None:
    ok, score = fact_is_near_verbatim(
        "He is a four-time NBA All-Star and two-time NBA Most Valuable Player (MVP).",
        SOURCE,
    )
    assert not ok
    assert score == 0.0


def test_invented_fact_is_rejected() -> None:
    ok, score = fact_is_near_verbatim(
        "He won an Olympic gold medal in figure skating in 2018.",
        SOURCE,
    )
    assert not ok
    assert score == 0.0


def test_empty_fact_is_rejected() -> None:
    ok, score = fact_is_near_verbatim("", SOURCE)
    assert not ok
    assert score == 0.0


def test_check_evidence_facts_flags_paraphrase() -> None:
    payload = {
        "evidence": [
            {"fact": "He is a four-time NBA All-Star", "trait": "ok"},
            {
                "fact": "He led the Oklahoma City Thunder to an NBA championship and was named Finals MVP.",
                "trait": "invented",
            },
        ]
    }
    details, errors = check_evidence_facts(payload, SOURCE)
    assert details[0]["ok"] is True
    assert details[1]["ok"] is False
    assert any("evidence[1].fact" in err for err in errors)
    assert containment_score(payload["evidence"][1]["fact"], SOURCE) == 0.0
