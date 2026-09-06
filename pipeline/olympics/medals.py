"""Extract Summer Olympic gold medals from a Wikidata person entity.

Medals are almost always P1344 (participant in event) with qualifier
P166 = Olympic gold medal. P166-as-award with a Games qualifier is a
secondary pattern. Dates are never read here.
"""

from __future__ import annotations

from typing import Any

from pipeline.olympics.games import OLYMPIC_GOLD, SUMMER_GAME_QIDS, SUMMER_GAMES
from pipeline.wikidata import _parse_time


def _all_claims(entity: dict, prop: str) -> list[dict]:
    return [claim for claim in (entity.get("claims", {}).get(prop, []) or []) if claim.get("rank") != "deprecated"]


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


def _entity_id(raw: Any) -> str | None:
    if isinstance(raw, dict) and raw.get("id"):
        return str(raw["id"])
    return None


def _label(entity: dict | None) -> str:
    if not entity:
        return ""
    labels = entity.get("labels") or {}
    return str((labels.get("en") or {}).get("value") or "").strip()


def _instance_ids(entity: dict | None) -> set[str]:
    if not entity:
        return set()
    ids: set[str] = set()
    for claim in _all_claims(entity, "P31"):
        qid = _entity_id(_mainsnak_value(claim))
        if qid:
            ids.add(qid)
    return ids


def _part_of_ids(entity: dict | None) -> list[str]:
    if not entity:
        return []
    ids: list[str] = []
    for claim in _all_claims(entity, "P361"):
        qid = _entity_id(_mainsnak_value(claim))
        if qid:
            ids.append(qid)
    return ids


def _sport_ids(entity: dict | None) -> list[str]:
    if not entity:
        return []
    ids: list[str] = []
    for claim in _all_claims(entity, "P641"):
        qid = _entity_id(_mainsnak_value(claim))
        if qid:
            ids.append(qid)
    return ids


def _year_from_entity(entity: dict | None) -> int | None:
    if not entity:
        return None
    for claim in _all_claims(entity, "P585"):
        raw = _mainsnak_value(claim)
        if not isinstance(raw, dict):
            continue
        parsed = _parse_time(raw)
        if parsed:
            return int(parsed[0][:4])
    return None


def classify_event_season(event: dict | None) -> str:
    """Return 'summer', 'winter', or 'unknown' from a fetched event entity."""
    if not event:
        return "unknown"
    if event.get("id") in SUMMER_GAME_QIDS:
        return "summer"
    parts = _part_of_ids(event)
    if any(qid in SUMMER_GAME_QIDS for qid in parts):
        return "summer"
    for part in parts:
        if part in SUMMER_GAMES:
            return "summer"
    label = _label(event).lower()
    if "winter olympics" in label or "winter olympic" in label:
        return "winter"
    if "summer olympics" in label or "summer olympic" in label:
        return "summer"
    if "youth olympics" in label:
        return "youth"
    return "unknown"


def summer_games_for_event(event: dict | None) -> dict[str, str | int] | None:
    if not event:
        return None
    qid = str(event.get("id") or "")
    if qid in SUMMER_GAMES:
        return {"qid": qid, **SUMMER_GAMES[qid]}
    for part in _part_of_ids(event):
        if part in SUMMER_GAMES:
            return {"qid": part, **SUMMER_GAMES[part]}
    return None


def extract_gold_event_qids(entity: dict) -> list[str]:
    """Event QIDs where this person has an Olympic gold qualifier or award."""
    seen: set[str] = set()
    out: list[str] = []
    for claim in _all_claims(entity, "P1344"):
        medals = [_entity_id(raw) for raw in _qualifier_values(claim, "P166")]
        if OLYMPIC_GOLD not in medals:
            continue
        event_qid = _entity_id(_mainsnak_value(claim))
        if event_qid and event_qid not in seen:
            seen.add(event_qid)
            out.append(event_qid)
    for claim in _all_claims(entity, "P166"):
        if _entity_id(_mainsnak_value(claim)) != OLYMPIC_GOLD:
            continue
        for raw in _qualifier_values(claim, "P1344"):
            event_qid = _entity_id(raw)
            if event_qid and event_qid not in seen:
                seen.add(event_qid)
                out.append(event_qid)
    return out


def build_medal_records(
    entity: dict,
    events: dict[str, dict],
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for event_qid in extract_gold_event_qids(entity):
        event = events.get(event_qid)
        season = classify_event_season(event)
        if season == "winter" or season == "youth":
            continue
        # Keep summer and unknown-but-listed-by-SPARQL; harvest drops <2 summer.
        games = summer_games_for_event(event)
        if season == "unknown" and games is None:
            continue
        sport_qids = _sport_ids(event)
        sport = ""
        if sport_qids:
            sport = _label(events.get(sport_qids[0])) or sport_qids[0]
        year = None
        if games:
            year = int(games["year"])
        else:
            year = _year_from_entity(event)
        label = _label(event) or event_qid
        games_label = str(games["label"]) if games else ""
        key = (str(year or ""), label)
        if key in seen:
            continue
        seen.add(key)
        records.append(
            {
                "year": f"{year:04d}" if year else "",
                "games": games_label,
                "event": label,
                "sport": sport,
                "event_qid": event_qid,
            }
        )
    records.sort(key=lambda item: (item.get("year") or "9999", item.get("event") or ""))
    return records


def person_sport_labels(entity: dict, extras: dict[str, dict] | None = None) -> list[str]:
    extras = extras or {}
    labels: list[str] = []
    seen: set[str] = set()
    for qid in _sport_ids(entity):
        label = _label(extras.get(qid)) or qid
        if label and label not in seen and not label.startswith("Q"):
            seen.add(label)
            labels.append(label)
    return labels


def country_label(entity: dict, extras: dict[str, dict] | None = None) -> str:
    extras = extras or {}
    for prop in ("P1532", "P27"):
        for claim in _all_claims(entity, prop):
            qid = _entity_id(_mainsnak_value(claim))
            if not qid:
                continue
            label = _label(extras.get(qid))
            if label:
                return label
    return ""
