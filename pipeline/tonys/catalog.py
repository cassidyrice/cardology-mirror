"""Scope and Wikipedia sources for Tony leading-acting categories."""

from __future__ import annotations

TONY_HOME_URL = "https://www.tonyawards.com/"
TONY_WINNERS_URL = "https://www.tonyawards.com/winners/"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

# Official current names are “Best Performance by a Leading …”.
# Wikipedia list titles are the stable public tables used here.
CATEGORIES: tuple[dict[str, str], ...] = (
    {
        "key": "actor_play",
        "label": "Best Actor in a Play",
        "official": "Best Performance by a Leading Actor in a Play",
        "medium": "play",
        "wikipedia_title": "Tony Award for Best Actor in a Play",
    },
    {
        "key": "actress_play",
        "label": "Best Actress in a Play",
        "official": "Best Performance by a Leading Actress in a Play",
        "medium": "play",
        "wikipedia_title": "Tony Award for Best Actress in a Play",
    },
    {
        "key": "actor_musical",
        "label": "Best Actor in a Musical",
        "official": "Best Performance by a Leading Actor in a Musical",
        "medium": "musical",
        "wikipedia_title": "Tony Award for Best Actor in a Musical",
    },
    {
        "key": "actress_musical",
        "label": "Best Actress in a Musical",
        "official": "Best Performance by a Leading Actress in a Musical",
        "medium": "musical",
        "wikipedia_title": "Tony Award for Best Actress in a Musical",
    },
)

CATEGORY_BY_KEY = {row["key"]: row for row in CATEGORIES}

# Featured Actor/Actress (play + musical), direction, design, and special
# Tonys are out of scope. 1985 leading musical acting categories were not
# awarded. There was no separate 2021 ceremony (74th listed as 2020).
SCOPE_NOTE = (
    "Leading Actor and Leading Actress only, play and musical "
    "(four categories). Featured acting and non-acting Tonys are omitted."
)


def wikipedia_list_url(title: str) -> str:
    return "https://en.wikipedia.org/wiki/" + title.replace(" ", "_")


def category_full(key: str) -> str:
    row = CATEGORY_BY_KEY[key]
    return f"Tony Award for {row['label']}"
