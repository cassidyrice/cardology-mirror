"""Submit or poll a Vertex Gemini batch job. Refuses to invent credentials."""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from enrich.auth import VertexConfig, auth_blocker_message, discover_vertex_config
from enrich.estimate import estimate_batch
from enrich.make_batch import load_jsonl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "enrich" / "artifacts" / "vertex_wave_slice1_batch.jsonl"
DEFAULT_STATUS = ROOT / "enrich" / "artifacts" / "submit_status.json"
DEFAULT_JOB = ROOT / "enrich" / "artifacts" / "job.json"

POLL_SLA_SECONDS = 24 * 60 * 60


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_status(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _bucket_name(raw: str) -> str:
    return raw.removeprefix("gs://").split("/", 1)[0]


def _gcs_prefix(raw: str) -> str:
    rest = raw.removeprefix("gs://")
    if "/" in rest:
        return rest.split("/", 1)[1].rstrip("/")
    return "cardology-wp3-enrich"


def job_url(config: VertexConfig) -> str:
    location = config.location
    host = (
        "aiplatform.googleapis.com"
        if location == "global"
        else f"{location}-aiplatform.googleapis.com"
    )
    return (
        f"https://{host}/v1/projects/{config.project}/locations/{location}/batchPredictionJobs"
    )


def access_token(config: VertexConfig) -> str:
    """Mint a bearer token from a local SA JSON or ADC file. No invented keys."""
    cred_path = None
    if config.credentials_path and Path(config.credentials_path).is_file():
        cred_path = Path(config.credentials_path)
    elif config.adc_present:
        cred_path = Path.home() / ".config" / "gcloud" / "application_default_credentials.json"
    if cred_path is None:
        raise SystemExit("no local credential file to mint an access token")

    try:
        from google.auth.transport.requests import Request as GoogleRequest
        from google.oauth2 import service_account
        from google.oauth2.credentials import Credentials as UserCredentials
    except ImportError as exc:
        raise SystemExit(
            "google-auth is required to submit. Install with:\n"
            "  python3 -m pip install -r enrich/requirements-vertex.txt"
        ) from exc

    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    data = json.loads(cred_path.read_text(encoding="utf-8"))
    cred_type = data.get("type")
    if cred_type == "service_account":
        creds = service_account.Credentials.from_service_account_file(
            str(cred_path), scopes=scopes
        )
    elif cred_type == "authorized_user":
        creds = UserCredentials.from_authorized_user_info(data, scopes=scopes)
    else:
        raise SystemExit(f"unsupported credential type {cred_type!r} in {cred_path}")
    creds.refresh(GoogleRequest())
    if not creds.token:
        raise SystemExit("credential refresh produced no access token")
    return creds.token


def _json_request(method: str, url: str, token: str, body: dict[str, Any] | None = None) -> Any:
    payload = None if body is None else json.dumps(body).encode("utf-8")
    request = Request(
        url,
        data=payload,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Vertex HTTP {exc.code} {url}: {detail}") from exc
    except URLError as exc:
        raise SystemExit(f"Vertex request failed {url}: {exc}") from exc


def upload_jsonl(config: VertexConfig, token: str, local_path: Path, object_name: str) -> str:
    bucket = _bucket_name(config.bucket or "")
    url = (
        f"https://storage.googleapis.com/upload/storage/v1/b/{bucket}/o"
        f"?uploadType=media&name={object_name}"
    )
    data = local_path.read_bytes()
    request = Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/jsonl",
        },
    )
    try:
        with urlopen(request, timeout=180) as response:
            json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"GCS upload HTTP {exc.code}: {detail}") from exc
    return f"gs://{bucket}/{object_name}"


def submit_job(
    config: VertexConfig,
    token: str,
    input_uri: str,
    output_prefix: str,
    *,
    display_name: str,
) -> dict[str, Any]:
    model = f"publishers/google/models/{config.model}"
    body = {
        "displayName": display_name,
        "model": model,
        "inputConfig": {
            "instancesFormat": "jsonl",
            "gcsSource": {"uris": [input_uri]},
        },
        "outputConfig": {
            "predictionsFormat": "jsonl",
            "gcsDestination": {"outputUriPrefix": output_prefix},
        },
    }
    return _json_request("POST", job_url(config), token, body)


def get_job(config: VertexConfig, token: str, job_name: str) -> dict[str, Any]:
    if job_name.startswith("projects/"):
        location = config.location
        host = (
            "aiplatform.googleapis.com"
            if location == "global"
            else f"{location}-aiplatform.googleapis.com"
        )
        url = f"https://{host}/v1/{job_name}"
    else:
        url = f"{job_url(config)}/{job_name}"
    return _json_request("GET", url, token)


def _redact_gcs(uri: str | None) -> str | None:
    if not uri:
        return uri
    if uri.startswith("gs://"):
        rest = uri[5:]
        bucket, _, tail = rest.partition("/")
        return f"gs://$VERTEX_GCS_BUCKET/{tail}" if tail else "gs://$VERTEX_GCS_BUCKET"
    return uri


