"""submit_batch refuses to invent credentials."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.submit_batch import main


def test_submit_without_auth_exits_2(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.delenv("VERTEX_PROJECT", raising=False)
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    monkeypatch.delenv("GCLOUD_PROJECT", raising=False)
    monkeypatch.delenv("VERTEX_GCS_BUCKET", raising=False)
    monkeypatch.delenv("VERTEX_BUCKET", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    batch = tmp_path / "batch.jsonl"
    batch.write_text(
        json.dumps({"custom_id": "Q0FIX1", "request": {"contents": []}}) + "\n",
        encoding="utf-8",
    )
    status = tmp_path / "status.json"
    code = main(["--input", str(batch), "--status", str(status), "--job", str(tmp_path / "job.json")])
    assert code == 2
    payload = json.loads(status.read_text(encoding="utf-8"))
    assert payload["submitted"] is False
    assert payload["reason"] == "auth_missing"
    assert payload["job_id"] is None
