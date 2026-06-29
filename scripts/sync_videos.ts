import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Sync the cardologypro.com video index from the YouTube channel.
 *
 * Source of truth stays lib/videos.ts (committed, SEO-friendly, reviewable in
 * git). This script PULLS the channel's shadow-reading uploads and MERGES them
 * in — existing entries (and their curated descriptions) are preserved; only
 * genuinely new videos are added.
 *
 * Two fetch modes:
 *   - No key (default): YouTube RSS feed — latest ~15 uploads, zero setup.
 *   - YOUTUBE_API_KEY set: YouTube Data API — paginates the full uploads
 *     playlist, so it can backfill every published shadow video at once.
 *
 * Flags:
 *   --dry-run   Print what would change; do not write the file.
 *
 * Run: bun scripts/sync_videos.ts            (or: bun run sync:videos)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const videosPath = path.join(root, "lib/videos.ts");

const CHANNEL_ID = process.env.YT_CHANNEL_ID || "UCa-ot25gwV1vHN9pEvTq2FQ"; // @cardologypro
const DRY_RUN = process.argv.includes("--dry-run");

type CardologyVideo = {
  title: string;
  card: string;
  url: string;
  uploadDate: string;
  description: string;
};

type FetchedVideo = {
  videoId: string;
  title: string;
  publishedAt: string; // ISO
};

const RANK_WORDS: Record<string, string> = {
  A: "Ace", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six",
  "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten", J: "Jack", Q: "Queen", K: "King",
};
const SUIT_WORDS: Record<string, string> = {
  "♠": "Spades", "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs",
};

const SHADOW_RE = /The Shadow of the\s+(10|[AJQK2-9])([♠♥♦♣])/u;

function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** "The Shadow of the 5♣ — The Dynamic Innovator | Cardology Pro" -> normalized. */
function normalizeTitle(raw: string): string {
  let t = unescapeXml(raw).trim();
  t = t.split(" | ")[0].trim(); // drop "| Cardology Pro" suffix
  t = t.replace(/\s+[—–]\s+/, " - "); // first em/en dash -> hyphen, matching existing style
  return t;
}

function parseCard(title: string): string | null {
  const m = title.match(SHADOW_RE);
  if (!m) return null;
  return `${m[1]}${m[2]}`;
}

function templateDescription(card: string): string {
  const rank = card.slice(0, card.length - 1);
  const suit = card.slice(-1);
  const rankWord = RANK_WORDS[rank] ?? rank;
  const suitWord = SUIT_WORDS[suit] ?? suit;
  return `A deterministic Cardology shadow reading for the ${rankWord} of ${suitWord}.`;
}

function videoIdFromUrl(url: string): string {
  return url.replace(/^https:\/\/youtu\.be\//, "").replace(/^https:\/\/www\.youtube\.com\/watch\?v=/, "");
}

async function fetchViaRss(channelId: string): Promise<FetchedVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  const xml = await res.text();
  const entries = xml.split("<entry>").slice(1);
  const out: FetchedVideo[] = [];
  for (const entry of entries) {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (id && title && published) {
      out.push({ videoId: id, title: unescapeXml(title), publishedAt: published });
    }
  }
  return out;
}

async function fetchViaApi(channelId: string, apiKey: string): Promise<FetchedVideo[]> {
  const uploads = "UU" + channelId.slice(2);
  const out: FetchedVideo[] = [];
  let pageToken = "";
  do {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50` +
      `&playlistId=${uploads}&key=${apiKey}` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Data API fetch failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const item of json.items ?? []) {
      const s = item.snippet;
      if (s?.resourceId?.videoId && s?.title && s?.publishedAt) {
        out.push({ videoId: s.resourceId.videoId, title: s.title, publishedAt: s.publishedAt });
      }
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

async function loadExisting(): Promise<{ videos: CardologyVideo[]; header: string; footer: string }> {
  const text = fs.readFileSync(videosPath, "utf8");
  const arrayMarker = "export const CARDOLOGY_VIDEOS: CardologyVideo[] = [";
  const footerMarker = "export function youtubeId(";
  const headerEnd = text.indexOf(arrayMarker);
  const footerStart = text.indexOf(footerMarker);
  if (headerEnd === -1 || footerStart === -1) {
    throw new Error("Could not locate the CARDOLOGY_VIDEOS array or helper functions in lib/videos.ts");
  }
  const header = text.slice(0, headerEnd + arrayMarker.length);
  const footer = text.slice(footerStart);
  const mod = await import(videosPath);
  return { videos: mod.CARDOLOGY_VIDEOS as CardologyVideo[], header, footer };
}

function serializeEntry(v: CardologyVideo): string {
  const j = (s: string) => JSON.stringify(s);
  return [
    "  {",
    `    title: ${j(v.title)},`,
    `    card: ${j(v.card)},`,
    `    url: ${j(v.url)},`,
    `    uploadDate: ${j(v.uploadDate)},`,
    `    description:\n      ${j(v.description)},`,
    "  },",
  ].join("\n");
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const mode = apiKey ? "YouTube Data API (full backfill)" : "RSS feed (latest ~15)";
  console.log(`Syncing videos for channel ${CHANNEL_ID} via ${mode}…`);

  const fetched = apiKey ? await fetchViaApi(CHANNEL_ID, apiKey) : await fetchViaRss(CHANNEL_ID);
  const { videos: existing, header, footer } = await loadExisting();

  const byId = new Map<string, CardologyVideo>();
  for (const v of existing) byId.set(videoIdFromUrl(v.url), v); // existing wins (curated)

  const added: CardologyVideo[] = [];
  for (const f of fetched) {
    const card = parseCard(normalizeTitle(f.title));
    if (!card) continue; // not a shadow reading — skip
    if (byId.has(f.videoId)) continue; // already have it
    const entry: CardologyVideo = {
      title: normalizeTitle(f.title),
      card,
      url: `https://youtu.be/${f.videoId}`,
      uploadDate: f.publishedAt.slice(0, 10),
      description: templateDescription(card),
    };
    byId.set(f.videoId, entry);
    added.push(entry);
  }

  const merged = [...byId.values()].sort((a, b) => (a.uploadDate < b.uploadDate ? 1 : -1));

  console.log(`  fetched ${fetched.length} uploads, ${added.length} new shadow video(s) to add:`);
  for (const a of added) console.log(`    + ${a.card}  ${a.uploadDate}  ${a.title}`);
  if (added.length === 0) {
    console.log("  nothing new — lib/videos.ts already up to date.");
    return;
  }

  const body = merged.map(serializeEntry).join("\n");
  const out = `${header}\n${body}\n];\n\n${footer}`;

  if (DRY_RUN) {
    console.log(`\n[dry-run] would write ${merged.length} total entries to lib/videos.ts (no file changed).`);
    return;
  }
  fs.writeFileSync(videosPath, out, "utf8");
  console.log(`\nWrote lib/videos.ts — ${merged.length} total entries (${added.length} new).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
