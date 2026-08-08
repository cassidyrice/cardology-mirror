import type { ElroyReading } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderElroyReadingEmail(
  reading: ElroyReading,
  blueprintUrl: string,
): { subject: string; text: string; html: string } {
  const label = reading.card.birthCardLabel;
  const subject = `Elroy's micro-reading: ${label}`;
  const text = [
    "Card Blueprints",
    "",
    `Elroy's micro-reading for your ${label}`,
    "",
    "Core pattern",
    reading.reading.core,
    "",
    "Tension and ruling layer",
    reading.reading.tension,
    "",
    "Reflection",
    reading.reading.reflection,
    "",
    reading.reading.disclaimer,
    "",
    `Personal Card Blueprint: ${blueprintUrl}`,
    "",
    "You are on the Card Blueprints list for occasional educational and product emails. Unsubscribe links appear on future marketing messages.",
  ].join("\n");

  const html = [
    `<div style="font-family:Georgia,serif;color:#14110d;line-height:1.5">`,
    `<p style="letter-spacing:0.12em;text-transform:uppercase;font-size:12px">Card Blueprints</p>`,
    `<h1 style="font-size:22px">Elroy's micro-reading for your ${escapeHtml(label)}</h1>`,
    `<h2 style="font-size:16px">Core pattern</h2>`,
    `<p>${escapeHtml(reading.reading.core)}</p>`,
    `<h2 style="font-size:16px">Tension and ruling layer</h2>`,
    `<p>${escapeHtml(reading.reading.tension)}</p>`,
    `<h2 style="font-size:16px">Reflection</h2>`,
    `<p>${escapeHtml(reading.reading.reflection)}</p>`,
    `<p style="font-size:13px;color:#5b5148">${escapeHtml(reading.reading.disclaimer)}</p>`,
    `<p><a href="${escapeHtml(blueprintUrl)}">See my Personal Card Blueprint</a></p>`,
    `<p style="font-size:12px;color:#5b5148">You are on the Card Blueprints list for occasional educational and product emails. Unsubscribe links appear on future marketing messages.</p>`,
    `</div>`,
  ].join("");

  return { subject, text, html };
}
