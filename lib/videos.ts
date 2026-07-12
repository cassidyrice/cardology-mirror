import { parseCard } from "@/lib/cards";
import { slugFor } from "@/lib/seo-cards";
import { VIDEO_URL } from "@/lib/site";

export type CardologyVideo = {
  title: string;
  card: string;
  url: string;
  uploadDate: string;
  description: string;
};

export const CARDOLOGY_VIDEO_CHANNEL = VIDEO_URL;

export const CARDOLOGY_VIDEOS: CardologyVideo[] = [
  {
    title: "The Shadow of the 5♣ - The Dynamic Innovator",
    card: "5♣",
    url: "https://youtu.be/sqVZCoe6a4Q",
    uploadDate: "2026-06-25",
    description:
      "A deterministic Cardology shadow reading for the Five of Clubs.",
  },
  {
    title: "The Shadow of the 6♣ - The Nurturing Creator",
    card: "6♣",
    url: "https://youtu.be/tGs6j465Hss",
    uploadDate: "2026-06-24",
    description:
      "A deterministic Cardology shadow reading for the Six of Clubs.",
  },
  {
    title: "The Shadow of the 7♣ - The Analytical Creator",
    card: "7♣",
    url: "https://youtu.be/ZXNxnQdSR-s",
    uploadDate: "2026-06-23",
    description:
      "A deterministic Cardology shadow reading for the Seven of Clubs.",
  },
  {
    title: "The Shadow of the 8♣ - The Ambitious Builder",
    card: "8♣",
    url: "https://youtu.be/yqms4NwKgvo",
    uploadDate: "2026-06-22",
    description:
      "A deterministic Cardology shadow reading for the Eight of Clubs.",
  },
  {
    title: "The Shadow of the 9♣ - The Humanitarian Builder",
    card: "9♣",
    url: "https://youtu.be/yHwMLTWkRrY",
    uploadDate: "2026-06-21",
    description:
      "A deterministic Cardology shadow reading for the Nine of Clubs.",
  },
  {
    title: "The Shadow of the 10♣ - The Master Builder",
    card: "10♣",
    url: "https://youtu.be/hqppnuXTk1A",
    uploadDate: "2026-06-20",
    description:
      "A deterministic Cardology shadow reading for the Ten of Clubs.",
  },
  {
    title: "The Shadow of the J♣ - The Creative Messenger",
    card: "J♣",
    url: "https://youtu.be/963srdoLwm0",
    uploadDate: "2026-06-19",
    description:
      "A deterministic Cardology shadow reading for the Jack of Clubs.",
  },
  {
    title: "The Shadow of the Q♣ - The Nurturing Leader",
    card: "Q♣",
    url: "https://youtu.be/eee6fabWwEo",
    uploadDate: "2026-06-18",
    description:
      "A deterministic Cardology shadow reading for the Queen of Clubs.",
  },
  {
    title: "The Shadow of the K♣ - The Master Leader",
    card: "K♣",
    url: "https://youtu.be/IuAwNUL_8I8",
    uploadDate: "2026-06-17",
    description:
      "A deterministic Cardology shadow reading for the King of Clubs, focused on clear thinking, leadership, certainty, and collaborative wisdom.",
  },
  {
    title: "The Shadow of the 4♦ - The Financial Foundation Builder",
    card: "4♦",
    url: "https://youtu.be/J0dYBMytdz0",
    uploadDate: "2026-06-13",
    description:
      "A Cardology shadow reading for the Four of Diamonds, focused on security, value, control, and learning to enjoy what has already been built.",
  },
  {
    title: "The Shadow of the 5♦ - The Dynamic Entrepreneur",
    card: "5♦",
    url: "https://youtu.be/RkVJan1QOjE",
    uploadDate: "2026-06-12",
    description:
      "A Cardology shadow reading for the Five of Diamonds, focused on freedom, money, restlessness, and material change.",
  },
  {
    title: "The Shadow of the 6♦ - The Generous Provider",
    card: "6♦",
    url: "https://youtu.be/5T_5HaxwljY",
    uploadDate: "2026-06-11",
    description:
      "A Cardology shadow reading for the Six of Diamonds, focused on generosity, responsibility, values, and balance.",
  },
  {
    title: "The Shadow of the 8♦ - The Businessman",
    card: "8♦",
    url: "https://youtu.be/tk0AwQ7ByEs",
    uploadDate: "2026-06-09",
    description:
      "A Cardology shadow reading for the Eight of Diamonds, focused on ambition, power, money, and responsible material influence.",
  },
  {
    title: "The Shadow of the 9♦ - The Universal Provider",
    card: "9♦",
    url: "https://youtu.be/U8dP2OOh-BU",
    uploadDate: "2026-06-08",
    description:
      "A Cardology shadow reading for the Nine of Diamonds, focused on generosity, release, value, and the cost of holding on too long.",
  },
  {
    title: "The Shadow of the 10♦ - The Wealthy Master",
    card: "10♦",
    url: "https://youtu.be/3seQUWVkxnw",
    uploadDate: "2026-06-07",
    description:
      "A Cardology shadow reading for the Ten of Diamonds, focused on public success, money, scale, and material visibility.",
  },
  {
    title: "The Shadow of the J♦ - The Successful Messenger",
    card: "J♦",
    url: "https://youtu.be/Cfsv_D_tyXg",
    uploadDate: "2026-06-06",
    description:
      "A Cardology shadow reading for the Jack of Diamonds, focused on charm, value, persuasion, and integrated material truth.",
  },
  {
    title: "The Shadow of the Q♦ - The Prosperous Nurturer",
    card: "Q♦",
    url: "https://youtu.be/z4Yba6H-0Ug",
    uploadDate: "2026-06-05",
    description:
      "A Cardology shadow reading for the Queen of Diamonds, focused on stewardship, prosperity, care, and values.",
  },
  {
    title: "The Shadow of the K♦ - The Wealthy King",
    card: "K♦",
    url: "https://youtu.be/Bl4Vw0SGAw0",
    uploadDate: "2026-06-04",
    description:
      "A Cardology shadow reading for the King of Diamonds, focused on authority, money, control, and collaborative stewardship.",
  },
  {
    title: "The Shadow of the A♠ - The Truth Pioneer",
    card: "A♠",
    url: "https://youtu.be/FLGmz0XRVQQ",
    uploadDate: "2026-06-03",
    description:
      "A Cardology shadow reading for the Ace of Spades, focused on truth, initiation, identity, and transformation.",
  },
  {
    title: "The Shadow of the 2♠ - The Skeptical Partner",
    card: "2♠",
    url: "https://youtu.be/Cu4ao274PuQ",
    uploadDate: "2026-06-02",
    description:
      "A Cardology shadow reading for the Two of Spades, focused on partnership, skepticism, work, and shared pressure.",
  },
];

