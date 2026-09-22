import { allBirthdateSeo } from "@/lib/seo-cards";
import { BIRTHDAY_DIRECTORY_PATH } from "@/lib/site";
import { TableScroll } from "@/components/seo/TableScroll";

// The classic Cardology chart: months across, days down, one playing card per
// cell. Every cell is a plain anchor into the Worker-served /born-on/ pages so
// the chart is crawlable text (competitors ship it as a JPG) and every one of
// the 366 birthday pages gets a link from the ranking URL.

const MONTHS = [
  ["January", "Jan"],
  ["February", "Feb"],
  ["March", "Mar"],
  ["April", "Apr"],
  ["May", "May"],
  ["June", "Jun"],
  ["July", "Jul"],
  ["August", "Aug"],
  ["September", "Sep"],
  ["October", "Oct"],
  ["November", "Nov"],
  ["December", "Dec"],
] as const;

const RED_SUITS = new Set(["♥", "♦"]);

export const BIRTHDAY_CHART_IMAGE = {
  src: "/og/cardology-birthday-chart.png",
  width: 1600,
  height: 2100,
  alt: "Cardology birthday chart: a 12-month by 31-day grid showing the playing card for every birthday of the year",
} as const;

export function BirthdayChartTable({ showImage = true }: { showImage?: boolean }) {
  const dates = allBirthdateSeo();
  const byKey = new Map<string, (typeof dates)[number]>();
  for (const d of dates) {
    const monthName = d.label.split(" ")[0];
    byKey.set(`${monthName}-${d.day}`, d);
  }

  return (
    <div>
      <TableScroll label="Cardology birthday chart, months across and days down" className="mt-6">
        <table className="birthday-chart w-full border-collapse text-center text-[0.8rem] leading-none">
          <caption className="sr-only">
            Cardology birthday chart. Rows are days of the month, columns are months. Each cell is the playing card for that birthday and links to its page.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-brand-ivory px-2 py-2 text-left text-[0.65rem] uppercase tracking-[0.12em] text-brand-ink-soft">
                Day
              </th>
              {MONTHS.map(([full, short]) => (
                <th
                  key={full}
                  scope="col"
                  className="px-1 py-2 text-[0.65rem] uppercase tracking-[0.12em] text-brand-ink-soft"
                >
                  <abbr title={full} className="no-underline">{short}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <tr key={day} className="border-t border-brand-line">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-brand-ivory px-2 py-1.5 text-left font-medium tabular-nums text-brand-ink-soft"
                >
                  {day}
                </th>
                {MONTHS.map(([full]) => {
                  const d = byKey.get(`${full}-${day}`);
                  if (!d && full === "December" && day === 31) {
                    return (
                      <td key={full} className="px-0.5 py-1">
                        <a
                          href="/born-on/december-31"
                          title="December 31: the Joker"
                          className="inline-block min-w-[2.4rem] rounded-[3px] border border-transparent px-1 py-1 font-serif text-[0.8rem] text-brand-ink transition hover:border-brand-line-strong hover:bg-brand-paper"
                        >
                          <span className="sr-only">December 31: </span>
                          Joker
                        </a>
                      </td>
                    );
                  }
                  if (!d) {
                    return (
                      <td key={full} className="px-1 py-1.5 text-brand-ink-faint" aria-label={`${full} ${day} does not exist`}>
                        ·
                      </td>
                    );
                  }
                  const isRed = RED_SUITS.has(d.card.glyph);
                  return (
                    <td key={full} className="px-0.5 py-1">
                      <a
                        href={`/born-on/${d.slug}`}
                        title={`${d.label}: ${d.card.label}`}
                        className={`inline-block min-w-[2.4rem] rounded-[3px] border border-transparent px-1 py-1 font-serif text-[0.9rem] transition hover:border-brand-line-strong hover:bg-brand-paper ${
                          isRed ? "text-brand-oxblood" : "text-brand-ink"
                        }`}
                      >
                        {/* Date stays in the anchor text so "8♦" is not the
                            same phrase for every birthday of that card, or for
                            the meaning chip below the chart. */}
                        <span className="sr-only">{d.label}: </span>
                        {d.card.rank}
                        {d.card.glyph}
                      </a>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
      <p className="prose-reading mt-3 text-sm text-brand-ink-soft">
        Red is Hearts and Diamonds, black is Clubs and Spades. Every cell links to that birthday&rsquo;s page.
        December 31 is the Joker, the one date the 52-card map leaves unassigned. The full list with card names is at{" "}
        <a href={BIRTHDAY_DIRECTORY_PATH} className="text-brand-oxblood underline underline-offset-4">
          /born-on/
        </a>
        .
      </p>
      {showImage ? (
        <figure className="mt-6">
          <a href={BIRTHDAY_CHART_IMAGE.src} className="block" title="Open the printable Cardology birthday chart (PNG)">
            <img
              src={BIRTHDAY_CHART_IMAGE.src}
              width={BIRTHDAY_CHART_IMAGE.width}
              height={BIRTHDAY_CHART_IMAGE.height}
              alt={BIRTHDAY_CHART_IMAGE.alt}
              loading="lazy"
              className="h-auto w-full max-w-md rounded-[3px] border border-brand-line"
            />
          </a>
          <figcaption className="mt-2 text-sm text-brand-ink-soft">
            Printable version of the same chart.{" "}
            <a href={BIRTHDAY_CHART_IMAGE.src} download="cardology-birthday-chart.png" className="text-brand-oxblood underline underline-offset-4">
              Download the PNG
            </a>{" "}
            or pin it. Generated from the same calculation as the tool above.
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
