from __future__ import annotations

from pipeline.wikipedia_summary import parse_summary


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
