"""Cost estimate is computed locally from the batch JSONL."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.estimate import estimate_batch


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
    assert result["usd_batch_with_thinking_upper"] > result["usd_batch_no_thinking"]
