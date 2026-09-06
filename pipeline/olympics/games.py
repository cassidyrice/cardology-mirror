"""Known Summer Olympic Games identifiers — not birth dates.

Used to classify P1344 events as Summer (via P361+) versus Winter.
Intercalated 1906, cancelled 1916/1940/1944, Youth Games, and future
editions are omitted. Dates always come from Wikipedia infobox ∩ Wikidata P569.
"""

from __future__ import annotations

# Q14547231 = Summer Olympic Games; labels verified via wbgetentities.
SUMMER_GAMES: dict[str, dict[str, str | int]] = {
    "Q8080": {"year": 1896, "host": "Athens", "label": "1896 Summer Olympics"},
    "Q8088": {"year": 1900, "host": "Paris", "label": "1900 Summer Olympics"},
    "Q8098": {"year": 1904, "host": "St. Louis", "label": "1904 Summer Olympics"},
    "Q8111": {"year": 1908, "host": "London", "label": "1908 Summer Olympics"},
    "Q8118": {"year": 1912, "host": "Stockholm", "label": "1912 Summer Olympics"},
    "Q8128": {"year": 1920, "host": "Antwerp", "label": "1920 Summer Olympics"},
    "Q8132": {"year": 1924, "host": "Paris", "label": "1924 Summer Olympics"},
    "Q8138": {"year": 1928, "host": "Amsterdam", "label": "1928 Summer Olympics"},
    "Q8143": {"year": 1932, "host": "Los Angeles", "label": "1932 Summer Olympics"},
    "Q8150": {"year": 1936, "host": "Berlin", "label": "1936 Summer Olympics"},
    "Q8403": {"year": 1948, "host": "London", "label": "1948 Summer Olympics"},
    "Q8407": {"year": 1952, "host": "Helsinki", "label": "1952 Summer Olympics"},
    "Q8411": {"year": 1956, "host": "Melbourne", "label": "1956 Summer Olympics"},
    "Q8415": {"year": 1960, "host": "Rome", "label": "1960 Summer Olympics"},
    "Q8420": {"year": 1964, "host": "Tokyo", "label": "1964 Summer Olympics"},
    "Q8429": {"year": 1968, "host": "Mexico City", "label": "1968 Summer Olympics"},
    "Q8438": {"year": 1972, "host": "Munich", "label": "1972 Summer Olympics"},
    "Q8444": {"year": 1976, "host": "Montreal", "label": "1976 Summer Olympics"},
    "Q8450": {"year": 1980, "host": "Moscow", "label": "1980 Summer Olympics"},
    "Q8456": {"year": 1984, "host": "Los Angeles", "label": "1984 Summer Olympics"},
    "Q8470": {"year": 1988, "host": "Seoul", "label": "1988 Summer Olympics"},
    "Q8488": {"year": 1992, "host": "Barcelona", "label": "1992 Summer Olympics"},
    "Q8531": {"year": 1996, "host": "Atlanta", "label": "1996 Summer Olympics"},
    "Q8544": {"year": 2000, "host": "Sydney", "label": "2000 Summer Olympics"},
    "Q8558": {"year": 2004, "host": "Athens", "label": "2004 Summer Olympics"},
    "Q8567": {"year": 2008, "host": "Beijing", "label": "2008 Summer Olympics"},
    "Q8577": {"year": 2012, "host": "London", "label": "2012 Summer Olympics"},
    "Q8613": {"year": 2016, "host": "Rio de Janeiro", "label": "2016 Summer Olympics"},
    "Q181278": {"year": 2020, "host": "Tokyo", "label": "2020 Summer Olympics"},
    "Q995653": {"year": 2024, "host": "Paris", "label": "2024 Summer Olympics"},
}

SUMMER_GAME_QIDS: frozenset[str] = frozenset(SUMMER_GAMES)
OLYMPIC_GOLD = "Q15243387"
SUMMER_GAMES_CLASS = "Q14547231"
HUMAN = "Q5"
