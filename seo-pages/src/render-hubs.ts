import { escapeHtml } from "./escape";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
} from "./jsonld";
import { exampleBanner, jokerLineageSlot, renderLayout } from "./layout";
import { SITE_NAME, type CardRef, type EnrichedPerson, type FaqItem } from "./types";
import {
  birthdayPath,
  cardHubPath,
  formatMonthDay,
  personPath,
} from "./urls";

export function renderCardHubPage(
  card: CardRef,
  people: readonly EnrichedPerson[],
): string {
  const path = cardHubPath(card);
  const title = `The ${card.label} Birth Card`;
  const description = `EXAMPLE card hub for the ${card.label}. Celebrity profiles that share this birth card will land here after WP3 enrichment.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Cards", href: "/card" },
    { name: card.label, href: path },
  ];
  const faqs = cardHubFaqs(card);
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const peopleList =
    people.length === 0
      ? `<li data-placeholder="true">EXAMPLE people slot — WP3 will list same-card profiles</li>`
      : people
          .map(
            (person) =>
              `<li><a href="${escapeHtml(personPath(person.slug))}">${escapeHtml(person.name)}</a></li>`,
          )
          .join("\n        ");

  const joker = card.kind === "joker" ? jokerLineageSlot() : "";

  const body = `
    ${exampleBanner()}
    <header class="hero">
      <p class="eyebrow">Card hub</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype" data-slot="archetype">${escapeHtml(card.archetype)}</p>
    </header>
    <section data-slot="same-card">
      <h2>Famous people with this card</h2>
      <ul>
        ${peopleList}
      </ul>
    </section>
    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${faqs
          .map(
            (faq) => `<div>
          <dt>${escapeHtml(faq.question)}</dt>
          <dd>${escapeHtml(faq.answer)}</dd>
        </div>`,
          )
          .join("\n        ")}
      </dl>
    </section>
    ${joker}
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: `/og/card/${card.slug}.png`,
    ogImageAlt: `EXAMPLE OG image slot for the ${card.label}`,
    jsonLd,
    crumbs,
    body,
  });
}

export function renderBirthdayPage(
  month: number,
  day: number,
  people: readonly EnrichedPerson[],
  card: CardRef | null,
): string {
  const path = birthdayPath(month, day);
  const label = formatMonthDay(month, day);
  const title = `Born on ${label}`;
  const cardLine = card
    ? `EXAMPLE fixture card for this date: the ${card.label}.`
    : "EXAMPLE fixture — WP3 will attach the engine-resolved birth card.";
  const description = `${title}. ${cardLine}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Birthdays", href: "/birthday" },
    { name: label, href: path },
  ];
  const faqs = birthdayFaqs(label, card);
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const peopleList =
    people.length === 0
      ? `<li data-placeholder="true">EXAMPLE people slot — WP3 will list same-day profiles</li>`
      : people
          .map(
            (person) =>
              `<li><a href="${escapeHtml(personPath(person.slug))}">${escapeHtml(person.name)}</a></li>`,
          )
          .join("\n        ");

  const cardBlock = card
    ? `<p data-slot="card-meaning"><a href="${escapeHtml(cardHubPath(card))}">The ${escapeHtml(card.label)}</a> — EXAMPLE fixture mapping, not yet engine-resolved for the full calendar.</p>`
    : `<p data-slot="card-meaning">EXAMPLE card slot — WP3 will fill the engine-resolved birth card.</p>`;

  const joker = month === 12 && day === 31 ? jokerLineageSlot() : "";

  const body = `
    ${exampleBanner()}
    <header class="hero">
      <p class="eyebrow">Birthday hub</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="meta" data-slot="date">${escapeHtml(label)}</p>
    </header>
    ${cardBlock}
    <section data-slot="same-day">
      <h2>Famous people born this day</h2>
      <ul>
        ${peopleList}
      </ul>
    </section>
    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${faqs
          .map(
            (faq) => `<div>
          <dt>${escapeHtml(faq.question)}</dt>
          <dd>${escapeHtml(faq.answer)}</dd>
        </div>`,
          )
          .join("\n        ")}
      </dl>
    </section>
    ${joker}
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: `/og/birthday/${month}-${day}.png`,
    ogImageAlt: `EXAMPLE OG image slot for ${label}`,
    jsonLd,
    crumbs,
    body,
  });
}

