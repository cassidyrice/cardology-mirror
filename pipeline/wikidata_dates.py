"""Shared Wikidata day-precision date picker (moved from the retired presidents pack, 2026-09-07).

Pull day-precision birth/death and US-president terms from a Wikidata entity."""

from __future__ import annotations

from typing import Any

from pipeline.wikidata import _parse_time

US_PRESIDENT_OFFICE = "Q11696"
DAY_PRECISION = 11
GREGORIAN = "Q1985727"
JULIAN = "Q1985786"


def _all_claims(entity: dict, prop: str, *, include_deprecated: bool = False) -> list[dict]:
    claims = entity.get("claims", {}).get(prop, []) or []
    if include_deprecated:
        return list(claims)
    return [claim for claim in claims if claim.get("rank") != "deprecated"]


def _calendar_qid(value: dict) -> str:
    model = str(value.get("calendarmodel") or "")
    return model.rsplit("/", 1)[-1]


def _rank_tuple(claim: dict) -> tuple[int, int]:
    rank = claim.get("rank")
    deprecated = 1 if rank == "deprecated" else 0
    preferred = 0 if rank == "preferred" else 1
    return (deprecated, preferred)


def _mainsnak_value(claim: dict) -> Any:
    snak = claim.get("mainsnak") or {}
    if snak.get("snaktype") != "value":
        return None
    return (snak.get("datavalue") or {}).get("value")


def _qualifier_values(claim: dict, prop: str) -> list[Any]:
    out: list[Any] = []
    for snak in (claim.get("qualifiers") or {}).get(prop, []) or []:
        if snak.get("snaktype") != "value":
            continue
        value = (snak.get("datavalue") or {}).get("value")
        if value is not None:
            out.append(value)
    return out


def _qualifier_time(claim: dict, prop: str) -> str | None:
    for raw in _qualifier_values(claim, prop):
        if not isinstance(raw, dict):
            continue
        parsed = _parse_time(raw)
        if parsed is None:
            continue
        iso, precision = parsed
        if precision >= DAY_PRECISION:
            return iso
        if precision >= 9:
            return iso[:7] if precision == 10 else iso[:4]
    return None


def _qualifier_string(claim: dict, prop: str) -> str | None:
    for raw in _qualifier_values(claim, prop):
        if isinstance(raw, str) and raw.strip():
            return raw.strip()
        if isinstance(raw, dict) and raw.get("id"):
            return str(raw["id"])
    return None


def parse_day_precision_time(entity: dict, prop: str) -> tuple[str, int] | None:
    """Prefer Gregorian day-precision over Julian, even if Julian is preferred-rank.

    Public birth-card coordinates use the New Style calendar day (the date
    Wikipedia lists). Julian P569 values are kept only when no Gregorian
    day-precision claim exists.
    """
    scored: list[tuple[tuple[int, int, int], str, int]] = []
    for claim in _all_claims(entity, prop, include_deprecated=True):
        raw = _mainsnak_value(claim)
        if not isinstance(raw, dict):
            continue
        parsed = _parse_time(raw)
        if parsed is None:
            continue
        iso, precision = parsed
        if precision < DAY_PRECISION:
            continue
        calendar = _calendar_qid(raw)
        calendar_rank = 0 if calendar == GREGORIAN else 1 if calendar == JULIAN else 2
        scored.append(((*_rank_tuple(claim), calendar_rank), iso, precision))
    if not scored:
        return None
    gregorian = [item for item in scored if item[0][2] == 0]
    pool = gregorian or scored
    pool.sort(key=lambda item: item[0])
    _, iso, precision = pool[0]
    return iso, precision
