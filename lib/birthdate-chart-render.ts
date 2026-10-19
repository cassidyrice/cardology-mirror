/** Browser-only: draws the one-page birthdate chart PNG on a canvas. */
import type { BirthdateChart, ChartCard } from "@/lib/birthdate-chart";
import { shareFacePathFromCode } from "@/lib/share-cards";

const W = 1200;
const H = 1600;
const PAPER = "#f8fbfd";
const INK = "#123a63";
const INK_SOFT = "#3c6089";
const BRONZE = "#735624";
const GOLD = "#b8893d";
const LINE = "rgba(18, 58, 99, 0.18)";
const SERIF = `"Times New Roman", Georgia, serif`;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawFace(ctx: CanvasRenderingContext2D, code: string, x: number, y: number, w: number) {
  const h = Math.round(w * 1.5);
  const r = w * 0.055;
  const path = shareFacePathFromCode(code);
  const img = path ? await loadImage(path) : null;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  rounded(ctx, x, y, w, h, r);
  ctx.fillStyle = "#fffef9";
  ctx.fill();
  ctx.shadowColor = "transparent";
  rounded(ctx, x, y, w, h, r);
  ctx.clip();
  if (img) ctx.drawImage(img, x, y, w, h);
  ctx.restore();
  ctx.save();
  rounded(ctx, x, y, w, h, r);
  ctx.strokeStyle = "#2c2a28";
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.stroke();
  ctx.restore();
  return h;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function paragraph(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, align: CanvasTextAlign = "left") {
  ctx.textAlign = align;
  const lines = wrap(ctx, text, maxW);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return lines.length * lh;
}

function eyebrow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: CanvasTextAlign = "left") {
  ctx.font = `600 22px ${SERIF}`;
  ctx.fillStyle = BRONZE;
  ctx.textAlign = align;
  const spaced = text.toUpperCase().split("").join("\u200A");
  ctx.fillText(spaced, x, y);
}

async function smallCard(ctx: CanvasRenderingContext2D, role: string, card: ChartCard, x: number, y: number, w: number) {
  eyebrow(ctx, role, x + w / 2, y, "center");
  const h = await drawFace(ctx, card.code, x, y + 20, w);
  ctx.font = `400 28px ${SERIF}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText(card.label, x + w / 2, y + 20 + h + 40);
}

export async function renderBirthdateChartPng(chart: BirthdateChart): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Header
  eyebrow(ctx, "Card Blueprints", W / 2, 118, "center");
  ctx.font = `400 64px ${SERIF}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText("Your Birthdate Chart", W / 2, 196);
  ctx.font = `italic 400 32px ${SERIF}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText(`Born ${chart.dateLabel}`, W / 2, 246);

  // Birth card
  const faceW = 300;
  const faceX = 120;
  const faceY = 300;
  const faceH = await drawFace(ctx, chart.birth.code, faceX, faceY, faceW);

  const tx = faceX + faceW + 60;
  const tw = W - tx - 120;
  eyebrow(ctx, "Your birth card", tx, faceY + 30);
  ctx.font = `400 54px ${SERIF}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.fillText(chart.birth.label, tx, faceY + 96);
  let ty = faceY + 150;
  if (chart.strength) {
    eyebrow(ctx, chart.isJoker ? "About your card" : "Your strength", tx, ty);
    ctx.font = `400 28px ${SERIF}`;
    ctx.fillStyle = INK;
    ty += paragraph(ctx, chart.strength, tx, ty + 40, tw, 38) + 50;
  }
  if (chart.shadow) {
    eyebrow(ctx, "Where it trips you", tx, ty);
    ctx.font = `400 26px ${SERIF}`;
    ctx.fillStyle = INK_SOFT;
    ty += paragraph(ctx, chart.shadow, tx, ty + 40, tw, 36) + 30;
  }

  // Divider
  const rowY = Math.max(faceY + faceH, ty) + 60;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(120, rowY);
  ctx.lineTo(W - 120, rowY);
  ctx.stroke();

  // Supporting cards
  const supports: { role: string; card: ChartCard }[] = [
    ...chart.ruling.map((c) => ({ role: "Ruling card", card: c })),
    ...(chart.karma
      ? [
          { role: "Environment", card: chart.karma.environment },
          { role: "Displacement", card: chart.karma.displacement },
        ]
      : []),
  ];
  let bottomY = rowY + 40;
  if (supports.length > 0) {
    const sw = 190;
    const gap = 80;
    const total = supports.length * sw + (supports.length - 1) * gap;
    let sx = (W - total) / 2;
    for (const s of supports) {
      await smallCard(ctx, s.role, s.card, sx, rowY + 70, sw);
      sx += sw + gap;
    }
    bottomY = rowY + 70 + 20 + Math.round(sw * 1.5) + 70;
  }
  if (chart.isFixed) {
    ctx.font = `italic 400 26px ${SERIF}`;
    ctx.fillStyle = INK_SOFT;
    bottomY += paragraph(ctx, "Yours is one of the three fixed cards. It never moves, so it carries no Environment or Displacement card.", W / 2, bottomY + 20, W - 280, 36, "center");
  }
  if (chart.isJoker) {
    ctx.font = `400 34px ${SERIF}`;
    ctx.fillStyle = INK;
    bottomY += paragraph(ctx, "The Joker stands apart from the 52 cards, so it carries no ruling card and no karma cards. It can play any card in the deck.", W / 2, rowY + 90, W - 280, 46, "center") + 60;
  }

  if (chart.watchFor) {
    const wy = bottomY + 40;
    eyebrow(ctx, "Watch for", W / 2, wy, "center");
    ctx.font = `italic 400 28px ${SERIF}`;
    ctx.fillStyle = INK;
    paragraph(ctx, chart.watchFor, W / 2, wy + 46, W - 300, 38, "center");
  }

  // Footer
  ctx.font = `400 24px ${SERIF}`;
  ctx.fillStyle = INK_SOFT;
  ctx.textAlign = "center";
  ctx.fillText("cardblueprints.com", W / 2, H - 90);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/png", 1),
  );
}
