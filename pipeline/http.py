"""Shared HTTP helper: User-Agent, retries, backoff, optional JSON cache."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

DEFAULT_USER_AGENT = (
    "CardBlueprintsBirthCardPipeline/0.1 "
    "(https://cardblueprints.com; celebrity-birth-card-dataset)"
)
USER_AGENT = os.environ.get("PIPELINE_USER_AGENT", DEFAULT_USER_AGENT)


def fetch_json(
    url: str,
    *,
    cache_path: Path | None = None,
    retries: int = 5,
    timeout: float = 20.0,
    sleep_s: float = 0.1,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    if cache_path is not None and cache_path.is_file():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    last_error: Exception | None = None
    headers = {"User-Agent": USER_AGENT}
    if extra_headers:
        headers.update(extra_headers)
    for attempt in range(retries):
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if cache_path is not None:
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_text(
                    json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
            if sleep_s:
                time.sleep(sleep_s)
            return payload
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code not in {429, 500, 502, 503, 504} or attempt == retries - 1:
                raise
            retry_after = exc.headers.get("Retry-After") if exc.headers else None
            delay = float(retry_after) if retry_after and retry_after.isdigit() else 0.5 * (2**attempt)
            time.sleep(delay)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt == retries - 1:
                raise
            time.sleep(0.5 * (2**attempt))
    raise RuntimeError(f"failed to fetch {url}") from last_error
