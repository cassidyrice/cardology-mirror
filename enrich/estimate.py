"""Estimate Gemini 3.1 Pro Flex/Batch cost from a Vertex JSONL file. No API call."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from enrich.auth import DEFAULT_MODEL
from enrich.make_batch import load_jsonl

# Official Vertex Flex/Batch rates for Gemini 3.1 Pro Preview (≤200K tokens/request).
# https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing
BATCH_INPUT_PER_MILLION_USD = 1.00
BATCH_OUTPUT_PER_MILLION_USD = 6.00
CHARS_PER_TOKEN = 4.0
# Structured JSON target: hook + 3 evidence + 120–180 word card_in_life + 3 faq + meta.
OUTPUT_TOKENS_PER_ROW = 500
# Gemini 3.1 Pro thinking can inflate output if not disabled at the project.
THINKING_OUTPUT_TOKENS_PER_ROW = 2500


def request_text(row: dict[str, Any]) -> str:
    request = row.get("request") or {}
    contents = request.get("contents") or []
    parts: list[str] = []
    for content in contents:
        for part in content.get("parts") or []:
            text = part.get("text")
            if isinstance(text, str):
                parts.append(text)
    return "\n".join(parts)


def estimate_batch(path: Path, *, model: str = DEFAULT_MODEL) -> dict[str, Any]:
    rows = load_jsonl(path)
    input_chars = sum(len(request_text(row)) for row in rows)
    input_tokens = int(round(input_chars / CHARS_PER_TOKEN))
    output_tokens = len(rows) * OUTPUT_TOKENS_PER_ROW
    thinking_tokens = len(rows) * THINKING_OUTPUT_TOKENS_PER_ROW
    input_cost = (input_tokens / 1_000_000) * BATCH_INPUT_PER_MILLION_USD
    output_cost = (output_tokens / 1_000_000) * BATCH_OUTPUT_PER_MILLION_USD
    thinking_cost = (thinking_tokens / 1_000_000) * BATCH_OUTPUT_PER_MILLION_USD
    return {
        "model": model,
        "requests": len(rows),
        "input_chars": input_chars,
        "input_tokens_est": input_tokens,
        "output_tokens_est": output_tokens,
        "thinking_output_tokens_est": thinking_tokens,
        "usd_batch_no_thinking": round(input_cost + output_cost, 4),
        "usd_batch_with_thinking_upper": round(input_cost + thinking_cost, 4),
        "rates_usd_per_million": {
            "input": BATCH_INPUT_PER_MILLION_USD,
            "output": BATCH_OUTPUT_PER_MILLION_USD,
            "source": "Vertex Flex/Batch Gemini 3.1 Pro Preview, ≤200K tokens/request",
        },
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Estimate Vertex batch cost. No submit.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).resolve().parent / "artifacts" / "vertex_batch.jsonl",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args(argv)
    if not args.input.is_file():
        raise SystemExit(f"batch JSONL not found: {args.input}")
    result = estimate_batch(args.input, model=args.model)
    text = json.dumps(result, indent=2)
    print(text)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
