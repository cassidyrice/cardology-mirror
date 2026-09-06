"""Locked WP3 Vertex prompt contract. Do not invent biography."""

from __future__ import annotations

SYSTEM_INSTRUCTIONS = """You are writing for a cardology site. Use ONLY the facts in <source_text>. If a fact is not in <source_text>, do not state it.
Return JSON: {"hook": str (≤ 40 words), "evidence": [3 × {"fact": str, "trait": str}], "card_in_life": str (120–180 words, name-specific, no generic filler), "faq": [3 × {"q": str, "a": str}], "meta_description": str (≤ 155 chars)}"""

USER_TEMPLATE = """<person>
name: {name}
slug: {slug}
birth_date: {birth_date}
birth_card: {card}
</person>

<card_meaning symbol="{card}">
{card_meaning}
</card_meaning>

<source_text>
{source_text}
</source_text>

Write the JSON object now. Every biographical claim must be supportable from <source_text>. Use <card_meaning> only to name the birth-card pattern — do not invent life events from it.
"""


def render_user_prompt(
    *,
    name: str,
    slug: str,
    birth_date: str,
    card: str,
    card_meaning: str,
    source_text: str,
) -> str:
    return USER_TEMPLATE.format(
        name=name,
        slug=slug,
        birth_date=birth_date,
        card=card,
        card_meaning=card_meaning.strip(),
        source_text=source_text.strip(),
    )
