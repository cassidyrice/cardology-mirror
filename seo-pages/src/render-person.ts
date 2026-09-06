import { escapeHtml } from "./escape";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  personJsonLd,
} from "./jsonld";
import { exampleBanner, jokerLineageSlot, renderLayout } from "./layout";
import { SITE_NAME, type EnrichedPerson } from "./types";
import {
  birthdayPath,
  cardHubPath,
  checkoutHref,
  CREATE_CHECKOUT_STUB_PATH,
  formatDisplayDate,
  formatMonthDay,
  isJokerDate,
  isJokerPerson,
  parseIsoDate,
  personPath,
} from "./urls";

const SAME_CARD_SLOTS = 6;

export function renderPersonPage(
  person: EnrichedPerson,
  peopleBySlug: Map<string, EnrichedPerson>,
): string {
  const path = personPath(person.slug);
  const { month, day } = parseIsoDate(person.birth_date);
  const dateLabel = formatDisplayDate(person.birth_date);
  const cardLabel = person.card.label;
  const h1 = `${person.name}'s Birth Card: The ${cardLabel}`;
  const description = `${h1} — ${dateLabel}. EXAMPLE fixture page for Card Blueprints celebrity templates.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Birth Cards", href: "/birth-card" },
    { name: person.name, href: path },
  ];

  const sameCardLinks = padSameCardLinks(person, peopleBySlug);
  const sameDayLinks = sameDaySection(person, peopleBySlug, month, day);

  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: person.og_image_slot,
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(person.faqs),
  ]);

  const showJoker =
    isJokerPerson(person) || isJokerDate(person.birth_date);

  const body = `
    ${exampleBanner()}
    <header class="hero">
      <p class="eyebrow">Birth card profile</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="date">${escapeHtml(dateLabel)}</p>
      <p class="archetype" data-slot="archetype">${escapeHtml(person.card.archetype)}</p>
    </header>

    <figure class="og-slot" data-slot="og-image" data-og-image-slot="${escapeHtml(person.og_image_slot)}">
      <img src="/og/example-placeholder.svg" width="1200" height="630" alt="EXAMPLE OG image slot for ${escapeHtml(person.name)} — asset not generated in WP4" />
      <figcaption>OG image slot: ${escapeHtml(person.og_image_slot)}</figcaption>
    </figure>

    <section data-slot="hook">
      <h2>Hook</h2>
      <p>${escapeHtml(person.hook)}</p>
    </section>

    <section data-slot="card-meaning">
      <h2>Card meaning</h2>
      <p>${escapeHtml(person.card_meaning)}</p>
      <p><a href="${escapeHtml(cardHubPath(person.card))}">The ${escapeHtml(cardLabel)} hub</a></p>
    </section>

    <section data-slot="evidence">
      <h2>Evidence</h2>
      <ol>
        ${person.evidence
          .slice(0, 3)
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("\n        ")}
      </ol>
    </section>

    <section data-slot="same-card">
      <h2>Same-card famous people</h2>
      <ol>
        ${sameCardLinks.join("\n        ")}
      </ol>
    </section>

    <section data-slot="same-day">
      <h2>Born the same day</h2>
      ${sameDayLinks}
    </section>

    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${person.faqs
          .map(
            (faq) => `<div>
          <dt>${escapeHtml(faq.question)}</dt>
          <dd>${escapeHtml(faq.answer)}</dd>
        </div>`,
          )
          .join("\n        ")}
      </dl>
    </section>

    <section data-slot="cta">
      <h2>Get your blueprint</h2>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(checkoutHref(person.slug))}">
          Get your birth-card blueprint
        </a>
      </p>
      <form method="post" action="${escapeHtml(CREATE_CHECKOUT_STUB_PATH)}" data-checkout-stub="true">
        <input type="hidden" name="utm_source" value="celeb" />
        <input type="hidden" name="utm_content" value="${escapeHtml(person.slug)}" />
        <button type="submit" disabled>POST /create-checkout stub (not wired)</button>
      </form>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Wikidata CC0${person.wikidata_qid ? ` (${escapeHtml(person.wikidata_qid)})` : " (QID slot)"}
      + Wikipedia CC BY-SA 4.0${person.wikipedia_title ? ` (${escapeHtml(person.wikipedia_title)})` : " (title slot)"}.
      EXAMPLE fixture — no live Wikidata or Wikipedia claims in WP4.
    </p>
    ${showJoker ? jokerLineageSlot() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: person.og_image_slot,
    ogImageAlt: `EXAMPLE OG image slot for ${person.name}`,
    jsonLd,
    crumbs,
    body,
  });
}

function padSameCardLinks(
  person: EnrichedPerson,
  peopleBySlug: Map<string, EnrichedPerson>,
): string[] {
  const links: string[] = [];
  const seen = new Set<string>([person.slug]);

  for (const slug of person.same_card_slugs) {
    if (seen.has(slug) || links.length >= SAME_CARD_SLOTS) continue;
    seen.add(slug);
    const other = peopleBySlug.get(slug);
    if (other) {
      links.push(
        `<li><a href="${escapeHtml(personPath(other.slug))}">${escapeHtml(other.name)}</a></li>`,
      );
    }
  }

  for (const other of peopleBySlug.values()) {
    if (links.length >= SAME_CARD_SLOTS) break;
    if (other.slug === person.slug) continue;
    if (other.card.slug !== person.card.slug) continue;
    if (seen.has(other.slug)) continue;
    seen.add(other.slug);
    links.push(
      `<li><a href="${escapeHtml(personPath(other.slug))}">${escapeHtml(other.name)}</a></li>`,
    );
  }

  let slot = 1;
  while (links.length < SAME_CARD_SLOTS) {
    links.push(
      `<li><a href="${escapeHtml(personPath(person.slug))}#example-same-card-slot-${slot}" data-placeholder="true">EXAMPLE same-card slot ${slot}</a></li>`,
    );
    slot += 1;
  }

  return links;
}

function sameDaySection(
  person: EnrichedPerson,
  peopleBySlug: Map<string, EnrichedPerson>,
  month: number,
  day: number,
): string {
  const hub = birthdayPath(month, day);
  const others = [...peopleBySlug.values()].filter((other) => {
    if (other.slug === person.slug) return false;
    const parsed = parseIsoDate(other.birth_date);
    return parsed.month === month && parsed.day === day;
  });

  const extra = person.same_day_slugs
    .map((slug) => peopleBySlug.get(slug))
    .filter((other): other is EnrichedPerson => Boolean(other && other.slug !== person.slug));

  const unique = new Map<string, EnrichedPerson>();
  for (const other of [...others, ...extra]) {
    unique.set(other.slug, other);
  }

  const peopleLinks =
    unique.size === 0
      ? `<li data-placeholder="true">EXAMPLE born-same-day people slot — WP3 will add internal links</li>`
      : [...unique.values()]
          .map(
            (other) =>
              `<li><a href="${escapeHtml(personPath(other.slug))}">${escapeHtml(other.name)}</a></li>`,
          )
          .join("\n        ");

  return `<ul>
        <li><a href="${escapeHtml(hub)}">Everyone born ${escapeHtml(formatMonthDay(month, day))}</a></li>
        ${peopleLinks}
      </ul>`;
}
