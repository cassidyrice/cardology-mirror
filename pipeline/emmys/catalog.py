"""Primetime Emmy Lead Actor / Lead Actress catalog — identity only, not dates.

Scope (standard Wikipedia lineage lists):

* Outstanding Lead Actor in a Drama Series
* Outstanding Lead Actress in a Drama Series
* Outstanding Lead Actor in a Comedy Series
* Outstanding Lead Actress in a Comedy Series

Out of scope: Supporting Actor/Actress; Limited/Anthology Series or Movie as
its own category; Guest Actor/Actress; Daytime Emmys; International Emmys;
News / Sports / Creative Arts. Pre-1966 ceremonies were not genre-specific
and appear on both drama and comedy lineage pages — those wins are kept once
and labeled ``pre_genre_split``. Wikipedia marks some historical Lead-category
wins as miniseries/TV film (#) or guest (§); those are kept with a note
because they won the Lead Actor/Actress category that year.

Official award authority: Academy of Television Arts & Sciences (emmys.com).
Winner tables: the four Wikipedia lists below. Dates never come from this
module.
"""

from __future__ import annotations

from typing import TypedDict

EMMYS_HOME = "https://www.emmys.com/"
ATAS_NAME = "Academy of Television Arts & Sciences"
PRE_SPLIT_LAST_YEAR = 1965

# Wikipedia gold highlight used for winners on these four lists.
WINNER_BG = "FAEB86"


class EmmyCategory(TypedDict):
    id: str
    genre: str
    acting: str
    label: str
    category_full: str
    wikipedia_title: str
    wikipedia_url: str


CATEGORIES: tuple[EmmyCategory, ...] = (
    {
        "id": "drama_actor",
        "genre": "drama",
        "acting": "actor",
        "label": "Lead Actor in a Drama Series",
        "category_full": "Primetime Emmy Award for Outstanding Lead Actor in a Drama Series",
        "wikipedia_title": "Primetime Emmy Award for Outstanding Lead Actor in a Drama Series",
        "wikipedia_url": (
            "https://en.wikipedia.org/wiki/"
            "Primetime_Emmy_Award_for_Outstanding_Lead_Actor_in_a_Drama_Series"
        ),
    },
    {
        "id": "drama_actress",
        "genre": "drama",
        "acting": "actress",
        "label": "Lead Actress in a Drama Series",
        "category_full": "Primetime Emmy Award for Outstanding Lead Actress in a Drama Series",
        "wikipedia_title": "Primetime Emmy Award for Outstanding Lead Actress in a Drama Series",
        "wikipedia_url": (
            "https://en.wikipedia.org/wiki/"
            "Primetime_Emmy_Award_for_Outstanding_Lead_Actress_in_a_Drama_Series"
        ),
    },
    {
        "id": "comedy_actor",
        "genre": "comedy",
        "acting": "actor",
        "label": "Lead Actor in a Comedy Series",
        "category_full": "Primetime Emmy Award for Outstanding Lead Actor in a Comedy Series",
        "wikipedia_title": "Primetime Emmy Award for Outstanding Lead Actor in a Comedy Series",
        "wikipedia_url": (
            "https://en.wikipedia.org/wiki/"
            "Primetime_Emmy_Award_for_Outstanding_Lead_Actor_in_a_Comedy_Series"
        ),
    },
    {
        "id": "comedy_actress",
        "genre": "comedy",
        "acting": "actress",
        "label": "Lead Actress in a Comedy Series",
        "category_full": "Primetime Emmy Award for Outstanding Lead Actress in a Comedy Series",
        "wikipedia_title": "Primetime Emmy Award for Outstanding Lead Actress in a Comedy Series",
        "wikipedia_url": (
            "https://en.wikipedia.org/wiki/"
            "Primetime_Emmy_Award_for_Outstanding_Lead_Actress_in_a_Comedy_Series"
        ),
    },
)

CATEGORY_BY_ID: dict[str, EmmyCategory] = {row["id"]: row for row in CATEGORIES}

LIST_STOP_HEADINGS = (
    "multiple wins",
    "multiple nominations",
    "programs with multiple",
    "performers with multiple",
    "see also",
    "references",
    "notes",
    "external links",
)