export function youtubeId(url: string): string {
  return url.replace(/^https:\/\/youtu\.be\//, "");
}

export function youtubeThumbnail(url: string): string {
  return `https://i.ytimg.com/vi/${youtubeId(url)}/hqdefault.jpg`;
}

export function youtubeEmbed(url: string): string {
  return `https://www.youtube.com/embed/${youtubeId(url)}`;
}

// NOTE: keep the helpers below AFTER youtubeId — scripts/sync_videos.ts
// preserves everything from "export function youtubeId(" onward when it
// rewrites this file; anything between the array and that marker is lost.

// Map a video's glyph code ("5♣") into the same slug space as seo-cards
// ("5-of-clubs"), so card pages can find their matching films.
export function videoCardSlug(video: CardologyVideo): string | null {
  const p = parseCard(video.card);
  if (!p) return null;
  return slugFor(p.rank, p.suit);
}

// Videos matched to one card. Accepts either a card slug ("5-of-clubs")
// or a glyph code ("5♣"); returns [] when no film exists for that card.
export function videosForCard(cardSlugOrCode: string): CardologyVideo[] {
  let slug: string | null = cardSlugOrCode;
  if (!cardSlugOrCode.includes("-of-")) {
    const p = parseCard(cardSlugOrCode);
    slug = p ? slugFor(p.rank, p.suit) : null;
  }
  if (!slug) return [];
  return CARDOLOGY_VIDEOS.filter((v) => videoCardSlug(v) === slug);
}
