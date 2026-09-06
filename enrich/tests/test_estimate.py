"""Cost estimate is computed locally from the batch JSONL."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.estimate import TARGET_USD_BAND, estimate_batch

REPO = Path(__file__).resolve().parents[2]
RETRY_BATCH = REPO / "enrich" / "artifacts" / "vertex_retry_batch.jsonl"
COST = REPO / "enrich" / "artifacts" / "cost_estimate.json"


def test_estimate_counts_requests_and_positive_usd(tmp_path: Path) -> None:
    row = {
        "custom_id": "Q0FIX1",
        "request": {
            "contents": [
                {"role": "user", "parts": [{"text": "hello world " * 50}]}
            ]
        },
    }
    path = tmp_path / "batch.jsonl"
    path.write_text(json.dumps(row) + "\n", encoding="utf-8")
    result = estimate_batch(path, model="gemini-3.1-pro-preview")
    assert result["requests"] == 1
    assert result["input_tokens_est"] > 0
    assert result["usd_batch_no_thinking"] > 0
    assert result["usd_batch_thinking_low"] > result["usd_batch_no_thinking"]
    assert result["usd_batch_with_thinking_upper"] > result["usd_batch_thinking_low"]
    assert result["target_usd_band"] == TARGET_USD_BAND


def test_committed_retry_estimate_stays_inside_16_usd() -> None:
    result = estimate_batch(RETRY_BATCH, model="gemini-3.1-pro-preview")
    committed = json.loads(COST.read_text(encoding="utf-8"))
    assert result["requests"] == 836
    assert result["usd_batch_with_thinking_upper"] <= TARGET_USD_BAND
    assert committed["requests"] == 836
    assert committed["within_target"] is True
    assert result["usd_batch_with_thinking_upper"] == committed["usd_batch_with_thinking_upper"]
