from __future__ import annotations

from pathlib import Path

from pipeline.wikipedia_summary import iter_title_rows, parse_summary

FIXTURES = Path(__file__).resolve().parents[1] / "data" / "fixtures"


def test_parse_summary_extracts_source_fields() -> None:
    payload = {
        "title": "Ada Fixture",
        "extract": "Synthetic fixture used only for schema tests.",
        "description": "synthetic fixture mathematician",
        "content_urls": {
            "desktop": {"page": "https://example.test/wiki/Ada_Fixture"}
        },
    }
    parsed = parse_summary(payload)
    assert parsed["source_text"] == "Synthetic fixture used only for schema tests."
    assert parsed["source_url"] == "https://example.test/wiki/Ada_Fixture"
    assert parsed["description"] == "synthetic fixture mathematician"


def test_iter_title_rows_reads_seed_psv() -> None:
    rows = iter_title_rows(titles_path=FIXTURES / "wikidata_people_raw.psv")
    assert rows[0] == ("Q0FIX1", "Ada Fixture")
    assert {qid for qid, _title in rows} == {"Q0FIX1", "Q0FIX2", "Q0FIX3", "Q0FIX4"}


def test_iter_title_rows_uses_name_on_five_column_psv(tmp_path: Path) -> None:
    path = tmp_path / "wikidata_people_raw.psv"
    path.write_text(
        "name|birth_year|birth_month|birth_day|enwiki_views_8mo\n"
        "Ada Fixture|1991|2|17|100\n",
        encoding="utf-8",
    )
    assert iter_title_rows(titles_path=path) == [(None, "Ada Fixture")]


def test_iter_title_rows_reads_jsonl(tmp_path: Path) -> None:
    path = tmp_path / "titles.jsonl"
    path.write_text('{"qid":"Q1","enwiki_title":"Ada Lovelace"}\n', encoding="utf-8")
    assert iter_title_rows(titles_path=path) == [("Q1", "Ada Lovelace")]