def _status_payload(
    *,
    config: VertexConfig,
    input_path: Path,
    submitted: bool,
    reason: str,
    job: dict[str, Any] | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    rows = load_jsonl(input_path) if input_path.is_file() else []
    estimate = (
        estimate_batch(input_path, model=config.model, target_usd_band=20.0)
        if input_path.is_file()
        else {}
    )
    payload = {
        "submitted": submitted,
        "reason": reason,
        "recorded_at": _utc_now(),
        "job_id": (job or {}).get("name"),
        "job_state": (job or {}).get("state"),
        "model": config.model,
        "location": config.location,
        "project_set": bool(config.project),
        "input_row_count": len(rows),
        "input_path": str(input_path),
        "missing": list(config.missing),
        "gcloud_present": config.gcloud_present,
        "adc_present": config.adc_present,
        "cost_estimate": estimate,
    }
    if extra:
        payload.update(extra)
    return payload


def run_submit(args: argparse.Namespace) -> int:
    config = discover_vertex_config()
    input_path: Path = args.input
    if not input_path.is_file():
        raise SystemExit(f"batch JSONL not found: {input_path}")
    rows = load_jsonl(input_path)
    if not rows:
        raise SystemExit(f"batch JSONL is empty: {input_path}")

    if not config.ready:
        status = _status_payload(
            config=config,
            input_path=input_path,
            submitted=False,
            reason="auth_missing",
        )
        write_status(args.status, status)
        print(auth_blocker_message(config))
        return 2

    token = access_token(config)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    prefix = _gcs_prefix(config.bucket or "")
    object_name = f"{prefix}/input/{stamp}-vertex_batch.jsonl"
    output_prefix = f"gs://{_bucket_name(config.bucket or '')}/{prefix}/output/{stamp}/"
    input_uri = upload_jsonl(config, token, input_path, object_name)
    job = submit_job(
        config,
        token,
        input_uri,
        output_prefix,
        display_name=f"cardology-wp3-enrich-{stamp}",
    )
    write_status(
        args.job,
        {
            "job": job,
            "input_uri": _redact_gcs(input_uri),
            "output_prefix": _redact_gcs(output_prefix),
            "model": config.model,
            "input_row_count": len(rows),
            "submitted_at": _utc_now(),
        },
    )
    write_status(
        args.status,
        _status_payload(
            config=config,
            input_path=input_path,
            submitted=True,
            reason="submitted",
            job=job,
            extra={
                "input_uri": _redact_gcs(input_uri),
                "output_prefix": _redact_gcs(output_prefix),
            },
        ),
    )
    print(f"submitted {job.get('name')} model={config.model} rows={len(rows)}")
    print(f"poll: python3 -m enrich.submit_batch --poll {job.get('name')}")
    return 0


def run_poll(args: argparse.Namespace) -> int:
    config = discover_vertex_config()
    if not config.ready:
        print(auth_blocker_message(config))
        return 2
    job_name = args.poll
    if job_name in (True, "") or job_name is None:
        if args.job.is_file():
            stored = json.loads(args.job.read_text(encoding="utf-8"))
            job_name = (stored.get("job") or {}).get("name")
        if not job_name:
            raise SystemExit("pass --poll JOB_NAME or keep enrich/artifacts/job.json")
    token = access_token(config)
    deadline = time.time() + args.timeout
    while True:
        job = get_job(config, token, str(job_name))
        state = job.get("state")
        print(f"{_utc_now()} {job.get('name')} state={state}")
        write_status(
            args.status,
            _status_payload(
                config=config,
                input_path=args.input,
                submitted=True,
                reason="polled",
                job=job,
            ),
        )
        if state in {
            "JOB_STATE_SUCCEEDED",
            "JOB_STATE_FAILED",
            "JOB_STATE_CANCELLED",
            "JOB_STATE_EXPIRED",
        }:
            return 0 if state == "JOB_STATE_SUCCEEDED" else 1
        if time.time() >= deadline:
            print(
                f"still {state} after {args.timeout}s (Vertex SLA is typically ≤24h after start). "
                "Re-run --poll later."
            )
            return 3
        time.sleep(args.interval)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Submit or poll a Vertex Gemini batch job. Does not invent credentials."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--status", type=Path, default=DEFAULT_STATUS)
    parser.add_argument("--job", type=Path, default=DEFAULT_JOB)
    parser.add_argument(
        "--poll",
        nargs="?",
        const="",
        default=None,
        help="Poll a job name, or the name stored in --job.",
    )
    parser.add_argument("--interval", type=int, default=60)
    parser.add_argument("--timeout", type=int, default=POLL_SLA_SECONDS)
    args = parser.parse_args(argv)
    if args.poll is not None:
        return run_poll(args)
    return run_submit(args)


if __name__ == "__main__":
    raise SystemExit(main())
