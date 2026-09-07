#!/usr/bin/env python3
"""Transform: apply the senators "record + congruence" pattern to the other
people hubs, and then to the thirteen birth-card directory packs.

The five people hubs (governors, signers, cabinet, scotus, nobel) were generated
from one template and their copy.ts / render-person.ts are byte-identical in the
regions this touches. Rather than hand-edit five near-identical files, this
script applies the same five changes to each and reports what it matched, so a
silent miss becomes a visible failure.

Changes per hub:
  types.ts         + optional source_text_full
  load.ts          + carry source_text_full through the row whitelist
  copy.ts          + sourceProse(), record[] (lead sentences after the hook),
                     evidence no longer repeats the hook
  render-person.ts + record section, congruence section, conditional evidence

Run from the repo root:  python3 seo-pages/scripts/apply-record-pattern.py
Idempotent: a hub already carrying the pattern is skipped.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SRC = Path("seo-pages/src")

HUBS = {
    # hub: (RowType, "what the page must not be read as forecasting")
    "governors": ("GovernorRow", "a governorship"),
    "signers": ("SignerRow", "the Revolution"),
    "cabinet": ("CabinetRow", "a Cabinet post"),
    "scotus": ("ScotusRow", "the Court"),
    "nobel": ("NobelRow", "a Nobel Prize"),
}


class Miss(Exception):
    pass


def sub_once(text: str, old: str, new: str, what: str) -> str:
    if new in text:
        raise Miss(f"already applied: {what}")
    if text.count(old) != 1:
        raise Miss(f"expected exactly 1 match for {what}, found {text.count(old)}")
    return text.replace(old, new)


def patch_types(path: Path) -> str:
    t = path.read_text(encoding="utf-8")
    return sub_once(
        t,
        "  source_text: string;\n",
        "  source_text: string;\n"
        "  /**\n"
        "   * Full Wikipedia lead section (Action API `prop=extracts&exintro`), same\n"
        "   * article and licence as `source_text`, just more of it. Populated by\n"
        "   * `python3 -m pipeline.wikipedia_intro`. Optional so older rows still load.\n"
        "   */\n"
        "  source_text_full?: string;\n",
        "types.ts source_text_full",
    )


def patch_load(path: Path) -> str:
    t = path.read_text(encoding="utf-8")
    t = sub_once(
        t,
        '    source_text: requiredString(raw, "source_text", line),\n',
        '    source_text: requiredString(raw, "source_text", line),\n'
        '    source_text_full: optionalPlainString(raw, "source_text_full") || undefined,\n',
        "load.ts row field",
    )
    if "function optionalPlainString(" not in t:
        t += (
            "\nfunction optionalPlainString(raw: Record<string, unknown>, key: string): string {\n"
            "  const value = raw[key];\n"
            '  return typeof value === "string" ? value.trim() : "";\n'
            "}\n"
        )
    return t


def patch_copy(path: Path, row_type: str) -> str:
    t = path.read_text(encoding="utf-8")

    t = sub_once(
        t,
        "  evidence: string[];\n",
        "  /** Lead-section prose after the opening sentence. Never repeats the hook. */\n"
        "  record: string[];\n"
        "  evidence: string[];\n",
        "copy.ts Copy type",
    )

    # sourceProse helper, inserted before the SENTENCE_RE constant
    t = sub_once(
        t,
        "const SENTENCE_RE =",
        "/** Longest verified text for this person: the full lead section when we have it. */\n"
        f"export function sourceProse(person: {row_type}): string {{\n"
        '  const full = (person.source_text_full ?? "").trim();\n'
        '  const short = (person.source_text ?? "").trim();\n'
        "  return full.length > short.length ? full : short;\n"
        "}\n\n"
        "const SENTENCE_RE =",
        "copy.ts sourceProse",
    )

    t = sub_once(
        t,
        "  const sentences = splitSourceSentences(person.source_text);\n"
        "  const first = sentences[0] ?? person.source_text.trim();\n",
        "  const prose = sourceProse(person);\n"
        "  const sentences = splitSourceSentences(prose);\n"
        "  const first = sentences[0] ?? prose.trim();\n"
        "  // Everything after the opening sentence, so the record section never repeats\n"
        "  // the hook. Capped so a very long lead does not swamp the page.\n"
        "  const record = sentences.slice(1, 9);\n",
        "copy.ts sentences",
    )

    t = sub_once(
        t,
        "  const evidence = evidenceFromSummary(person, sentences);\n",
        "  const evidence = evidenceFromSummary(person, sentences.slice(1 + record.length));\n",
        "copy.ts evidence call",
    )

    t = sub_once(
        t,
        "  return { hook, card_meaning: cardMeaning, evidence, faqs };\n",
        "  return { hook, card_meaning: cardMeaning, record, evidence, faqs };\n",
        "copy.ts return",
    )

    # Replace the whole padding-based evidenceFromSummary with a plain slice.
    pattern = re.compile(
        r"function evidenceFromSummary\([\s\S]*?\n\}\n",
        re.MULTILINE,
    )
    if not pattern.search(t):
        raise Miss("copy.ts evidenceFromSummary body")
    t = pattern.sub(
        "/**\n"
        " * Remaining lead-section sentences, if the article had more than the record\n"
        " * section used. Returns an empty list rather than padding with boilerplate —\n"
        " * a short article should produce a shorter page, not a repeated one.\n"
        " */\n"
        f"function evidenceFromSummary(_person: {row_type}, remaining: string[]): string[] {{\n"
        "  return remaining.slice(0, 4);\n"
        "}\n",
        t,
        count=1,
    )
    return t


def patch_render(path: Path, hub: str, not_forecast: str) -> str:
    t = path.read_text(encoding="utf-8")

    t = sub_once(
        t,
        "import { escapeHtml } from",
        'import { renderCongruenceSection } from "../congruence-render";\nimport { escapeHtml } from',
        "render import",
    )

    # copy.ts import: add sourceProse alongside the existing copy fn
    m = re.search(r'import \{ (\w+Copy) \} from "\./copy";', t)
    if not m:
        raise Miss("render copy import")
    t = t.replace(m.group(0), f'import {{ {m.group(1)}, sourceProse }} from "./copy";', 1)

    old_evidence = (
        '    <section data-slot="evidence">\n'
        "      <h2>From the Wikipedia summary</h2>\n"
        "      <ol>\n"
        '        ${copy.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("\\n        ")}\n'
        "      </ol>\n"
        "    </section>\n"
    )
    if old_evidence not in t:
        raise Miss("render evidence block")
    t = t.replace(old_evidence, "    ${recordSection}\n\n    ${congruenceSection}\n\n    ${evidenceSection}\n", 1)

    # Build the three consts just before the body template literal.
    anchor = "  const body = `"
    if anchor not in t:
        raise Miss("render body anchor")
    consts = f"""  const congruenceSection = renderCongruenceSection({{
    name: person.name,
    prose: sourceProse(person),
    birthSymbol: person.card,
    sourceUrl: person.source_url,
    sourceTitle: person.wikipedia_title,
    notAForecastOf: "{not_forecast}",
  }});

  const recordSection = copy.record.length
    ? `<section data-slot="record">
      <h2>${{escapeHtml(person.name)}} in the public record</h2>
      <p>${{escapeHtml(copy.record.join(" "))}}</p>
      <p class="attribution">Summarised from the lead section of the Wikipedia article
        <a href="${{escapeHtml(person.source_url)}}">${{escapeHtml(person.wikipedia_title)}}</a>
        (CC BY-SA 4.0). No biographical facts were written for this page beyond that article.</p>
    </section>`
    : "";

  const evidenceSection = copy.evidence.length
    ? `<section data-slot="evidence">
      <h2>Also on the record</h2>
      <ol>
        ${{copy.evidence.map((item) => `<li>${{escapeHtml(item)}}</li>`).join("\\n        ")}}
      </ol>
    </section>`
    : "";

