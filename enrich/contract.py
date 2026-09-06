"""Validate the locked WP3 enrich JSON contract."""

from __future__ import annotations

from typing import Any

REQUIRED_KEYS = ("hook", "evidence", "card_in_life", "faq", "meta_description")


def word_count(text: str) -> int:
    return len((text or "").split())


def validate_enrichment(payload: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(payload, dict):
        return ["prediction is not a JSON object"]

    for key in REQUIRED_KEYS:
        if key not in payload:
            errors.append(f"missing key {key!r}")

    hook = payload.get("hook")
    if not isinstance(hook, str) or not hook.strip():
        errors.append("hook must be a non-empty string")
    elif word_count(hook) > 40:
        errors.append(f"hook has {word_count(hook)} words (max 40)")

    evidence = payload.get("evidence")
    if not isinstance(evidence, list) or len(evidence) != 3:
        errors.append("evidence must be a list of 3 objects")
    else:
        for i, item in enumerate(evidence):
            if not isinstance(item, dict):
                errors.append(f"evidence[{i}] is not an object")
                continue
            fact = item.get("fact")
            trait = item.get("trait")
            if not isinstance(fact, str) or not fact.strip():
                errors.append(f"evidence[{i}].fact must be a non-empty string")
            if not isinstance(trait, str) or not trait.strip():
                errors.append(f"evidence[{i}].trait must be a non-empty string")

    card_in_life = payload.get("card_in_life")
    if not isinstance(card_in_life, str) or not card_in_life.strip():
        errors.append("card_in_life must be a non-empty string")
    else:
        words = word_count(card_in_life)
        if words < 120 or words > 180:
            errors.append(f"card_in_life has {words} words (need 120–180)")

    faq = payload.get("faq")
    if not isinstance(faq, list) or len(faq) != 3:
        errors.append("faq must be a list of 3 objects")
    else:
        for i, item in enumerate(faq):
            if not isinstance(item, dict):
                errors.append(f"faq[{i}] is not an object")
                continue
            question = item.get("q")
            answer = item.get("a")
            if not isinstance(question, str) or not question.strip():
                errors.append(f"faq[{i}].q must be a non-empty string")
            if not isinstance(answer, str) or not answer.strip():
                errors.append(f"faq[{i}].a must be a non-empty string")

    meta = payload.get("meta_description")
    if not isinstance(meta, str) or not meta.strip():
        errors.append("meta_description must be a non-empty string")
    elif len(meta) > 155:
        errors.append(f"meta_description is {len(meta)} chars (max 155)")

    return errors
