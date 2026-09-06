"""Vertex auth discovery never invents credentials."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.auth import discover_vertex_config, materialize_sa_json


def test_materialize_writes_json_blob(tmp_path: Path, monkeypatch) -> None:
    dest = tmp_path / "sa.json"
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", '{"type":"service_account"}')
    path = materialize_sa_json(dest)
    assert path == dest
    assert json.loads(dest.read_text(encoding="utf-8"))["type"] == "service_account"


def test_materialize_json_blob_does_not_stat_as_path(tmp_path: Path, monkeypatch) -> None:
    dest = tmp_path / "sa.json"
    blob = "{" + ("x" * 5000) + '"type":"service_account"}'
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", blob)
    path = materialize_sa_json(dest)
    assert path == dest
    assert dest.is_file()


def test_discover_reports_missing_without_inventing(monkeypatch) -> None:
    monkeypatch.delenv("VERTEX_PROJECT", raising=False)
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    monkeypatch.delenv("GCLOUD_PROJECT", raising=False)
    monkeypatch.delenv("VERTEX_GCS_BUCKET", raising=False)
    monkeypatch.delenv("VERTEX_BUCKET", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    config = discover_vertex_config()
    assert config.ready is False
    assert config.project is None
    assert any("project" in item for item in config.missing)