"""
    t = t.replace(anchor, consts + anchor, 1)
    return t


def apply_hubs() -> int:
    if not SRC.is_dir():
        print("run from the repo root", file=sys.stderr)
        return 2
    failures = 0
    for hub, (row_type, not_forecast) in HUBS.items():
        print(f"=== {hub}")
        jobs = [
            ("types.ts", lambda p: patch_types(p)),
            ("load.ts", lambda p: patch_load(p)),
            ("copy.ts", lambda p, rt=row_type: patch_copy(p, rt)),
            ("render-person.ts", lambda p, h=hub, nf=not_forecast: patch_render(p, h, nf)),
        ]
        staged: list[tuple[Path, str]] = []
        ok = True
        for filename, fn in jobs:
            path = SRC / hub / filename
            try:
                staged.append((path, fn(path)))
            except Miss as exc:
                print(f"  SKIP {filename}: {exc}")
                ok = False
            except Exception as exc:  # noqa: BLE001
                print(f"  FAIL {filename}: {exc}")
                ok = False
        if not ok:
            failures += 1
            print(f"  -> {hub} not written (all-or-nothing)")
            continue
        for path, text in staged:
            path.write_text(text, encoding="utf-8")
            print(f"  wrote {path}")
    return 1 if failures else 0




# ---------------------------------------------------------------------------
# The thirteen birth-card directory packs.
#
# These were generated from the same template as the five hubs above, but each
# grew its own structured-facts sections (medals, ledgers, award tables), so
# copy.ts and render-person.ts are no longer byte-identical. The anchors below
# are the regions that ARE still identical; everything pack-specific is matched
# by regex and left alone. As above, every patch is all-or-nothing per pack and
# a missed anchor is a loud failure, never a silent skip.
#
# Two names differ from the senators pattern on purpose:
#   * the Copy field is `source_record`, not `record` — olympics/winter already
#     has a `record` string of structured facts and nfl-hof has a `record` local
#     variable, and neither should be renamed to make the template fit;
#   * nfl-hof renders `data-slot="source-record"` because its career table
#     already owns `data-slot="record"`.
# ---------------------------------------------------------------------------

PACKS = {
    # pack dir: (RowType, notAForecastOf, record data-slot)
    "olympics": ("OlympicRow", "a gold medal", "record"),
    "olympics/winter": ("WinterMedalistRow", "a gold medal", "record"),
    "tonys": ("TonyRow", "a Tony", "record"),
    "oscars": ("OscarRow", "an Oscar", "record"),
    "emmys": ("EmmyRow", "an Emmy", "record"),
    "grammys": ("GrammyRow", "a Grammy", "record"),
    "nfl-hof": ("HofRow", "induction", "source-record"),
    "rock-hall": ("RockHallRow", "induction", "record"),
    "pulitzer-fiction": ("PulitzerRow", "a Pulitzer", "record"),
    "house-chairs": ("HouseChairRow", "a chairmanship", "record"),
    "kennedy-center-honors": ("KennedyCenterRow", "an honor", "record"),
    "time-poty": ("TimePotyRow", "the cover of Time", "record"),
    "astronauts": ("AstronautRow", "a spaceflight", "record"),
}

EVIDENCE_BLOCK = (
    '    <section data-slot="evidence">\n'
    "      <h2>From the Wikipedia summary</h2>\n"
    "      <ol>\n"
    '        ${copy.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("\\n        ")}\n'
    "      </ol>\n"
    "    </section>\n"
)


def up(pack: str) -> str:
    """Relative prefix back to seo-pages/src (olympics/winter is one deeper)."""
    return "../" * (pack.count("/") + 1)


def pack_types(path: Path, pack: str, row_type: str) -> str:
    return patch_types(path)


def pack_load(path: Path, pack: str, row_type: str) -> str:
    return patch_load(path)


def pack_copy(path: Path, pack: str, row_type: str) -> str:
    t = path.read_text(encoding="utf-8")
    prefix = up(pack)

    if f'from "{prefix}source-text"' in t:
        raise Miss("already applied: copy.ts source-text import")
    # Imports are sorted; the row-type import from "./types" always follows the
    # shared ones, so inserting before it keeps the order valid.
    m = re.search(r'^import type \{[^}]*\} from "\./types";\n', t, re.MULTILINE)
    if not m:
        raise Miss("copy.ts ./types import")
    t = t[: m.start()] + f'import {{ longestSourceProse }} from "{prefix}source-text";\n' + t[m.start() :]

    t = sub_once(
        t,
        "  evidence: string[];\n",
        "  /** Lead-section prose after the opening sentence. Never repeats the hook. */\n"
        "  source_record: string[];\n"
        "  evidence: string[];\n",
        "copy.ts Copy type",
    )

    t = sub_once(
        t,
        "const SENTENCE_RE =",
        "/** Longest verified text for this person: the full lead section when we have it. */\n"
        f"export function sourceProse(person: {row_type}): string {{\n"
        "  return longestSourceProse(person);\n"
        "}\n\n"
        "const SENTENCE_RE =",
        "copy.ts sourceProse",
    )

    t = sub_once(
        t,
        "  const sentences = splitSourceSentences(person.source_text);\n",
        "  const prose = sourceProse(person);\n"
        "  const sentences = splitSourceSentences(prose);\n"
        "  // Everything after the opening sentence, so the record section never repeats\n"
        "  // the hook. Capped so a very long lead does not swamp the page.\n"
        "  const sourceRecord = sentences.slice(1, 9);\n",
        "copy.ts sentences",
    )

    # The hook's fallback for a one-sentence article must follow the same prose.
    t = t.replace("sentences[0] ?? person.source_text.trim()", "sentences[0] ?? prose.trim()")

    if "evidenceFromSummary(person, sentences)" in t:
        t = sub_once(
            t,
            "evidenceFromSummary(person, sentences)",
            "evidenceFromSummary(person, sentences.slice(1 + sourceRecord.length))",
            "copy.ts evidence call",
        )
        pattern = re.compile(r"function evidenceFromSummary\([\s\S]*?\n\}\n", re.MULTILINE)
        if not pattern.search(t):
            raise Miss("copy.ts evidenceFromSummary body")
        t = pattern.sub(
            "/**\n"
            " * Remaining lead-section sentences, if the article had more than the record\n"
            " * section used. Returns an empty list rather than padding with boilerplate —\n"
            " * a short article should produce a shorter page, not a repeated one.\n"
            " */\n"
            f"function evidenceFromSummary(_person: {row_type}, remaining: string[]): string[] {{\n"
            "  return remaining.slice(0, 4);\n"
            "}\n",
            t,
            count=1,
        )
    elif "containedEvidence(person.source_text)" in t:
        # nfl-hof took a different route to the same list. Same replacement.
        t = sub_once(
            t,
            "  const evidence = containedEvidence(person.source_text);\n",
            "  const evidence = sentences.slice(1 + sourceRecord.length, 5 + sourceRecord.length);\n",
            "copy.ts containedEvidence call",
        )
    else:
        raise Miss("copy.ts evidence call")

    # Return object: the packs carry different extra fields in different orders
    # (medal_note, ledger, coordinate...), so match the whole shorthand object
    # and prepend the new field rather than assuming where `evidence` sits.
    m = re.search(r"^  return \{ ([^}]*evidence[^}]*) \};\n", t, re.MULTILINE)
    if not m:
        raise Miss("copy.ts return")
    t = t[: m.start()] + f"  return {{ source_record: sourceRecord, {m.group(1)} }};\n" + t[m.end() :]
    return t


def pack_render(path: Path, pack: str, row_type: str) -> str:
    t = path.read_text(encoding="utf-8")
    prefix = up(pack)
    not_forecast = PACKS[pack][1]
    slot = PACKS[pack][2]

    t = sub_once(
        t,
        f'import {{ escapeHtml }} from "{prefix}escape";',
        f'import {{ renderCongruenceSection }} from "{prefix}congruence-render";\n'
        f'import {{ escapeHtml }} from "{prefix}escape";',
        "render import",
    )

    m = re.search(r'import \{ (\w+Copy) \} from "\./copy";', t)
    if not m:
        raise Miss("render copy import")
    t = t.replace(m.group(0), f'import {{ {m.group(1)}, sourceProse }} from "./copy";', 1)

    if EVIDENCE_BLOCK not in t:
        raise Miss("render evidence block")
    t = t.replace(
        EVIDENCE_BLOCK,
        "    ${recordSection}\n\n    ${congruenceSection}\n\n    ${evidenceSection}\n",
        1,
    )

    anchor = "  const body = `"
    if anchor not in t:
        raise Miss("render body anchor")
    consts = f"""  const congruenceSection = renderCongruenceSection({{
    name: person.name,
    prose: sourceProse(person),
    birthSymbol: person.card,
    birthDate: person.birth_date,
    sourceUrl: person.source_url,
    sourceTitle: person.wikipedia_title,
    notAForecastOf: "{not_forecast}",
  }});

  const recordSection = copy.source_record.length
    ? `<section data-slot="{slot}">
      <h2>${{escapeHtml(person.name)}} in the public record</h2>
      <p>${{escapeHtml(copy.source_record.join(" "))}}</p>
      <p class="attribution">Summarised from the lead section of the Wikipedia article
        <a href="${{escapeHtml(person.source_url)}}">${{escapeHtml(person.wikipedia_title)}}</a>
        (CC BY-SA 4.0). No biographical facts were written for this page beyond that article.</p>
    </section>`
    : "";

  const evidenceSection = copy.evidence.length
    ? `<section data-slot="evidence">
      <h2>Also on the record</h2>
      <ol>
        ${{copy.evidence.map((item) => `<li>${{escapeHtml(item)}}</li>`).join("\\n        ")}}
      </ol>
    </section>`
    : "";

