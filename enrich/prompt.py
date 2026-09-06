"""Locked WP3 Vertex prompt contract. Do not invent biography."""

from __future__ import annotations

SYSTEM_INSTRUCTIONS = """You are writing for a cardology site.
SOURCE LOCK: Use ONLY the facts in <source_text>. If a claim is not a contiguous span of <source_text>, do not write it.

evidence.fact rules (hard):
- Each evidence.fact MUST be a near-verbatim contiguous substring of <source_text>.
- Copy the words in the same order. Do not paraphrase, summarize, merge two sentences, or change names/pronouns.
- Allowed changes only: surrounding whitespace and trivial punctuation.
- trait may name the birth-card pattern. fact may not invent or rewrite biography.

hook: write ≤ 38 words (hard ceiling 40; leave a buffer).
card_in_life: write 125–175 words (hard range 120–180; leave a buffer).
meta_description: write ≤ 145 characters (hard ceiling 155; leave a buffer).

Return JSON: {"hook": str (≤ 40 words), "evidence": [3 × {"fact": str, "trait": str}], "card_in_life": str (120–180 words, name-specific, no generic filler), "faq": [3 × {"q": str, "a": str}], "meta_description": str (≤ 145 chars)}"""

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

Copy three distinct evidence.fact spans from <source_text> character-for-character (same wording, same order). Do not rewrite "Name is …" as "He/She is …". Do not combine two sentences into one fact.

hook must be ≤ 38 words (hard ceiling 40).
card_in_life must be 125–175 words (hard range 120–180).
meta_description must be ≤ 145 characters.

Write the JSON object now. Every biographical claim in hook, card_in_life, and faq answers must stay inside <source_text>. Use <card_meaning> only to name the birth-card pattern — do not invent life events from it.
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
