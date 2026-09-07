// Yearly Timing Map — SVG renderer. Pure string output, no DOM, edge-safe.
//
// A blueprint sheet: paper ground with a drafting grid, a double frame with
// registration marks, the year as a ring of seven 52-day sectors (clockwise
// from the birthday at 12 o'clock), the birth card in the hub, the year's
// fixed signals on a schematic bus to the right, and an engineering title
// block bottom-right. Colors are the paper brand tokens from app/globals.css.

import { parseCard } from "@/lib/cards";

import type { TimingMapModel, TimingMapPeriod } from "./model";

export const TIMING_MAP_WIDTH = 1600;
export const TIMING_MAP_HEIGHT = 1131; // √2 sheet

// Brand tokens (app/globals.css :root) — kept literal so the SVG is standalone.
const PAPER = "#f6f1e8";
const IVORY = "#fffcf7";
const INK = "#14110d";
const INK_SOFT = "#5b5148";
const INK_FAINT = "#756c61";
const BRONZE = "#735624";
const GOLD = "#b8893d";
const GOLD_SOFT = "rgba(184,137,61,0.16)";
const OXBLOOD = "#8e321f";
const LINE = "rgba(20,17,13,0.12)";
const LINE_STRONG = "rgba(20,17,13,0.22)";
const RED = "#8e321f"; // hearts + diamonds on paper
const BLACK = "#14110d"; // clubs + spades on paper

const SERIF = `'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`;
const MONO = `'Geist Mono', 'SFMono-Regular', Menlo, Consolas, monospace`;

// Wheel geometry
const CX = 600;
const CY = 575;
const R_OUT = 330;
const R_IN = 232;
const R_LABEL = R_OUT + 26;