"""
    t = t.replace(anchor, consts + anchor, 1)
    return t


def apply_packs() -> int:
    failures = 0
    for pack, (row_type, _not_forecast, _slot) in PACKS.items():
        print(f"=== {pack}")
        jobs = [
            ("types.ts", pack_types),
            ("load.ts", pack_load),
            ("copy.ts", pack_copy),
            ("render-person.ts", pack_render),
        ]
        staged: list[tuple[Path, str]] = []
        ok = True
        for filename, fn in jobs:
            path = SRC / pack / filename
            try:
                staged.append((path, fn(path, pack, row_type)))
            except Miss as exc:
                print(f"  SKIP {filename}: {exc}")
                ok = False
            except Exception as exc:  # noqa: BLE001
                print(f"  FAIL {filename}: {exc}")
                ok = False
        if not ok:
            failures += 1
            print(f"  -> {pack} not written (all-or-nothing)")
            continue
        for path, text in staged:
            path.write_text(text, encoding="utf-8")
            print(f"  wrote {path}")
    return 1 if failures else 0


def main() -> int:
    if not SRC.is_dir():
        print("run from the repo root", file=sys.stderr)
        return 2
    which = sys.argv[1] if len(sys.argv) > 1 else "packs"
    if which == "hubs":
        return apply_hubs()
    if which == "packs":
        return apply_packs()
    print("usage: apply-record-pattern.py [hubs|packs]", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
