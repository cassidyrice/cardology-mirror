"""Citation and coordinate copy for existing celeb blog profiles."""

from __future__ import annotations

import re
from datetime import date

from pipeline.birthcard import birth_card_from_iso

SENTENCE_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9“\"])")

SOURCES_HEADING = "Public date sources"
EVIDENCE_HEADING = "From the Wikipedia summary"
DATE_FAQ_Q = "Where does {name}'s birth date come from?"
FORTUNE_FAQ_Q = "Does this profile predict {name}'s future?"


def split_source_sentences(source_text: str) -> list[str]:
    return [
        part.strip()
        for part in SENTENCE_RE.split(source_text or "")
        if part.strip()
    ]


def evidence_from_summary(source_text: str, wikipedia_title: str) -> list[str]:
    sentences = split_source_sentences(source_text)
    evidence = sentences[:3]
    if len(evidence) >= 3:
        return evidence
    if not evidence and source_text.strip():
        evidence = [source_text.strip()]
    if len(evidence) < 2:
        evidence.append(
            f"Wikipedia REST summary ({wikipedia_title}) is the only biographical prose used here."
        )
    if len(evidence) < 3:
        evidence.append(
            "No extra biographical facts were written for this page beyond that summary."
        )
    return evidence[:3]


def human_date(iso: str) -> str:
    year, month, day = (int(part) for part in iso.split("-"))
    return date(year, month, day).strftime("%B %-d, %Y").replace(" 0", " ")


def card_label(iso: str) -> str:
    code = birth_card_from_iso(iso)
    if code == "Joker":
        return "Joker"
    rank = code[:-1]
    suit = code[-1]
    rank_name = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}.get(rank, rank)
    suit_name = {"♥": "Hearts", "♣": "Clubs", "♦": "Diamonds", "♠": "Spades"}[suit]
    return f"{rank_name} of {suit_name}"


def sources_body(row: dict) -> list[str]:
    human = human_date(row["birth_date"])
    card = card_label(row["birth_date"])
    return [
        (
            f"Birth date {row['birth_date']} ({human}) is Wikidata P569 "
            f"({row['qid']}, CC0, day precision, Gregorian preferred), matching the "
            f"English Wikipedia article {row['wikipedia_title']}. "
            f"The birth card for that month and day is the {card} — a calendar "
            "coordinate, not a forecast and not a biography."
        ),
        (
            "Year-only dates and Wikipedia↔Wikidata conflicts are dropped, not guessed. "
            "Page evidence is a near-verbatim span of the Wikipedia REST summary "
            "(CC BY-SA 4.0). No extra biographical facts were written."
        ),
    ]


def conflict_body(row: dict) -> list[str]:
    dates = row.get("wikidata_dates") or []
    listed = " and ".join(dates) if dates else "more than one day"
    return [
        (
            f"Wikidata P569 lists more than one day-precision date for {row['name']} "
            f"({listed}). Card Blueprints does not pick a day. Dropped, not guessed."
        ),
        (
            "This page stays up as an already-published teaching example. "
            "It is not a verified public-date citation and is not fortune-telling."
        ),
    ]


def date_faq(row: dict) -> dict[str, str]:
    return {
        "q": DATE_FAQ_Q.format(name=row["name"]),
        "a": (
            f"Birth date {row['birth_date']} is Wikidata P569 "
            f"({row['qid']}, CC0, day precision, Gregorian preferred), "
            f"matching English Wikipedia ({row['wikipedia_title']}). "
            "The two sources match. Conflicts are dropped, not guessed."
        ),
    }


def fortune_faq(name: str) -> dict[str, str]:
    return {
        "q": FORTUNE_FAQ_Q.format(name=name),
        "a": (
            "No. These pages are coordinates, not fortune-telling. "
            "A birth card names a calendar day in a 52-card year. "
            "It does not forecast character, career, or fate."
        ),
    }


def coordinate_note() -> str:
    return (
        "A birth card is a calendar coordinate for the month and day. "
        "It is not fortune-telling and does not predict a life."
    )
