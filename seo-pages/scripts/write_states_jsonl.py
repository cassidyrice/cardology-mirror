#!/usr/bin/env python3
"""Write seo-pages/data/states.jsonl from the locked CRS R47747 Table 1 dates.

Dates are not invented. Table 1 was read from:
https://www.congress.gov/crs-product/R47747
https://www.congress.gov/crs_external_products/R/PDF/R47747/R47747.16.pdf

Secondary check: Wikipedia “List of U.S. states by date of admission to the Union”.
Optional Wikidata P571 check used REST wbgetentities (no SPARQL).
"""

from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "states.jsonl"

# (order, slug, name, postal, iso, kind, qid, extra_p571, disputed)
# kind: ratification = original 13 Constitution dates; admission = later states.
ROWS: list[tuple] = [
    (1, "delaware", "Delaware", "DE", "1787-12-07", "ratification", "Q1393", (), None),
    (2, "pennsylvania", "Pennsylvania", "PA", "1787-12-12", "ratification", "Q1400", (), None),
    (3, "new-jersey", "New Jersey", "NJ", "1787-12-18", "ratification", "Q1408", ("1776-07-04",), None),
    (4, "georgia", "Georgia", "GA", "1788-01-02", "ratification", "Q1428", (), None),
    (5, "connecticut", "Connecticut", "CT", "1788-01-09", "ratification", "Q779", (), None),
    (6, "massachusetts", "Massachusetts", "MA", "1788-02-06", "ratification", "Q771", (), None),
    (7, "maryland", "Maryland", "MD", "1788-04-28", "ratification", "Q1391", (), None),
    (8, "south-carolina", "South Carolina", "SC", "1788-05-23", "ratification", "Q1456", (), None),
    (9, "new-hampshire", "New Hampshire", "NH", "1788-06-21", "ratification", "Q759", (), None),
    (10, "virginia", "Virginia", "VA", "1788-06-25", "ratification", "Q1370", (), None),
    (11, "new-york", "New York", "NY", "1788-07-26", "ratification", "Q1384", (), None),
    (12, "north-carolina", "North Carolina", "NC", "1789-11-21", "ratification", "Q1454", (), None),
    (13, "rhode-island", "Rhode Island", "RI", "1790-05-29", "ratification", "Q1387", (), None),
    (14, "vermont", "Vermont", "VT", "1791-03-04", "admission", "Q16551", (), None),
    (15, "kentucky", "Kentucky", "KY", "1792-06-01", "admission", "Q1603", (), None),
    (16, "tennessee", "Tennessee", "TN", "1796-06-01", "admission", "Q1509", (), None),
    (17, "ohio", "Ohio", "OH", "1803-03-01", "admission", "Q1397", (), "ohio-1953"),
    (18, "louisiana", "Louisiana", "LA", "1812-04-30", "admission", "Q1588", (), None),
    (19, "indiana", "Indiana", "IN", "1816-12-11", "admission", "Q1415", (), None),
    (20, "mississippi", "Mississippi", "MS", "1817-12-10", "admission", "Q1494", (), None),
    (21, "illinois", "Illinois", "IL", "1818-12-03", "admission", "Q1204", (), None),
    (22, "alabama", "Alabama", "AL", "1819-12-14", "admission", "Q173", (), None),
    (23, "maine", "Maine", "ME", "1820-03-15", "admission", "Q724", (), None),
    (24, "missouri", "Missouri", "MO", "1821-08-10", "admission", "Q1581", (), None),
    (25, "arkansas", "Arkansas", "AR", "1836-06-15", "admission", "Q1612", (), None),
    (26, "michigan", "Michigan", "MI", "1837-01-26", "admission", "Q1166", (), None),
    (27, "florida", "Florida", "FL", "1845-03-03", "admission", "Q812", (), None),
    (28, "texas", "Texas", "TX", "1845-12-29", "admission", "Q1439", (), None),
    (29, "iowa", "Iowa", "IA", "1846-12-28", "admission", "Q1546", (), None),
    (30, "wisconsin", "Wisconsin", "WI", "1848-05-29", "admission", "Q1537", (), None),
    (31, "california", "California", "CA", "1850-09-09", "admission", "Q99", (), None),
    (32, "minnesota", "Minnesota", "MN", "1858-05-11", "admission", "Q1527", (), None),
    (33, "oregon", "Oregon", "OR", "1859-02-14", "admission", "Q824", (), None),
    (34, "kansas", "Kansas", "KS", "1861-01-29", "admission", "Q1558", (), None),
    (35, "west-virginia", "West Virginia", "WV", "1863-06-20", "admission", "Q1371", (), None),
    (36, "nevada", "Nevada", "NV", "1864-10-31", "admission", "Q1227", (), None),
    (37, "nebraska", "Nebraska", "NE", "1867-03-01", "admission", "Q1553", (), None),
    (38, "colorado", "Colorado", "CO", "1876-08-01", "admission", "Q1261", (), None),
    (39, "north-dakota", "North Dakota", "ND", "1889-11-02", "admission", "Q1207", (), None),
    (40, "south-dakota", "South Dakota", "SD", "1889-11-02", "admission", "Q1211", (), None),
    (41, "montana", "Montana", "MT", "1889-11-08", "admission", "Q1212", (), None),
    (42, "washington", "Washington", "WA", "1889-11-11", "admission", "Q1223", (), None),
    (43, "idaho", "Idaho", "ID", "1890-07-03", "admission", "Q1221", (), None),
    (44, "wyoming", "Wyoming", "WY", "1890-07-10", "admission", "Q1214", (), None),
    (45, "utah", "Utah", "UT", "1896-01-04", "admission", "Q829", (), None),
    (46, "oklahoma", "Oklahoma", "OK", "1907-11-16", "admission", "Q1649", (), None),
    (47, "new-mexico", "New Mexico", "NM", "1912-01-06", "admission", "Q1522", ("1850-09-09", "1598-07"), None),
    (48, "arizona", "Arizona", "AZ", "1912-02-14", "admission", "Q816", (), None),
    (49, "alaska", "Alaska", "AK", "1959-01-03", "admission", "Q797", (), None),
    (50, "hawaii", "Hawaii", "HI", "1959-08-21", "admission", "Q782", (), None),
]

