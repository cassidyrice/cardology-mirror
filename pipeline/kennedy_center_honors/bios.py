"""Parse day-precision birth dates from Kennedy Center artist/honors HTML.

Kennedy Center pages are citation/identity pages. They rarely publish a
day-precision DOB. When they do, a conflict with Wikipedia/Wikidata drops
the person. Year-only values are never expanded into a day.
"""

from __future__ import annotations

from pipeline.pulitzer_fiction.bios import parse_free_date, parse_pulitzer_html, parse_wikipedia_birth_field

parse_kc_html = parse_pulitzer_html

__all__ = ["parse_free_date", "parse_kc_html", "parse_wikipedia_birth_field"]