export function renderTodayStub(): string {
  const path = "/today";
  const title = "Today's Birth Card";
  const description =
    "EXAMPLE daily stub. Production /today is the Next.js app until a Worker path-split is live — do not cut over this stub.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Today", href: path },
  ];
  const faqs: FaqItem[] = [
    {
      question: "EXAMPLE: What is today's birth-card page?",
      answer:
        "EXAMPLE: A daily stub for the celebrity SEO site. The live Card Blueprints /today route is the personalized app until cutover.",
    },
    {
      question: "EXAMPLE: Will this replace the app Today page?",
      answer:
        "EXAMPLE: Not in WP4. Path ownership is documented; a Worker router must exist before /today is served from this folder.",
    },
    {
      question: "EXAMPLE: Where does the daily card come from?",
      answer:
        "EXAMPLE: WP3 / the existing daily-card engine will fill this slot. No invented daily card in the scaffold.",
    },
  ];
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const body = `
    ${exampleBanner()}
    <header class="hero">
      <p class="eyebrow">Daily stub</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p data-slot="hook">EXAMPLE slot for today's card. Not wired to the live daily engine.</p>
    </header>
    <section data-slot="card-meaning">
      <h2>Today's card</h2>
      <p data-placeholder="true">EXAMPLE — WP3 or the daily-card job will fill this.</p>
    </section>
    <p class="sources" data-slot="sources">This stub must not be served on cardblueprints.com /today until the path-split Worker is in place. The Next.js app owns /today today.</p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/today.png",
    ogImageAlt: "EXAMPLE OG image slot for the daily stub",
    jsonLd,
    crumbs,
    body,
  });
}

export function renderDirectoryPage(input: {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  items: readonly { href: string; label: string }[];
}): string {
  const crumbs = [
    { name: "Home", href: "/" },
    { name: input.title, href: input.path },
  ];
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({
      name: input.title,
      urlPath: input.path,
      description: input.description,
    }),
    breadcrumbJsonLd(crumbs),
  ]);
  const items = input.items
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join("\n        ");

  const body = `
    ${exampleBanner()}
    <header class="hero">
      <p class="eyebrow">${escapeHtml(input.eyebrow)}</p>
      <h1 data-slot="h1">${escapeHtml(input.title)}</h1>
      <p>${escapeHtml(input.description)}</p>
    </header>
    <ul>
        ${items}
    </ul>
  `;

  return renderLayout({
    title: `${input.title} | ${SITE_NAME}`,
    description: input.description,
    canonicalPath: input.path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: `EXAMPLE OG image slot for ${input.title}`,
    jsonLd,
    crumbs,
    body,
  });
}

export function renderIndexPage(people: readonly EnrichedPerson[]): string {
  const path = "/";
  const title = "Celebrity birth-card scaffold";
  const description =
    "Isolated WP4 template scaffold for Card Blueprints celebrity birth-card pages. Fixture data only.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Scaffold", href: "/" },
  ];
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
  ]);

  const links = people
    .map(
      (person) =>
        `<li><a href="${escapeHtml(personPath(person.slug))}">${escapeHtml(person.name)}</a> — ${escapeHtml(person.card.label)}</li>`,
    )
    .join("\n        ");

  const body = `
    ${exampleBanner()}
    <header class="hero">
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p>Local fixture index. Not a production listing and not for the live sitemap.</p>
    </header>
    <ul>
        ${links}
        <li><a href="/card/joker">Joker card hub</a></li>
        <li><a href="/birthday/december-31">December 31 birthday hub</a></li>
        <li><a href="/today">Daily stub</a></li>
        <li><a href="/states">US states admission birth cards</a></li>
    </ul>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: "EXAMPLE OG image slot",
    jsonLd,
    crumbs,
    body,
  });
}

function cardHubFaqs(card: CardRef): FaqItem[] {
  switch (card.kind) {
    case "joker":
      return [
        {
          question: "EXAMPLE: What is the Joker birth card?",
          answer:
            "EXAMPLE: December 31 resolves to solar value 0, the Joker. This hub is a template slot, not a biography.",
        },
        {
          question: "EXAMPLE: Why is there a lineage note on this page?",
          answer:
            "EXAMPLE: Cass lock D1 — every Joker-related page keeps a December 31 / Joker lineage slot.",
        },
        {
          question: "EXAMPLE: Are the people listed here real?",
          answer:
            "EXAMPLE: Only labeled EXAMPLE fixtures in WP4. WP3 will attach enriched profiles.",
        },
      ];
    case "card":
      return [
        {
          question: `EXAMPLE: What does the ${card.label} mean?`,
          answer: `EXAMPLE: Meaning copy for the ${card.label} will be reused from the existing card-meaning system. This hub is a scaffold.`,
        },
        {
          question: `EXAMPLE: Who shares the ${card.label}?`,
          answer:
            "EXAMPLE: Same-card celebrity links are placeholder slots until people_enriched.jsonl lands.",
        },
        {
          question: "EXAMPLE: Is this the live /birth-card card page?",
          answer:
            "EXAMPLE: No. Live card meanings stay on /birth-card/{rank}-of-{suit} until a Worker moves hubs to /card/.",
        },
      ];
    default: {
      const _exhaustive: never = card;
      throw new Error(`Unhandled card kind: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function birthdayFaqs(label: string, card: CardRef | null): FaqItem[] {
  return [
    {
      question: `EXAMPLE: What is the birth card for ${label}?`,
      answer: card
        ? `EXAMPLE fixture lists the ${card.label}. WP3 will confirm with the engine.`
        : "EXAMPLE: WP3 will fill the engine-resolved card.",
    },
    {
      question: `EXAMPLE: Who was born on ${label}?`,
      answer:
        "EXAMPLE: Same-day celebrity links are slots. No invented names beyond labeled fixtures.",
    },
    {
      question: "EXAMPLE: Is this the live /born-on page?",
      answer:
        "EXAMPLE: No. Production birthday directories are Worker-owned /born-on/{month}-{day}. This /birthday/ path is the future celeb-site hub.",
    },
  ];
}