// Signal bus geometry
const BUS_X = 1140;
const BUS_TOP = 150;
const BUS_BOTTOM = 800;
const SAT_Y = [200, 350, 500, 650, 800];

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function n(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180; // 0° at 12 o'clock, clockwise
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function sectorPath(rOut: number, rIn: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(rOut, a0);
  const [x1, y1] = polar(rOut, a1);
  const [x2, y2] = polar(rIn, a1);
  const [x3, y3] = polar(rIn, a0);
  return [
    `M ${n(x0)} ${n(y0)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${n(x1)} ${n(y1)}`,
    `L ${n(x2)} ${n(y2)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${n(x3)} ${n(y3)}`,
    "Z",
  ].join(" ");
}

function suitColor(code: string): string {
  const p = parseCard(code);
  if (!p) return INK;
  return p.suit === "hearts" || p.suit === "diamonds" ? RED : BLACK;
}

/** A schematic playing card: outline, rank in the corners, one suit pip. */
function miniCard(
  cx: number,
  cy: number,
  w: number,
  h: number,
  code: string | null,
  opts: { accent?: boolean } = {},
): string {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const rx = Math.max(3, w * 0.08);
  if (!code) {
    // Empty slot (Fixed cards have no environment/displacement).
    return [
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="${n(rx)}" fill="none" stroke="${INK_FAINT}" stroke-width="1.2" stroke-dasharray="4 3"/>`,
      `<line x1="${n(x + w * 0.25)}" y1="${n(y + h * 0.5)}" x2="${n(x + w * 0.75)}" y2="${n(y + h * 0.5)}" stroke="${INK_FAINT}" stroke-width="1.2"/>`,
    ].join("");
  }
  const p = parseCard(code);
  const rank = p?.rank ?? code;
  const glyph = p?.glyph ?? "";
  const color = suitColor(code);
  const rankSize = w * 0.3;
  const pipSize = w * 0.62;
  const stroke = opts.accent ? GOLD : INK;
  return [
    `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="${n(rx)}" fill="${IVORY}" stroke="${stroke}" stroke-width="${opts.accent ? 2 : 1.3}"/>`,
    `<text x="${n(x + w * 0.14)}" y="${n(y + h * 0.13 + rankSize * 0.72)}" font-family="${SERIF}" font-size="${n(rankSize)}" fill="${color}">${esc(rank)}</text>`,
    `<text x="${n(x + w * 0.14)}" y="${n(y + h * 0.13 + rankSize * 0.72)}" font-family="${SERIF}" font-size="${n(rankSize)}" fill="${color}" transform="rotate(180 ${n(cx)} ${n(cy)})">${esc(rank)}</text>`,
    `<text x="${n(cx)}" y="${n(cy + pipSize * 0.36)}" font-family="${SERIF}" font-size="${n(pipSize)}" fill="${color}" text-anchor="middle">${esc(glyph)}</text>`,
  ].join("");
}

function defs(): string {
  return `<defs>
  <pattern id="grid-minor" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${INK}" stroke-opacity="0.06" stroke-width="0.8"/>
  </pattern>
  <pattern id="grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
    <rect width="200" height="200" fill="url(#grid-minor)"/>
    <path d="M 200 0 L 0 0 0 200" fill="none" stroke="${INK}" stroke-opacity="0.13" stroke-width="0.9"/>
  </pattern>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="${OXBLOOD}"/>
  </marker>
</defs>`;
}

function frame(): string {
  const W = TIMING_MAP_WIDTH;
  const H = TIMING_MAP_HEIGHT;
  const marks: string[] = [];
  for (const [x, y] of [
    [20, 20],
    [W - 20, 20],
    [20, H - 20],
    [W - 20, H - 20],
  ] as const) {
    marks.push(
      `<path d="M ${x - 12} ${y} H ${x + 12} M ${x} ${y - 12} V ${y + 12}" stroke="${INK}" stroke-width="1" fill="none"/>`,
      `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="${INK}" stroke-width="1"/>`,
    );
  }
  return [
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>`,
    `<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="url(#grid-major)"/>`,
    `<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${INK}" stroke-width="1.6"/>`,
    `<rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="0.7"/>`,
    ...marks,
  ].join("\n");
}

function header(m: TimingMapModel): string {
  return [
    `<text x="72" y="92" font-family="${MONO}" font-size="13" letter-spacing="3.5" fill="${BRONZE}">CARD BLUEPRINTS · BLUEPRINT BREAKDOWN · BONUS SHEET</text>`,
    `<text x="72" y="146" font-family="${SERIF}" font-size="50" fill="${INK}">Yearly Timing Map</text>`,
    `<text x="72" y="178" font-family="${MONO}" font-size="13.5" letter-spacing="1.2" fill="${INK_SOFT}">CARDOLOGY YEAR · ${esc(m.cycleStartLabel.toUpperCase())} → ${esc(m.cycleEndLabel.toUpperCase())} · SEVEN 52-DAY PERIODS · BIRTH CARD ${esc(m.birthCard)}</text>`,
    `<line x1="72" y1="192" x2="${n(CX + R_OUT)}" y2="192" stroke="${LINE_STRONG}" stroke-width="1"/>`,
  ].join("\n");
}

function labelAnchor(deg: number): { anchor: string; dx: number } {
  const a = ((deg % 360) + 360) % 360;
  if (a > 20 && a < 160) return { anchor: "start", dx: 6 };
  if (a > 200 && a < 340) return { anchor: "end", dx: -6 };
  return { anchor: "middle", dx: 0 };
}

function wheel(m: TimingMapModel): string {
  const out: string[] = [];
  const degPerDay = 360 / m.yearDays;

  // Orbits (dashed, the brand's ambient language) and the hub circle.
  out.push(
    `<circle cx="${CX}" cy="${CY}" r="${R_OUT + 58}" fill="none" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="0.8" stroke-dasharray="2 5"/>`,
    `<circle cx="${CX}" cy="${CY}" r="${R_OUT}" fill="none" stroke="${INK}" stroke-width="1.4"/>`,
    `<circle cx="${CX}" cy="${CY}" r="${R_IN}" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>`,
    `<circle cx="${CX}" cy="${CY}" r="${R_IN - 14}" fill="none" stroke="${LINE_STRONG}" stroke-width="0.8" stroke-dasharray="3 4"/>`,
  );

  // Sectors
  for (const p of m.periods) {
    const a0 = p.startDay * degPerDay;
    const a1 = p.endDay * degPerDay;
    const mid = (a0 + a1) / 2;
    out.push(
      `<path d="${sectorPath(R_OUT, R_IN, a0, a1)}" fill="${p.active ? GOLD_SOFT : "none"}" stroke="${p.active ? GOLD : INK}" stroke-width="${p.active ? 2 : 1.1}"/>`,
    );
    // Boundary tick
    const [tx0, ty0] = polar(R_IN - 8, a0);
    const [tx1, ty1] = polar(R_OUT + 10, a0);
    out.push(`<line x1="${n(tx0)}" y1="${n(ty0)}" x2="${n(tx1)}" y2="${n(ty1)}" stroke="${INK}" stroke-width="1"/>`);
    // Period number at the inner edge
    const [nx, ny] = polar(R_IN + 16, mid);
    out.push(
      `<text x="${n(nx)}" y="${n(ny + 4)}" font-family="${MONO}" font-size="10.5" fill="${INK_FAINT}" text-anchor="middle">${String(p.index + 1).padStart(2, "0")}</text>`,
    );
    // Card at the ring's mid radius
    const [cx, cy] = polar((R_OUT + R_IN) / 2 + 8, mid);
    out.push(miniCard(cx, cy, 40, 56, p.card, { accent: p.active }));
    // Labels outside
    const [lx, ly] = polar(R_LABEL, mid);
    const { anchor, dx } = labelAnchor(mid);
    const yShift = mid > 90 && mid < 270 ? 12 : -4;
    out.push(
      `<text x="${n(lx + dx)}" y="${n(ly + yShift)}" font-family="${MONO}" font-size="14" font-weight="700" letter-spacing="2" fill="${p.active ? GOLD : INK}" text-anchor="${anchor}">${p.planet.toUpperCase()}</text>`,
      `<text x="${n(lx + dx)}" y="${n(ly + yShift + 17)}" font-family="${MONO}" font-size="12" fill="${INK_SOFT}" text-anchor="${anchor}">${esc(p.startLabel)} – ${esc(p.lastLabel)} · ${p.days} d</text>`,
    );
  }

  // NOW marker
  const nowDeg = (m.todayDay + 0.5) * degPerDay;
  const [nx0, ny0] = polar(R_IN - 22, nowDeg);
  const [nx1, ny1] = polar(R_OUT + 44, nowDeg);
  const [ndx, ndy] = polar(R_OUT + 44, nowDeg);
  out.push(
    `<line x1="${n(nx0)}" y1="${n(ny0)}" x2="${n(nx1)}" y2="${n(ny1)}" stroke="${GOLD}" stroke-width="2.4"/>`,
    `<circle cx="${n(ndx)}" cy="${n(ndy)}" r="6" fill="${GOLD}" stroke="${PAPER}" stroke-width="2"/>`,
  );

  // Birthday marker at 12 o'clock
  const [bx, by] = polar(R_OUT + 12, 0);
  out.push(
    `<path d="M ${n(bx)} ${n(by)} l -7 -12 h 14 z" fill="${OXBLOOD}"/>`,
    `<text x="${CX}" y="${n(CY - R_OUT - 32)}" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${OXBLOOD}" text-anchor="middle">BIRTHDAY · YEAR OPENS</text>`,
  );

  // Hub: birth card + ruling card
  out.push(
    `<text x="${CX}" y="${CY - 112}" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${BRONZE}" text-anchor="middle">BIRTH CARD</text>`,
    miniCard(CX, CY - 22, 84, 118, m.birthCard),
    `<text x="${CX}" y="${CY + 62}" font-family="${SERIF}" font-size="20" fill="${INK}" text-anchor="middle">${esc(m.birthCardLabel)}</text>`,
    `<text x="${CX}" y="${CY + 84}" font-family="${MONO}" font-size="11" letter-spacing="1.5" fill="${INK_SOFT}" text-anchor="middle">AGE ${m.age} · RULING CARD ${esc(m.rulingCard)}</text>`,
    `<text x="${CX}" y="${CY + 108}" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="2" fill="${GOLD}" text-anchor="middle">NOW · ${esc(m.todayLabel.toUpperCase())} · ${esc(m.activePlanet.toUpperCase())} DAY ${m.dayInActive} OF ${m.periods.find((p) => p.active)?.days ?? 52}</text>`,
  );

  return out.join("\n");
}

function bus(m: TimingMapModel): string {
  const out: string[] = [];
  // Trunk from the hub's right edge to the bus, with a junction and arrow.
  const trunkY = CY;
  out.push(
    `<line x1="${n(CX + R_OUT + 66)}" y1="${trunkY}" x2="${BUS_X - 6}" y2="${trunkY}" stroke="${OXBLOOD}" stroke-width="1.2" stroke-dasharray="6 5" marker-end="url(#arrow)"/>`,
    `<circle cx="${n(CX + R_OUT + 66)}" cy="${trunkY}" r="4" fill="${PAPER}" stroke="${OXBLOOD}" stroke-width="1.4"/>`,
    `<line x1="${BUS_X}" y1="${BUS_TOP}" x2="${BUS_X}" y2="${BUS_BOTTOM}" stroke="${OXBLOOD}" stroke-width="1.6"/>`,
    `<text x="${BUS_X}" y="${BUS_TOP - 16}" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${BRONZE}" text-anchor="middle">FIXED FOR THE YEAR</text>`,
  );
  m.satellites.forEach((s, i) => {
    const y = SAT_Y[i];
    const cardX = BUS_X + 62;
    out.push(
      `<circle cx="${BUS_X}" cy="${y}" r="5" fill="${OXBLOOD}"/>`,
      `<line x1="${BUS_X + 5}" y1="${y}" x2="${cardX - 26}" y2="${y}" stroke="${OXBLOOD}" stroke-width="1.2"/>`,
      miniCard(cardX, y, 46, 64, s.card),
      `<text x="${cardX + 40}" y="${y - 4}" font-family="${MONO}" font-size="14" font-weight="700" letter-spacing="2" fill="${INK}">${esc(s.label.toUpperCase())}</text>`,
      `<text x="${cardX + 40}" y="${y + 16}" font-family="${MONO}" font-size="12" fill="${INK_SOFT}">${esc(s.note)}</text>`,
      `<text x="${cardX + 40}" y="${y + 34}" font-family="${SERIF}" font-size="15" fill="${s.card ? INK : INK_FAINT}">${esc(s.card ? (parseCard(s.card)?.label ?? s.card) : "—")}</text>`,
    );
  });
  return out.join("\n");
}

function legend(): string {
  const x = 72;
  const y = 975;
  const lines = [
    "01  The ring is your year, birthday to birthday, clockwise. Each 52-day sector is ruled by a planet; its card governs that stretch.",
    "02  The gold sector and the NOW tick are the period you are in today.",
    "03  The bus on the right carries the year's fixed signals: Long Range (7-year cycle), Pluto, Result, Environment, Displacement.",
    "04  Neptune runs to the eve of your next birthday. Playing cards, not tarot. A mirror, not a forecast.",
  ];
  return [
    `<text x="${x}" y="${y}" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${BRONZE}">READING THE SHEET</text>`,
    `<line x1="${x}" y1="${y + 10}" x2="${x + 900}" y2="${y + 10}" stroke="${LINE_STRONG}" stroke-width="1"/>`,
    ...lines.map(
      (l, i) =>
        `<text x="${x}" y="${y + 32 + i * 22}" font-family="${MONO}" font-size="11.5" fill="${INK_SOFT}">${esc(l)}</text>`,
    ),
  ].join("\n");
}

function titleBlock(m: TimingMapModel): string {
  const x = 1090;
  const y = 850;
  const w = 470;
  const rowH = 30;
  const rows: [string, string][] = [
    ["DRAWING", "YEARLY TIMING MAP"],
    ["BIRTHDAY", m.birthdate],
    ["BIRTH CARD", `${m.birthCard}  ${m.birthCardLabel}`],
    ["CYCLE", `${m.cycleStartLabel} – ${m.cycleEndLabel}`],
    ["ACTIVE", `${m.activePlanet} · day ${m.dayInActive}`],
    ["ISSUED", `${m.todayISO} · sheet 1 of 1`],
  ];
  const h = rowH * rows.length + 46;
  const out = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${IVORY}" stroke="${INK}" stroke-width="1.4"/>`,
    `<text x="${x + 16}" y="${y + 28}" font-family="${SERIF}" font-size="21" fill="${INK}">Card Blueprints</text>`,
    `<text x="${x + w - 16}" y="${y + 28}" font-family="${MONO}" font-size="10.5" letter-spacing="2" fill="${INK_SOFT}" text-anchor="end">CARDBLUEPRINTS.COM</text>`,
    `<line x1="${x}" y1="${y + 40}" x2="${x + w}" y2="${y + 40}" stroke="${INK}" stroke-width="1"/>`,
    `<line x1="${x + 132}" y1="${y + 40}" x2="${x + 132}" y2="${y + h}" stroke="${INK}" stroke-width="0.8"/>`,
  ];
  rows.forEach(([k, v], i) => {
    const ry = y + 40 + rowH * (i + 1);
    out.push(
      `<line x1="${x}" y1="${ry}" x2="${x + w}" y2="${ry}" stroke="${LINE}" stroke-width="0.8"/>`,
      `<text x="${x + 16}" y="${ry - 10}" font-family="${MONO}" font-size="10.5" letter-spacing="2" fill="${BRONZE}">${esc(k)}</text>`,
      `<text x="${x + 148}" y="${ry - 9}" font-family="${MONO}" font-size="13" fill="${INK}">${esc(v)}</text>`,
    );
  });
  return out.join("\n");
}

export function renderTimingMapSvg(m: TimingMapModel): string {
  const title = `Yearly Timing Map — ${m.birthCardLabel}, ${m.cycleStartLabel} to ${m.cycleEndLabel}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TIMING_MAP_WIDTH} ${TIMING_MAP_HEIGHT}" width="${TIMING_MAP_WIDTH}" height="${TIMING_MAP_HEIGHT}" role="img" aria-labelledby="t" font-family="${SERIF}">
<title id="t">${esc(title)}</title>
${defs()}
${frame()}
${header(m)}
${wheel(m)}
${bus(m)}
${legend()}
${titleBlock(m)}
</svg>
`;
}

/** The Joker (Dec 31) has no yearly spread; the sheet says so instead of failing. */
export function renderTimingMapJokerSvg(birthdate: string): string {
  const W = TIMING_MAP_WIDTH;
  const H = TIMING_MAP_HEIGHT;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<title>Yearly Timing Map — December 31, the Joker</title>
${defs()}
${frame()}
<text x="72" y="92" font-family="${MONO}" font-size="13" letter-spacing="3.5" fill="${BRONZE}">CARD BLUEPRINTS · BLUEPRINT BREAKDOWN · BONUS SHEET</text>
<text x="72" y="146" font-family="${SERIF}" font-size="50" fill="${INK}">Yearly Timing Map</text>
<circle cx="${CX}" cy="${CY}" r="${R_OUT}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="6 6"/>
<text x="${CX}" y="${CY - 10}" font-family="${SERIF}" font-size="34" fill="${INK}" text-anchor="middle">December 31 is the Joker.</text>
<text x="${CX}" y="${CY + 30}" font-family="${MONO}" font-size="13" fill="${INK_SOFT}" text-anchor="middle">The Joker sits outside the yearly spreads, so there is no 52-day map to draw for ${esc(birthdate)}.</text>
</svg>
`;
}

export type { TimingMapModel, TimingMapPeriod };
