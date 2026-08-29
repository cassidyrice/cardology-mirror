#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec bun scripts/upload-deep-dive-card-pdfs.ts
