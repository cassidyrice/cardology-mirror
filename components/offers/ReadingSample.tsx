import { SampleTabs } from "@/components/home/SampleTabs";
import { getCardSeo } from "@/lib/seo-cards";

/**
 * Notes from the reading desk: a fictional birthday, the interpretation from the
 * same card library as the tools, set as the square plate and spare text
 * (docs/design/DIRECTION.md §4). The card on the plate and the three tabs are
 * the sample; the two action cells open the sample PDFs.
 */
export function ReadingSample() {
  const card = getCardSeo("8♦");
  const panels = [
    { id: "works", label: "When it works", text: card?.sweetSpot ?? "" },
    { id: "far", label: "Pushed too far", text: card?.over ?? "" },
    {
      id: "homework",
      label: "Your homework",
      text: "Which end of the dial did the people closest to you get this past month? Not the one you wish.",
    },
  ].filter((p) => p.text);

  return (
    <>
      <figure className="sample-plate">
        <img
          src="/share-cards/faces/8-of-diamonds.png"
          width="1000"
          height="1500"
          alt="Eight of Diamonds playing card"
          loading="lazy"
          decoding="async"
        />
        <figcaption className="sample-caption">
          Birth card for February 17. {card?.title ? `${card.title}.` : ""} A fictional example.
        </figcaption>
      </figure>
      <div className="sample-text">
        <SampleTabs panels={panels} />
        <h2 id="home-sample-title" className="sample-title" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
          Something you&rsquo;ll recognize.<br />Something you&rsquo;ll argue with.
        </h2>
        <p className="sample-desc" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
          A reading is a place to start. The strengths you lean on too hard. The habits that keep starting the same fight. Questions you can take back into your actual life.
        </p>
        <div className="sample-actions" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
          <a className="sample-cell is-ink" href="/samples/birth-card-blueprint-sample.pdf">Read a sample Birth Card Blueprint (PDF)</a>
          <a className="sample-cell" href="/samples/chemistry-check-fictional-sample.pdf">Read a fictional Chemistry Check sample (PDF)</a>
        </div>
        <p className="sample-note">
          Sample people. Sample dates. The cards and dates are math; the meanings come from the Cardology tradition. Your real reading also has Cass&rsquo;s written interpretation, which is the part you&rsquo;ll reread.
        </p>
      </div>
    </>
  );
}
