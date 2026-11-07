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
    <section className="card-section">
      <h2 className="card-h2">Famous people born under the {cardLabel}, for comparison</h2>
      <div className="prose-reading">
        <p>
          Birthdays are public record. The card is fixed by the date. A calendar coordinate, not a forecast. Use the list to test the pattern against people you already have strong opinions about. You do have opinions.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {people.map((person) => (
            <li key={person.qid} className="card-person">
              <a
                href={person.wikipedia}
                rel="noopener"
                className="font-medium text-brand-ink underline underline-offset-4"
              >
                {person.name}
              </a>
              <span className="text-brand-ink-soft">: {person.known_for}</span>
              <span className="block card-small">born {famousBirthdayLabel(person.born)}</span>
              <span className="block card-small">
                <a
                  href={wikidataUrl(person.qid)}
                  rel="noopener"
                  className="underline underline-offset-4"
                >
                  {person.qid}
                </a>
                {" "}
                <a href={person.wikipedia} rel="noopener" className="underline underline-offset-4">
                  Wikipedia
                </a>
              </span>
            </li>
          ))}
        </ul>
        <p className="card-note" data-slot="sources">
          Sources: Wikidata CC0 (P569 day precision) + Wikipedia CC BY-SA 4.0.
          Year-only dates, source conflicts, minors, and D3 descriptions are dropped, not guessed.
        </p>
      </div>
    </section>
  );
}
