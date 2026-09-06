"""Estimate Gemini 3.1 Pro Flex/Batch cost from a Vertex JSONL file. No API call."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from enrich.make_batch import load_jsonl

DEFAULT_MODEL = "gemini-3.1-pro-preview"

# Official Vertex Flex/Batch rates for Gemini 3.1 Pro Preview (≤200K tokens/request).
# https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing
BATCH_INPUT_PER_MILLION_USD = 1.00
BATCH_OUTPUT_PER_MILLION_USD = 6.00
CHARS_PER_TOKEN = 4.0
# Structured JSON target: hook + 3 evidence + 120–180 word card_in_life + 3 faq + meta.
OUTPUT_TOKENS_PER_ROW = 500
# Default thinking_level for gemini-3.1-pro-preview is HIGH (cannot be turned off).
THINKING_HIGH_TOKENS_PER_ROW = 2500
# LOW is the cheapest documented level for this model. Token count is not published;
# treat 800/row as a conservative LOW band (still billed as output).
THINKING_LOW_TOKENS_PER_ROW = 800
TARGET_USD_BAND = 16.0


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


def _usd(tokens: int, rate: float) -> float:
    return (tokens / 1_000_000) * rate


def estimate_batch(
    path: Path,
    *,
    model: str = DEFAULT_MODEL,
    target_usd_band: float = TARGET_USD_BAND,
) -> dict[str, Any]:
    rows = load_jsonl(path)
    input_chars = sum(len(request_text(row)) for row in rows)
    input_tokens = int(round(input_chars / CHARS_PER_TOKEN))
    output_tokens = len(rows) * OUTPUT_TOKENS_PER_ROW
    thinking_high = len(rows) * THINKING_HIGH_TOKENS_PER_ROW
    thinking_low = len(rows) * THINKING_LOW_TOKENS_PER_ROW
    input_cost = _usd(input_tokens, BATCH_INPUT_PER_MILLION_USD)
    output_cost = _usd(output_tokens, BATCH_OUTPUT_PER_MILLION_USD)
    low_cost = input_cost + _usd(thinking_low, BATCH_OUTPUT_PER_MILLION_USD) + output_cost
    high_cost = input_cost + _usd(thinking_high, BATCH_OUTPUT_PER_MILLION_USD)
    no_thinking = input_cost + output_cost
    return {
        "model": model,
        "requests": len(rows),
        "input_chars": input_chars,
        "input_tokens_est": input_tokens,
        "output_tokens_est": output_tokens,
        "thinking_low_tokens_est": thinking_low,
        "thinking_output_tokens_est": thinking_high,
        "usd_batch_no_thinking": round(no_thinking, 4),
        "usd_batch_thinking_low": round(low_cost, 4),
        "usd_batch_with_thinking_upper": round(high_cost, 4),
        "target_usd_band": target_usd_band,
        "within_target": high_cost <= target_usd_band,
        "notes": (
            "Thinking cannot be turned off on gemini-3.1-pro-preview. "
            "Retry JSONL sets thinkingLevel=LOW. "
            "no_thinking is a theoretical floor (output JSON only). "
            "thinking_low assumes 800 thought tokens/row (unpublished). "
            "thinking_upper uses the same 2500/row HIGH band as the 1058-row job."
        ),
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
        default=Path(__file__).resolve().parent / "artifacts" / "vertex_retry_batch.jsonl",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--target-usd", type=float, default=TARGET_USD_BAND)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args(argv)
    if not args.input.is_file():
        raise SystemExit(f"batch JSONL not found: {args.input}")
    result = estimate_batch(
        args.input, model=args.model, target_usd_band=args.target_usd
    )
    text = json.dumps(result, indent=2)
    print(text)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
