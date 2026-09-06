"""Known sitting SCOTUS identifiers — not birth dates.

Dates always come from SCOTUS.gov Current Members biographies at harvest
time, then Wikidata P569 (day precision) must match. Do not invent extras.
"""

from __future__ import annotations

SCOTUS_BIOS_URL = "https://www.supremecourt.gov/about/biographies.aspx"

# Seniority order on the SCOTUS.gov Current Members page (chief first).
# QIDs and enwiki titles are identifiers only.
SITTING_JUSTICES: tuple[dict[str, object], ...] = (
    {
        "slug": "john-g-roberts-jr",
        "name": "John G. Roberts, Jr.",
        "qid": "Q11153",
        "enwiki_title": "John Roberts",
        "role": "Chief Justice of the United States",
        "seniority": 1,
    },
    {
        "slug": "clarence-thomas",
        "name": "Clarence Thomas",
        "qid": "Q11142",
        "enwiki_title": "Clarence Thomas",
        "role": "Associate Justice",
        "seniority": 2,
    },
    {
        "slug": "samuel-a-alito-jr",
        "name": "Samuel A. Alito, Jr.",
        "qid": "Q11138",
        "enwiki_title": "Samuel Alito",
        "role": "Associate Justice",
        "seniority": 3,
    },
    {
        "slug": "sonia-sotomayor",
        "name": "Sonia Sotomayor",
        "qid": "Q11107",
        "enwiki_title": "Sonia Sotomayor",
        "role": "Associate Justice",
        "seniority": 4,
    },
    {
        "slug": "elena-kagan",
        "name": "Elena Kagan",
        "qid": "Q11105",
        "enwiki_title": "Elena Kagan",
        "role": "Associate Justice",
        "seniority": 5,
    },
    {
        "slug": "neil-m-gorsuch",
        "name": "Neil M. Gorsuch",
        "qid": "Q15488345",
        "enwiki_title": "Neil Gorsuch",
        "role": "Associate Justice",
        "seniority": 6,
    },
    {
        "slug": "brett-m-kavanaugh",
        "name": "Brett M. Kavanaugh",
        "qid": "Q4962244",
        "enwiki_title": "Brett Kavanaugh",
        "role": "Associate Justice",
        "seniority": 7,
    },
    {
        "slug": "amy-coney-barrett",
        "name": "Amy Coney Barrett",
        "qid": "Q29863844",
        "enwiki_title": "Amy Coney Barrett",
        "role": "Associate Justice",
        "seniority": 8,
    },
    {
        "slug": "ketanji-brown-jackson",
        "name": "Ketanji Brown Jackson",
        "qid": "Q6395324",
        "enwiki_title": "Ketanji Brown Jackson",
        "role": "Associate Justice",
        "seniority": 9,
    },
)

SITTING_QIDS: tuple[str, ...] = tuple(str(row["qid"]) for row in SITTING_JUSTICES)
SITTING_SLUGS: tuple[str, ...] = tuple(str(row["slug"]) for row in SITTING_JUSTICES)
SITTING_ENWIKI_TITLES: tuple[str, ...] = tuple(str(row["enwiki_title"]) for row in SITTING_JUSTICES)
