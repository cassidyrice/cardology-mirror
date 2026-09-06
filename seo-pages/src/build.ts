import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadPeopleJsonl } from "./load";
import {
  renderBirthdayPage,
  renderCardHubPage,
  renderDirectoryPage,
  renderIndexPage,
  renderTodayStub,
} from "./render-hubs";
import { renderPersonPage } from "./render-person";
import { renderRobotsTxt, renderSitemapIndex, renderUrlset } from "./sitemap";
import { buildStatePages } from "./states/build";
import type { CardRef, EnrichedPerson } from "./types";
import { birthdayPath, cardHubPath, formatMonthDay, parseIsoDate, personPath } from "./urls";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export type BuildOptions = {
  peoplePath?: string;
  outDir?: string;
  publicDir?: string;
};

export type BuildResult = {
  outDir: string;
  people: EnrichedPerson[];
  files: string[];
};

export function buildSeoPages(options: BuildOptions = {}): BuildResult {
  const peoplePath = options.peoplePath ?? join(ROOT, "fixtures", "people.example.jsonl");
  const outDir = options.outDir ?? join(ROOT, "dist");
  const publicDir = options.publicDir ?? join(ROOT, "public");

  const people = loadPeopleJsonl(peoplePath);
  if (people.length === 0) {
    throw new Error("No people rows loaded");
  }
  if (people.length > 3) {
    throw new Error("WP4 scaffold allows at most 3 fixture people");
  }
  if (!people.every((person) => person.example)) {
    throw new Error("Every WP4 row must be marked example: true");
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const peopleBySlug = new Map(people.map((person) => [person.slug, person]));
  const files: string[] = [];

  write(outDir, "index.html", renderIndexPage(people), files);
  write(
    outDir,
    "birth-card/index.html",
    renderDirectoryPage({
      path: "/birth-card",
      title: "Celebrity birth cards",
      description:
        "EXAMPLE directory of fixture person pages. Production /birth-card is the Next.js 52-card index until a Worker splits person slugs onto this site.",
      eyebrow: "Person directory",
      items: people.map((person) => ({
        href: personPath(person.slug),
        label: `${person.name} — ${person.card.label}`,
      })),
    }),
    files,
  );

  for (const person of people) {
    write(outDir, `${personPath(person.slug)}/index.html`, renderPersonPage(person, peopleBySlug), files);
  }

  const cards = uniqueCards(people);
  const jokerCard: CardRef = cards.find((card) => card.kind === "joker") ?? {
    kind: "joker",
    rank: "joker",
    suit: null,
    label: "Joker",
    slug: "joker",
    archetype:
      "EXAMPLE Joker archetype line — December 31 lineage note slot. Not a real reading.",
  };
  if (!cards.some((card) => card.kind === "joker")) {
    cards.push(jokerCard);
  }

  write(
    outDir,
    "card/index.html",
    renderDirectoryPage({
      path: "/card",
      title: "Birth card hubs",
      description:
        "EXAMPLE directory of /card/{rank}-of-{suit} hubs. Live card meanings stay on /birth-card/{slug} until cutover.",
      eyebrow: "Card directory",
      items: cards.map((card) => ({
        href: cardHubPath(card),
        label: card.label,
      })),
    }),
    files,
  );

  for (const card of cards) {
    const members = people.filter((person) => person.card.slug === card.slug);
    write(outDir, `${cardHubPath(card)}/index.html`, renderCardHubPage(card, members), files);
  }

  const birthdays = uniqueBirthdays(people);
  if (!birthdays.some((item) => item.month === 12 && item.day === 31)) {
    birthdays.push({ month: 12, day: 31, card: jokerCard, members: [] });
  }

  write(
    outDir,
    "birthday/index.html",
    renderDirectoryPage({
      path: "/birthday",
      title: "Birthday hubs",
      description:
        "EXAMPLE directory of /birthday/{month}-{day} hubs. Production birthday pages stay on Worker /born-on/ until cutover.",
      eyebrow: "Birthday directory",
      items: birthdays.map((item) => ({
        href: birthdayPath(item.month, item.day),
        label: formatMonthDay(item.month, item.day),
      })),
    }),
    files,
  );

  for (const birthday of birthdays) {
    write(
      outDir,
      `${birthdayPath(birthday.month, birthday.day)}/index.html`,
      renderBirthdayPage(birthday.month, birthday.day, birthday.members, birthday.card),
      files,
    );
  }

  write(outDir, "today/index.html", renderTodayStub(), files);

  const peoplePaths = people.map((person) => personPath(person.slug));
  const cardPaths = cards.map((card) => cardHubPath(card));
  const birthdayPaths = birthdays.map((item) => birthdayPath(item.month, item.day));

  write(outDir, "sitemap-people.xml", renderUrlset(peoplePaths), files);
  write(outDir, "sitemap-cards.xml", renderUrlset(cardPaths), files);
  write(outDir, "sitemap-birthdays.xml", renderUrlset(birthdayPaths), files);
  write(
    outDir,
    "sitemap-celeb.xml",
    renderSitemapIndex([
      "/sitemap-people.xml",
      "/sitemap-cards.xml",
      "/sitemap-birthdays.xml",
    ]),
    files,
  );
  write(outDir, "robots.txt", renderRobotsTxt(), files);

  return { outDir, people, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function uniqueCards(people: readonly EnrichedPerson[]): CardRef[] {
  const map = new Map<string, CardRef>();
  for (const person of people) {
    map.set(person.card.slug, person.card);
  }
  return [...map.values()];
}

function uniqueBirthdays(people: readonly EnrichedPerson[]): Array<{
  month: number;
  day: number;
  card: CardRef;
  members: EnrichedPerson[];
}> {
  const map = new Map<
    string,
    { month: number; day: number; card: CardRef; members: EnrichedPerson[] }
  >();
  for (const person of people) {
    const { month, day } = parseIsoDate(person.birth_date);
    const key = `${month}-${day}`;
    const existing = map.get(key);
    if (existing) {
      existing.members.push(person);
    } else {
      map.set(key, { month, day, card: person.card, members: [person] });
    }
  }
  return [...map.values()];
}

if (import.meta.main) {
  const result = buildSeoPages();
  const states = buildStatePages({ outDir: result.outDir, wipe: false });
  console.log(
    `Built ${result.files.length} celeb files for ${result.people.length} fixture people + ${states.files.length} state files for ${states.states.length} states → ${result.outDir}`,
  );
}
