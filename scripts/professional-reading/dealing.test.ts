import { expect, test } from "bun:test";
import engine from "../../lib/engine-core/engine.js";
import { buildProfessionalReading } from "./builder";
import { renderReport } from "./render";

test("printed left-to-right deal reproduces all 90 complete boards", () => {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  let deck = ["♥", "♣", "♦", "♠"].flatMap(s => ranks.map(r => r + s));
  const original = [...deck];
  const collapse = (piles: string[][]) => [...piles[3], ...piles[2], ...piles[1], ...piles[0]];
  for (let advance = 0; advance <= 90; advance++) {
    const board = engine.getSpread(advance);
    expect(deck).toEqual([...board.grid.flatMap((row: string[]) => [...row].reverse()), ...[...board.crown].reverse()]);
    if (advance === 90) break;
    let piles: string[][] = [[], [], [], []];
    for (let packet = 0; packet < 16; packet++) piles[packet % 4].unshift(...deck.slice(packet * 3, packet * 3 + 3));
    for (let i = 0; i < 4; i++) piles[i].unshift(deck[48 + i]);
    deck = collapse(piles);
    piles = [[], [], [], []];
    deck.forEach((card, i) => piles[i % 4].unshift(card));
    deck = collapse(piles);
    if (advance === 0) { expect(deck[0]).toBe("3♥"); expect(deck.at(-1)).toBe("K♠"); }
  }
  expect(deck).toEqual(original);
});

test("birthday formula matches all supported dates, with explicit Joker exception", () => {
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = ["♥", "♣", "♦", "♠"].flatMap(s => ranks.map(r => r + s));
  let checked = 0;
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    if (new Date(Date.UTC(2000, m - 1, d)).getUTCMonth() !== m - 1) continue;
    const date = `2000-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (m === 12 && d === 31) { expect(() => buildProfessionalReading("Reader", date, "2026-09-01")).toThrow("Joker"); continue; }
    const reading = buildProfessionalReading("Reader", date, "2026-09-01");
    expect(reading.anchors[0].card).toBe(deck[55 - (2 * m + d) - 1]); checked++;
  }
  expect(checked).toBe(365);
  const html = renderReport(buildProfessionalReading("Reader", "1991-02-17", "2026-09-01"));
  expect(html).toContain('id="deal-it-yourself"');
  expect(html).not.toContain("every seat is shared by seven dates");
  expect(html).not.toContain("top right corner");
});
