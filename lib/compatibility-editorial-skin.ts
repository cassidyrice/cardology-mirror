// The /compatibility/ and /born-on/ HTML is rendered by the cardology-unlock
// Worker, which inlines one editorial skin. Live pages still paint the cream
// paper and oxblood accent (#8e321f). This rewrites that override onto the
// cyanotype tokens in app/globals.css (:root). Suit pips stay card colors:
// hearts and diamonds keep #8e321f, clubs and spades keep #14110d.

const CREAM_MARKER =
  "/* Current Card Blueprints cream editorial skin. Keep this override last. */";
const CYANOTYPE_MARKER =
  "/* Current Card Blueprints cyanotype editorial skin. Keep this override last. */";

const SUIT_RED = ".rs{color:#8e321f}";
const SUIT_BLACK = ".bs{color:#14110d}";
const SUIT_RED_HOLD = ".rs{color:__SUIT_RED__}";
const SUIT_BLACK_HOLD = ".bs{color:__SUIT_BLACK__}";

const THEME_COLOR =
  /(<meta\s+name="theme-color"\s+content=")#f6f1e8(")/g;

// Longer literals first so #fffcf7 is not partly eaten by a shorter hex.
const SKIN_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["background:#14110d;color:#f6f1e8", "background:#123a63;color:#e8f1fa"],
  [
    ".btn:hover{color:#fff;background:#2a241c",
    ".btn:hover{color:#e8f1fa;background:#0a3159",
  ],
  ["#fffcf7", "#f8fbfd"],
  ["#fbf8f2", "#f8fbfd"],
  ["#f6f1e8", "#eef3f8"],
  ["#efe8dc", "#e2eaf3"],
  ["rgba(246,241,232,", "rgba(238,243,248,"],
  ["rgba(255,252,247,", "rgba(248,251,253,"],
  ["rgba(142,50,31,", "rgba(12,66,117,"],
  ["rgba(20,17,13,", "rgba(18,58,99,"],
  ["#6f2618", "#0a3159"],
  ["#8e321f", "#0c4275"],
  ["#756c61", "#3c6089"],
  ["#5b5148", "#3c6089"],
  ["#14110d", "#123a63"],
];

export function recolorCompatibilityEditorialSkin(source: string): string {
  if (source.includes(CYANOTYPE_MARKER) && !source.includes(CREAM_MARKER)) {
    return source;
  }

  const start = source.indexOf(CREAM_MARKER);
  if (start < 0) {
    throw new Error("compatibility editorial skin marker missing");
  }

  const head = source.slice(0, start).replace(THEME_COLOR, "$1#eef3f8$2");
  let skin = source.slice(start);
  skin = skin.replaceAll(SUIT_RED, SUIT_RED_HOLD);
  skin = skin.replaceAll(SUIT_BLACK, SUIT_BLACK_HOLD);
  skin = skin.replaceAll(CREAM_MARKER, CYANOTYPE_MARKER);
  for (const [from, to] of SKIN_REPLACEMENTS) {
    skin = skin.replaceAll(from, to);
  }
  skin = skin.replaceAll(SUIT_RED_HOLD, SUIT_RED);
  skin = skin.replaceAll(SUIT_BLACK_HOLD, SUIT_BLACK);
  return head + skin;
}
