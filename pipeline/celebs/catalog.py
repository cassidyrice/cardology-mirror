"""Existing celebrity birth-card blog profiles on the Next.js site.

These pages already ship at /blog/{slug}. This pack cites public DOBs.
It does not invent bios, dates, or a new URL prefix.
"""

from __future__ import annotations

import json
import re
import unicodedata
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
POSTS_PATH = ROOT / "lib" / "generated-blog-posts.json"
TOPICS_PATH = ROOT / "content" / "daily-blog" / "topics.json"

CELEB_KEYWORD = "celebrity birth card profile"
SLUG_SUFFIX = "-birth-card-profile"

MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}

DATE_IN_COPY_RE = re.compile(
    r"public birth date,\s+([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})"
)

# Identity only — Wikipedia titles for names that hit a disambiguation page.
# Never a date source.
WIKIPEDIA_TITLE_HINTS = {
    "drake": "Drake (musician)",
    "beyonce": "Beyoncé",
}


def fold_name(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", stripped.casefold()).strip()


def parse_human_date(month_name: str, day: str, year: str) -> str | None:
    month = MONTHS.get(month_name.casefold())
    if month is None:
        return None
    try:
        return date(int(year), month, int(day)).isoformat()
    except ValueError:
        return None


def parse_claimed_date(post: dict[str, Any]) -> str | None:
    blob = json.dumps(post, ensure_ascii=False)
    match = DATE_IN_COPY_RE.search(blob)
    if not match:
        return None
    return parse_human_date(match.group(1), match.group(2), match.group(3))


def display_name(post: dict[str, Any], topics: dict[str, dict[str, Any]]) -> str:
    topic = topics.get(post["slug"])
    if topic and topic.get("name"):
        return str(topic["name"])
    title = str(post.get("title") or "")
    if " Birth Card Profile" in title:
        return title.split(" Birth Card Profile", 1)[0]
    return title


def is_celeb_profile(post: dict[str, Any]) -> bool:
    slug = str(post.get("slug") or "")
    keywords = post.get("keywords") or []
    if slug.endswith(SLUG_SUFFIX):
        return True
    return CELEB_KEYWORD in keywords


def load_topics(path: Path = TOPICS_PATH) -> dict[str, dict[str, Any]]:
    if not path.is_file():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    figures = payload.get("figures") if isinstance(payload, dict) else payload
    out: dict[str, dict[str, Any]] = {}
    for item in figures or []:
        slug = str(item.get("slug") or "")
        if slug:
            out[slug] = item
    return out


def load_celeb_profiles(
    posts_path: Path = POSTS_PATH,
    topics_path: Path = TOPICS_PATH,
) -> list[dict[str, Any]]:
    posts = json.loads(posts_path.read_text(encoding="utf-8"))
    topics = load_topics(topics_path)
    profiles: list[dict[str, Any]] = []
    for post in posts:
        if not is_celeb_profile(post):
            continue
        topic = topics.get(post["slug"], {})
        claimed = topic.get("birthdate") or parse_claimed_date(post)
        name = display_name(post, topics)
        hint = WIKIPEDIA_TITLE_HINTS.get(fold_name(name))
        profiles.append(
            {
                "slug": post["slug"],
                "name": name,
                "claimed_birth_date": claimed,
                "wikipedia_title_hint": hint,
                "path": f"/blog/{post['slug']}",
            }
        )
    return profiles
