import {
  famousBirthdayLabel,
  wikidataUrl,
  type FamousPerson,
} from "@/lib/famous-birthdays";

export function FamousPeopleBlock({
  cardLabel,
  people,
}: {
  cardLabel: string;
  people: FamousPerson[];
}) {
  if (people.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="type-eyebrow mb-2 !text-brand-bronze">Famous people born under the {cardLabel}</h2>
      <div className="prose-reading text-brand-ink-soft">
        <p>
          Birthdays are public record and the card is fixed by the date — a calendar coordinate, not a forecast. Use the list to test the pattern against people you already know something about.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {people.map((person) => (
            <li key={person.qid} className="rounded-xl border border-brand-line bg-brand-ivory/70 px-3 py-2 text-sm">
              <a
                href={person.wikipedia}
                rel="noopener"
                className="font-medium text-brand-ink underline underline-offset-4"
              >
                {person.name}
              </a>
              <span className="text-brand-ink-soft"> — {person.known_for}</span>
              <span className="block text-xs text-brand-ink-soft">born {famousBirthdayLabel(person.born)}</span>
              <span className="block text-xs text-brand-ink-soft">
                <a
                  href={wikidataUrl(person.qid)}
                  rel="noopener"
                  className="underline underline-offset-4"
                >
                  {person.qid}
                </a>
                {" · "}
                <a href={person.wikipedia} rel="noopener" className="underline underline-offset-4">
                  Wikipedia
                </a>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-brand-ink-soft" data-slot="sources">
          Sources: Wikidata CC0 (P569 day precision) + Wikipedia CC BY-SA 4.0.
          Year-only dates, source conflicts, minors, and D3 descriptions are dropped, not guessed.
        </p>
      </div>
    </section>
  );
}
