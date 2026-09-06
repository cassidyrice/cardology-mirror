"""Near-verbatim source_text containment for evidence.fact. Stdlib only."""

from __future__ import annotations

import re
from typing import Any

# Retry gate: fact must be a contiguous span of source_text after light normalize.
# The first Vertex job used fuzzy ≥0.85 and still rejected 836 paraphrases.
CONTAINMENT_MODE = "near_verbatim"
CONTAINMENT_THRESHOLD = 1.0

_PUNCT_RE = re.compile(r"[^\w\s]", re.UNICODE)


def normalize(text: str) -> str:
    return " ".join((text or "").casefold().split())


def normalize_loose(text: str) -> str:
    """Casefold, collapse whitespace, and drop punctuation."""
    return " ".join(_PUNCT_RE.sub(" ", text or "").casefold().split())


def containment_score(fact: str, source_text: str) -> float:
    """1.0 when fact is a near-verbatim substring; else 0.0."""
    fact_n = normalize(fact)
    source_n = normalize(source_text)
    if not fact_n or not source_n:
        return 0.0
    if fact_n in source_n:
        return 1.0
    fact_loose = normalize_loose(fact)
    source_loose = normalize_loose(source_text)
    if fact_loose and fact_loose in source_loose:
        return 1.0
    return 0.0


def fact_is_near_verbatim(fact: str, source_text: str) -> tuple[bool, float]:
    score = containment_score(fact, source_text)
    return score >= CONTAINMENT_THRESHOLD, score


def fact_is_contained(
    fact: str,
    source_text: str,
    *,
    threshold: float = CONTAINMENT_THRESHOLD,
) -> tuple[bool, float]:
    """Retry parse alias — near-verbatim only. `threshold` is ignored if < 1.0."""
    del threshold
    return fact_is_near_verbatim(fact, source_text)


def check_evidence_facts(
    payload: dict[str, Any],
    source_text: str,
) -> tuple[list[dict[str, Any]], list[str]]:
    details: list[dict[str, Any]] = []
    errors: list[str] = []
    evidence = payload.get("evidence")
    if not isinstance(evidence, list):
        return details, ["evidence missing for containment"]
    for i, item in enumerate(evidence):
        if not isinstance(item, dict):
            continue
        fact = str(item.get("fact") or "")
        ok, score = fact_is_near_verbatim(fact, source_text)
        details.append({"index": i, "fact": fact, "score": round(score, 4), "ok": ok})
        if not ok:
            errors.append(
                f"evidence[{i}].fact is not a near-verbatim substring of source_text"
            )
    return details, errors
