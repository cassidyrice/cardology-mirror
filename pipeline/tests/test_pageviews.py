"""Junk-title filters and monthly-top dedupe (no live Wikimedia calls)."""

from __future__ import annotations

from pipeline.pageviews import dedupe_titles, is_junk_title, month_window


def test_junk_titles() -> None:
    junk = [
        "Main_Page",
        "Special:Search",
        "Special:Random",
        "Wikipedia:Featured_articles",
        "File:Example.jpg",
        "Portal:Current_events",
        "Template:Birth_date",
        "Category:Living_people",
        "Help:Contents",
        "Talk:Earth",
        "User:Example",
        "MediaWiki:Common.css",
        "Module:Infobox",
        "Draft:Someone",
        "2024",
        "1999",
        "2024_in_film",
        "Deaths_in_2024",
        "-",
    ]
    for title in junk:
        assert is_junk_title(title), title


def test_kept_titles() -> None:
    keep = [
        "Ada_Lovelace",
        "Playing_card",
        "United_States",
        "The_Office_(American_TV_series)",
    ]
    for title in keep:
        assert not is_junk_title(title), title


def test_dedupe_sums_views_across_months() -> None:
    rows = [
        {"title": "Ada_Lovelace", "views": 10, "year": 2024, "month": 1},
        {"title": "Ada_Lovelace", "views": 7, "year": 2024, "month": 2},
        {"title": "Main_Page", "views": 999, "year": 2024, "month": 1},
        {"title": "Playing_card", "views": 3, "year": 2024, "month": 1},
    ]
    out = dedupe_titles(rows)
    by_title = {row["title"]: row["views"] for row in out}
    assert by_title["Ada_Lovelace"] == 17
    assert by_title["Playing_card"] == 3
    assert "Main_Page" not in by_title


def test_month_window_length() -> None:
    months = month_window(n=8, end_year=2026, end_month=9)
    assert len(months) == 8
    assert months[-1] == (2026, 9)
    assert months[0] == (2026, 2)
