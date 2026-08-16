import { allBirthdateSeo } from "@/lib/seo-cards";
import { BIRTHDAY_DIRECTORY_PATH } from "@/lib/site";

const MONTH_ORDER = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function PlayingCardsBirthdayChart() {
  const dates = allBirthdateSeo();
  const byMonth = MONTH_ORDER.map((name) => ({
    name,
    days: dates.filter((d) => d.label.startsWith(`${name} `)),
  }));

  return (
    <div>
      <div className="space-y-8">
        {byMonth.map((month) => (
          <div key={month.name}>
            <h3 className="mb-3 font-serif text-xl text-bone">{month.name}</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {month.days.map((d) => (
                <a
                  key={d.slug}
                  href={`/born-on/${d.slug}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-center transition hover:border-gold/40"
                >
                  <span className="block text-[0.7rem] uppercase tracking-[0.12em] text-faint">
                    {d.day}
                  </span>
                  <span className="mt-1 block font-serif text-sm text-bone">
                    {d.card.rank}
                    {d.card.glyph}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="prose-reading mt-4 text-sm text-mist">
        Accessible alternative: the full list lives at{" "}
        <a href={BIRTHDAY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
          /born-on/
        </a>
        . Chart cells are plain links so crawlers and the Worker route resolve correctly.
      </p>
    </div>
  );
}
