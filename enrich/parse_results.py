"""Join Vertex predictions onto people.jsonl. Reject containment failures."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from enrich.containment import CONTAINMENT_THRESHOLD, fact_is_contained
from enrich.contract import validate_enrichment
from enrich.make_batch import load_jsonl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PEOPLE = ROOT / "pipeline" / "data" / "people.jsonl"
DEFAULT_PREDICTIONS = ROOT / "enrich" / "out" / "predictions.jsonl"
DEFAULT_ENRICHED = ROOT / "pipeline" / "data" / "people_enriched.jsonl"
DEFAULT_RETRY = ROOT / "enrich" / "artifacts" / "retry.jsonl"
DEFAULT_REPORT = ROOT / "enrich" / "artifacts" / "exclusion_report.json"

SLUG_RE = re.compile(r"^slug:\s+(\S+)", re.MULTILINE)


def _walk_text_parts(node: Any) -> list[str]:
    texts: list[str] = []
    if isinstance(node, dict):
        text = node.get("text")
        if isinstance(text, str) and text.strip():
            texts.append(text)
        for key, value in node.items():
            if key == "text":
                continue
            texts.extend(_walk_text_parts(value))
    elif isinstance(node, list):
        for item in node:
            texts.extend(_walk_text_parts(item))
    return texts


def _prefer_model_json(texts: list[str]) -> str | None:
    if not texts:
        return None
    jsonish = [text for text in texts if text.lstrip().startswith(("{", "```"))]
    if jsonish:
        return min(jsonish, key=len)
    return max(texts, key=len)


def extract_prediction_text(row: dict[str, Any]) -> str | None:
    for key in ("response", "prediction"):
        blob = row.get(key)
        if isinstance(blob, str) and blob.strip():
            return blob
        if isinstance(blob, dict):
            candidates = blob.get("candidates")
            if isinstance(candidates, list) and candidates:
                first = candidates[0]
                if isinstance(first, dict):
                    parts = ((first.get("content") or {}).get("parts") or [])
                    if isinstance(parts, list):
                        texts = [
                            part.get("text")
                            for part in parts
                            if isinstance(part, dict) and isinstance(part.get("text"), str)
                        ]
                        chosen = _prefer_model_json([t for t in texts if t])
                        if chosen:
                            return chosen
            chosen = _prefer_model_json(_walk_text_parts(blob))
            if chosen:
                return chosen
    return None


def extract_prompt_text(row: dict[str, Any]) -> str:
    request = row.get("request")
    if isinstance(request, dict):
        parts = _walk_text_parts(request)
        if parts:
            return max(parts, key=len)
    return ""


def recover_custom_id(
    row: dict[str, Any],
    *,
    people_by_qid: dict[str, dict[str, Any]],
    people_by_slug: dict[str, dict[str, Any]],
) -> str | None:
    for key in ("custom_id", "id", "key"):
        value = row.get(key)
        if isinstance(value, str) and value in people_by_qid:
            return value
        if isinstance(value, str) and value in people_by_slug:
            return people_by_slug[value]["qid"]
    prompt = extract_prompt_text(row)
    match = SLUG_RE.search(prompt)
    if match:
        slug = match.group(1)
        person = people_by_slug.get(slug)
        if person:
            return str(person["qid"])
    return None


def parse_model_json(text: str) -> tuple[dict[str, Any] | None, str | None]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON: {exc}"
    if not isinstance(payload, dict):
        return None, "prediction JSON is not an object"
    return payload, None


def _index_people(
    people: list[dict[str, Any]],
) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    by_qid: dict[str, dict[str, Any]] = {}
    by_slug: dict[str, dict[str, Any]] = {}
    for person in people:
        qid = str(person.get("qid") or "")
        slug = str(person.get("slug") or "")
        if qid:
            by_qid[qid] = person
        if slug:
            by_slug[slug] = person
    return by_qid, by_slug


def _related_slugs(people: list[dict[str, Any]]) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    by_card: dict[str, list[str]] = defaultdict(list)
    by_day: dict[str, list[str]] = defaultdict(list)
    for person in people:
        slug = str(person.get("slug") or "")
        card = str(person.get("card") or "")
        birth = str(person.get("birth_date") or "")
        if slug and card:
            by_card[card].append(slug)
        if slug and len(birth) >= 10:
            by_day[birth[5:]].append(slug)
    return by_card, by_day


def check_containment(
    payload: dict[str, Any],
    source_text: str,
    *,
    threshold: float = CONTAINMENT_THRESHOLD,
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
        ok, score = fact_is_contained(fact, source_text, threshold=threshold)
        details.append({"index": i, "fact": fact, "score": round(score, 4), "ok": ok})
        if not ok:
            errors.append(
                f"evidence[{i}].fact containment {score:.3f} < {threshold:.2f}"
            )
    return details, errors


def join_row(
    person: dict[str, Any],
    payload: dict[str, Any],
    *,
    same_card_slugs: list[str],
    same_day_slugs: list[str],
) -> dict[str, Any]:
    slug = str(person.get("slug") or "")
    faqs = [
        {"question": item["q"], "answer": item["a"]}
        for item in payload["faq"]
        if isinstance(item, dict)
    ]
    return {
        **person,
        "hook": payload["hook"],
        "evidence": payload["evidence"],
        "card_in_life": payload["card_in_life"],
        "faq": payload["faq"],
        "meta_description": payload["meta_description"],
        "example": False,
        "wikidata_qid": person.get("qid"),
        "wikipedia_title": None,
        "faqs": faqs,
        "same_card_slugs": [s for s in same_card_slugs if s != slug],
        "same_day_slugs": [s for s in same_day_slugs if s != slug],
        "enrich_status": "ok",
    }


def parse_results(
    *,
    people_path: Path,
    predictions_path: Path,
    enriched_path: Path,
    retry_path: Path,
    report_path: Path,
    threshold: float = CONTAINMENT_THRESHOLD,
) -> dict[str, Any]:
    if not people_path.is_file():
        raise SystemExit(f"people.jsonl not found: {people_path}")
    if not predictions_path.is_file():
        raise SystemExit(
            f"predictions.jsonl not found: {predictions_path}\n"
            "Download Vertex output here, or pass --predictions."
        )

    people = load_jsonl(people_path)
    predictions = load_jsonl(predictions_path)
    by_qid, by_slug = _index_people(people)
    by_card, by_day = _related_slugs(people)

    seen: set[str] = set()
    accepted: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    for row in predictions:
        qid = recover_custom_id(row, people_by_qid=by_qid, people_by_slug=by_slug)
        if not qid or qid not in by_qid:
            rejected.append(
                {
                    "qid": qid,
                    "reasons": ["could not match prediction to a people.jsonl row"],
                }
            )
            continue
        if qid in seen:
            rejected.append({"qid": qid, "reasons": ["duplicate prediction"]})
            continue
        seen.add(qid)
        person = by_qid[qid]
        text = extract_prediction_text(row)
        if not text:
            rejected.append({"qid": qid, "slug": person.get("slug"), "reasons": ["empty prediction"]})
            continue
        payload, json_error = parse_model_json(text)
        if json_error or payload is None:
            rejected.append(
                {"qid": qid, "slug": person.get("slug"), "reasons": [json_error or "empty payload"]}
            )
            continue
        errors = validate_enrichment(payload)
        source_text = str(person.get("source_text") or "")
        containment, contain_errors = check_containment(
            payload, source_text, threshold=threshold
        )
        errors.extend(contain_errors)
        if errors:
            rejected.append(
                {
                    "qid": qid,
                    "slug": person.get("slug"),
                    "reasons": errors,
                    "containment": containment,
                }
            )
            continue
        birth = str(person.get("birth_date") or "")
        accepted.append(
            join_row(
                person,
                payload,
                same_card_slugs=by_card.get(str(person.get("card") or ""), []),
                same_day_slugs=by_day.get(birth[5:], []) if len(birth) >= 10 else [],
            )
        )

    missing = []
    for person in people:
        qid = str(person.get("qid") or "")
        if qid and qid not in seen:
            missing.append({"qid": qid, "slug": person.get("slug"), "reasons": ["no prediction"]})
            rejected.append(missing[-1])

    enriched_path.parent.mkdir(parents=True, exist_ok=True)
    retry_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with enriched_path.open("w", encoding="utf-8") as handle:
        for row in accepted:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    with retry_path.open("w", encoding="utf-8") as handle:
        for row in rejected:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    reason_counts: dict[str, int] = defaultdict(int)
    for row in rejected:
        for reason in row.get("reasons") or ["unknown"]:
            key = str(reason).split(":")[0]
            if "containment" in key:
                reason_counts["containment"] += 1
            elif "no prediction" in key:
                reason_counts["no_prediction"] += 1
            else:
                reason_counts[key] += 1

    report = {
        "people": len(people),
        "predictions": len(predictions),
        "accepted": len(accepted),
        "rejected": len(rejected),
        "missing_predictions": len(missing),
        "containment_threshold": threshold,
        "by_reason": dict(sorted(reason_counts.items())),
        "enriched_path": str(enriched_path),
        "retry_path": str(retry_path),
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Parse Vertex predictions into people_enriched.jsonl. Rejects containment failures."
    )
    parser.add_argument("--people", type=Path, default=DEFAULT_PEOPLE)
    parser.add_argument("--predictions", type=Path, default=DEFAULT_PREDICTIONS)
    parser.add_argument("--out", type=Path, default=DEFAULT_ENRICHED)
    parser.add_argument("--retry", type=Path, default=DEFAULT_RETRY)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--threshold", type=float, default=CONTAINMENT_THRESHOLD)
    args = parser.parse_args(argv)
    report = parse_results(
        people_path=args.people,
        predictions_path=args.predictions,
        enriched_path=args.out,
        retry_path=args.retry,
        report_path=args.report,
        threshold=args.threshold,
    )
    print(
        f"accepted {report['accepted']}/{report['people']} → {args.out}; "
        f"rejected {report['rejected']} → {args.retry}"
    )
    return 0 if report["accepted"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
