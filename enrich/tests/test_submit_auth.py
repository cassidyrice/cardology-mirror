"""Submit refuses to invent credentials when Vertex auth is missing."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.auth import auth_blocker_message, discover_vertex_config
from enrich.submit_batch import main as submit_main


def test_discover_reports_missing_project_bucket_and_creds(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.delenv("VERTEX_PROJECT", raising=False)
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    monkeypatch.delenv("GCLOUD_PROJECT", raising=False)
    monkeypatch.delenv("VERTEX_GCS_BUCKET", raising=False)
    monkeypatch.delenv("VERTEX_BUCKET", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.setattr("enrich.auth.ADC_PATH", tmp_path / "missing-adc.json")
    monkeypatch.setattr("enrich.auth.shutil.which", lambda _name: None)

    config = discover_vertex_config()
    assert config.ready is False
    assert config.project is None
    assert config.bucket is None
    message = auth_blocker_message(config)
    assert "AUTH BLOCKER" in message
    assert "GOOGLE_CLOUD_PROJECT" in message
    assert "VERTEX_GCS_BUCKET" in message
    assert "gcloud auth application-default login" in message


def test_submit_writes_status_and_exits_2_without_auth(
    monkeypatch, tmp_path: Path
) -> None:
    monkeypatch.delenv("VERTEX_PROJECT", raising=False)
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    monkeypatch.delenv("GCLOUD_PROJECT", raising=False)
    monkeypatch.delenv("VERTEX_GCS_BUCKET", raising=False)
    monkeypatch.delenv("VERTEX_BUCKET", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.setattr("enrich.auth.ADC_PATH", tmp_path / "missing-adc.json")
    monkeypatch.setattr("enrich.auth.shutil.which", lambda _name: None)

    batch = tmp_path / "vertex_batch.jsonl"
    batch.write_text(
        json.dumps({"custom_id": "Q0FIX1", "request": {"contents": []}}) + "\n",
        encoding="utf-8",
    )
    status = tmp_path / "submit_status.json"
    code = submit_main(
        [
            "--input",
            str(batch),
            "--status",
            str(status),
            "--job",
            str(tmp_path / "job.json"),
        ]
    )
    assert code == 2
    payload = json.loads(status.read_text(encoding="utf-8"))
    assert payload["submitted"] is False
    assert payload["reason"] == "auth_missing"
    assert payload["job_id"] is None
    assert payload["input_row_count"] == 1
    assert payload["model"] == "gemini-3.1-pro-preview"