OHIO_DISPUTED = (
    "Wikipedia notes that Congress did not set a formal Ohio statehood date until "
    "1953, when Pub. L. 83–204 designated March 1, 1803. CRS R47747 Table 1 uses "
    "March 1, 1803, which is the date this dataset maps."
)


def main() -> None:
    assert len(ROWS) == 50
    slugs = [row[1] for row in ROWS]
    assert len(set(slugs)) == 50
    OUT.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    for order, slug, name, postal, iso, kind, qid, extra, disputed in ROWS:
        record = {
            "slug": slug,
            "name": name,
            "postal": postal,
            "admission_order": order,
            "admission_date": iso,
            "date_kind": kind,
            "original_thirteen": kind == "ratification",
            "wikipedia_list": "List of U.S. states by date of admission to the Union",
            "wikidata_qid": qid,
            "wikidata_p571_iso": iso,
            "wikidata_p571_extra": list(extra),
            "disputed_date": OHIO_DISPUTED if disputed == "ohio-1953" else None,
            "crs_report": "R47747",
            "crs_table": "Table 1",
            "crs_pdf": "https://www.congress.gov/crs_external_products/R/PDF/R47747/R47747.16.pdf",
            "crs_html": "https://www.congress.gov/crs-product/R47747",
            "wikipedia_list_url": (
                "https://en.wikipedia.org/wiki/List_of_U.S._states_by_date_of_admission_to_the_Union"
            ),
        }
        lines.append(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(lines)} rows → {OUT}")


if __name__ == "__main__":
    main()
