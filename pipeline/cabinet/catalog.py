"""Known sitting US Cabinet identifiers — not birth dates.

Sitting identity is the White House cabinet page plus Wikipedia's
Cabinet of the United States (VP + 15 executive-department heads).
Dates always come from each person's Wikipedia infobox birth-date
template and must match Wikidata P569 at day precision. Do not invent extras.
"""

from __future__ import annotations

WHITEHOUSE_CABINET_URL = "https://www.whitehouse.gov/administration/the-cabinet/"
WIKIPEDIA_CABINET_URL = "https://en.wikipedia.org/wiki/Cabinet_of_the_United_States"
WIKIPEDIA_SECOND_CABINET_URL = (
    "https://en.wikipedia.org/wiki/Second_cabinet_of_Donald_Trump"
)

# Presidential succession order among VP + 15 department heads.
# QIDs and enwiki titles are identifiers only.
SITTING_CABINET: tuple[dict[str, object], ...] = (
    {
        "office_id": "vice-president",
        "office": "Vice President",
        "acting": False,
        "name": "JD Vance",
        "slug": "jd-vance",
        "qid": "Q28935729",
        "enwiki_title": "JD Vance",
        "whitehouse_name": "JD Vance",
        "succession": 1,
    },
    {
        "office_id": "state",
        "office": "Secretary of State",
        "acting": False,
        "name": "Marco Rubio",
        "slug": "marco-rubio",
        "qid": "Q324546",
        "enwiki_title": "Marco Rubio",
        "whitehouse_name": "Marco Rubio",
        "succession": 2,
    },
    {
        "office_id": "treasury",
        "office": "Secretary of the Treasury",
        "acting": False,
        "name": "Scott Bessent",
        "slug": "scott-bessent",
        "qid": "Q7435987",
        "enwiki_title": "Scott Bessent",
        "whitehouse_name": "Scott Bessent",
        "succession": 3,
    },
    {
        "office_id": "defense",
        "office": "Secretary of Defense",
        "acting": False,
        "name": "Pete Hegseth",
        "slug": "pete-hegseth",
        "qid": "Q7172014",
        "enwiki_title": "Pete Hegseth",
        "whitehouse_name": "Pete Hegseth",
        "succession": 4,
    },
    {
        "office_id": "attorney-general",
        "office": "Attorney General",
        "acting": False,
        "name": "Todd Blanche",
        "slug": "todd-blanche",
        "qid": "Q125628262",
        "enwiki_title": "Todd Blanche",
        "whitehouse_name": "Todd Blanche",
        "succession": 5,
    },
    {
        "office_id": "interior",
        "office": "Secretary of the Interior",
        "acting": False,
        "name": "Doug Burgum",
        "slug": "doug-burgum",
        "qid": "Q22095395",
        "enwiki_title": "Doug Burgum",
        "whitehouse_name": "Doug Burgum",
        "succession": 6,
    },
    {
        "office_id": "agriculture",
        "office": "Secretary of Agriculture",
        "acting": False,
        "name": "Brooke Rollins",
        "slug": "brooke-rollins",
        "qid": "Q4974474",
        "enwiki_title": "Brooke Rollins",
        "whitehouse_name": "Brooke Rollins",
        "succession": 7,
    },
    {
        "office_id": "commerce",
        "office": "Secretary of Commerce",
        "acting": False,
        "name": "Howard Lutnick",
        "slug": "howard-lutnick",
        "qid": "Q16194176",
        "enwiki_title": "Howard Lutnick",
        "whitehouse_name": "Howard Lutnick",
        "succession": 8,
    },
    {
        "office_id": "labor",
        "office": "Secretary of Labor",
        "acting": True,
        "name": "Keith Sonderling",
        "slug": "keith-sonderling",
        "qid": "Q73030183",
        "enwiki_title": "Keith Sonderling",
        "whitehouse_name": "Keith E. Sonderling",
        "succession": 9,
    },
    {
        "office_id": "hhs",
        "office": "Secretary of Health and Human Services",
        "acting": False,
        "name": "Robert F. Kennedy Jr.",
        "slug": "robert-f-kennedy-jr",
        "qid": "Q1352872",
        "enwiki_title": "Robert F. Kennedy Jr.",
        "whitehouse_name": "Robert F. Kennedy, Jr.",
        "succession": 10,
    },
    {
        "office_id": "hud",
        "office": "Secretary of Housing and Urban Development",
        "acting": False,
        "name": "Scott Turner",
        "slug": "scott-turner",
        "qid": "Q7437419",
        "enwiki_title": "Scott Turner (politician)",
        "whitehouse_name": "Scott Turner",
        "succession": 11,
    },
    {
        "office_id": "transportation",
        "office": "Secretary of Transportation",
        "acting": False,
        "name": "Sean Duffy",
        "slug": "sean-duffy",
        "qid": "Q1729888",
        "enwiki_title": "Sean Duffy",
        "whitehouse_name": "Sean Duffy",
        "succession": 12,
    },
    {
        "office_id": "energy",
        "office": "Secretary of Energy",
        "acting": False,
        "name": "Chris Wright",
        "slug": "chris-wright",
        "qid": "Q131225840",
        "enwiki_title": "Chris Wright",
        "whitehouse_name": "Chris Wright",
        "succession": 13,
    },
    {
        "office_id": "education",
        "office": "Secretary of Education",
        "acting": False,
        "name": "Linda McMahon",
        "slug": "linda-mcmahon",
        "qid": "Q233905",
        "enwiki_title": "Linda McMahon",
        "whitehouse_name": "Linda McMahon",
        "succession": 14,
    },
    {
        "office_id": "veterans-affairs",
        "office": "Secretary of Veterans Affairs",
        "acting": False,
        "name": "Doug Collins",
        "slug": "doug-collins",
        "qid": "Q3162841",
        "enwiki_title": "Doug Collins (politician)",
        "whitehouse_name": "Doug Collins",
        "succession": 15,
    },
    {
        "office_id": "homeland-security",
        "office": "Secretary of Homeland Security",
        "acting": False,
        "name": "Markwayne Mullin",
        "slug": "markwayne-mullin",
        "qid": "Q3448772",
        "enwiki_title": "Markwayne Mullin",
        "whitehouse_name": "Markwayne Mullin",
        "succession": 16,
    },
)

SITTING_QIDS: tuple[str, ...] = tuple(str(row["qid"]) for row in SITTING_CABINET)
SITTING_SLUGS: tuple[str, ...] = tuple(str(row["slug"]) for row in SITTING_CABINET)
SITTING_OFFICE_IDS: tuple[str, ...] = tuple(str(row["office_id"]) for row in SITTING_CABINET)
SITTING_ENWIKI_TITLES: tuple[str, ...] = tuple(str(row["enwiki_title"]) for row in SITTING_CABINET)
SITTING_BY_SLUG: dict[str, dict[str, object]] = {str(row["slug"]): row for row in SITTING_CABINET}
