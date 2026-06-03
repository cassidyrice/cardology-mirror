"use client";

import { Fragment, type ReactNode } from "react";

// A tiny, dependency-free markdown renderer tuned for the streamed reading text.
// Supports: ## headings, - / * / 1. lists, **bold**, *italic*, blank-line paragraphs.
// Designed to render gracefully on partial (mid-stream) text.

type Block =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  const flushList = () => {
    if (list && list.items.length) {
      blocks.push(
        list.ordered
          ? { kind: "ol", items: list.items }
          : { kind: "ul", items: list.items },
      );
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h2 = line.match(/^##\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);

    if (h2) {
      flushPara();
      flushList();
      blocks.push({ kind: "h2", text: h2[1].trim() });
      continue;
    }
    if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1].trim());
      continue;
    }
    if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1].trim());
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    // accumulate paragraph
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return blocks;
}

// Inline: **bold** and *italic*. Italics carry the reflective-question accent.
function renderInline(text: string): ReactNode {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    if (m[2] != null) {
      out.push(
        <strong key={k++} className="font-semibold text-bone">
          {m[2]}
        </strong>,
      );
    } else if (m[3] != null) {
      out.push(<em key={k++}>{m[3]}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return out;
}

export function StreamedMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="prose-reading text-mist">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "h2":
            return (
              <h2
                key={i}
                className="display mb-3 mt-9 text-xl text-bone first:mt-0"
              >
                {renderInline(b.text)}
              </h2>
            );
          case "ul":
            return (
              <ul key={i} className="my-4 space-y-2 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                    <span>{renderInline(it)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="my-4 space-y-3 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-0.5 font-mono text-sm text-gold/80">
                      {j + 1}.
                    </span>
                    <span>{renderInline(it)}</span>
                  </li>
                ))}
              </ol>
            );
          default:
            return <p key={i}>{renderInline(b.text)}</p>;
        }
      })}
    </div>
  );
}
