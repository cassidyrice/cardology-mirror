"""Fuzzy source_text containment for evidence.fact. Stdlib only."""

from __future__ import annotations

from difflib import SequenceMatcher

CONTAINMENT_THRESHOLD = 0.85


def normalize(text: str) -> str:
    return " ".join((text or "").casefold().split())


def containment_score(fact: str, source_text: str) -> float:
    """Best fuzzy overlap of fact against source_text (1.0 = exact substring)."""
    fact_n = normalize(fact)
    source_n = normalize(source_text)
    if not fact_n or not source_n:
        return 0.0
    if fact_n in source_n:
        return 1.0
    if len(fact_n) > len(source_n):
        return SequenceMatcher(None, fact_n, source_n).ratio()

    best = 0.0
    windows = {len(fact_n), max(len(fact_n) + len(fact_n) // 4, len(fact_n) + 8)}
    for window_len in windows:
        if window_len > len(source_n):
            window_len = len(source_n)
        step = max(1, window_len // 10)
        for start in range(0, len(source_n) - window_len + 1, step):
            window = source_n[start : start + window_len]
            ratio = SequenceMatcher(None, fact_n, window).ratio()
            if ratio > best:
                best = ratio
                if best >= 0.999:
                    return best
    return best


def fact_is_contained(
    fact: str,
    source_text: str,
    *,
    threshold: float = CONTAINMENT_THRESHOLD,
) -> tuple[bool, float]:
    score = containment_score(fact, source_text)
    return score >= threshold, score
