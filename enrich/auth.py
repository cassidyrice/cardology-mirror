"""Discover Vertex/GCP auth. Never invent project IDs, keys, or buckets."""

from __future__ import annotations

import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path

DEFAULT_MODEL = "gemini-3.1-pro-preview"
DEFAULT_LOCATION = "global"

PROJECT_ENV = (
    "VERTEX_PROJECT",
    "GOOGLE_CLOUD_PROJECT",
    "GCP_PROJECT",
    "GCLOUD_PROJECT",
)
BUCKET_ENV = ("VERTEX_GCS_BUCKET", "VERTEX_BUCKET")
LOCATION_ENV = ("VERTEX_LOCATION", "GOOGLE_CLOUD_LOCATION")
MODEL_ENV = ("VERTEX_MODEL", "GEMINI_MODEL")
CREDS_ENV = "GOOGLE_APPLICATION_CREDENTIALS"

ADC_PATH = Path.home() / ".config" / "gcloud" / "application_default_credentials.json"


@dataclass(frozen=True)
class VertexConfig:
    project: str | None
    bucket: str | None
    location: str
    model: str
    credentials_path: str | None
    adc_present: bool
    gcloud_present: bool
    missing: tuple[str, ...] = field(default_factory=tuple)

    @property
    def ready(self) -> bool:
        return not self.missing


def _first_env(names: tuple[str, ...]) -> str | None:
    for name in names:
        value = (os.environ.get(name) or "").strip()
        if value:
            return value
    return None


def discover_vertex_config() -> VertexConfig:
    project = _first_env(PROJECT_ENV)
    bucket = _first_env(BUCKET_ENV)
    location = _first_env(LOCATION_ENV) or DEFAULT_LOCATION
    model = _first_env(MODEL_ENV) or DEFAULT_MODEL
    credentials_path = (os.environ.get(CREDS_ENV) or "").strip() or None
    adc_present = ADC_PATH.is_file()
    gcloud_present = shutil.which("gcloud") is not None
    sa_file_ok = bool(credentials_path) and Path(credentials_path).is_file()

    missing: list[str] = []
    if not project:
        missing.append(
            "GCP project id via VERTEX_PROJECT or GOOGLE_CLOUD_PROJECT"
        )
    if not bucket:
        missing.append("GCS bucket via VERTEX_GCS_BUCKET (gs://bucket or bucket name)")
    if not sa_file_ok and not adc_present:
        missing.append(
            "credentials: GOOGLE_APPLICATION_CREDENTIALS (Vertex SA JSON) "
            "or gcloud ADC at ~/.config/gcloud/application_default_credentials.json"
        )

    return VertexConfig(
        project=project,
        bucket=bucket,
        location=location,
        model=model,
        credentials_path=credentials_path,
        adc_present=adc_present,
        gcloud_present=gcloud_present,
        missing=tuple(missing),
    )


def auth_blocker_message(config: VertexConfig) -> str:
    lines = [
        "AUTH BLOCKER — Vertex batch was not submitted. Credentials were not invented.",
        "",
        "This environment has no usable GCP/Vertex auth:",
    ]
    for item in config.missing:
        lines.append(f"  - missing: {item}")
    if not config.gcloud_present:
        lines.append("  - gcloud CLI is not installed")
    lines += [
        "",
        "Cass must connect all of the following on this Cloud Agent environment",
        f"(or export them in the shell) before a real submit:",
        "",
        "  1. GCP project id  — VERTEX_PROJECT or GOOGLE_CLOUD_PROJECT",
        "  2. Service account JSON with roles:",
        "       - roles/aiplatform.user  (Vertex batchPredictionJobs)",
        "       - roles/storage.objectAdmin on the batch bucket",
        "     Export: GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/sa.json",
        "     OR run: gcloud auth application-default login  (user ADC)",
        "  3. GCS bucket for input JSONL + predictions  — VERTEX_GCS_BUCKET",
        "  4. Optional: VERTEX_LOCATION (default: global)",
        "              VERTEX_MODEL (default: gemini-3.1-pro-preview)",
        "",
        "Then rerun:",
        "  python3 -m enrich.submit_batch --input enrich/artifacts/vertex_batch.jsonl",
        "  python3 -m enrich.submit_batch --poll",
        "  python3 -m enrich.parse_results",
    ]
    return "\n".join(lines)
