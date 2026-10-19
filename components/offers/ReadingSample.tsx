import { getCardSeo } from "@/lib/seo-cards";

/** Fictional birthday; the interpretation comes from the same card library as the tools. */
export function ReadingSample() {
  const card = getCardSeo("8♦");
  return <figure className="reading-sample">
    <div className="reading-sample-rule"><span>Inside a reading</span><span>Fictional example · 01</span></div>
    <div className="reading-sample-identity">
      <img src="/share-cards/faces/8-of-diamonds.png" width="624" height="936" alt="Eight of Diamonds playing card" />
      <div><p className="type-eyebrow">Birth card · February 17</p><h3>Eight of Diamonds</h3><p>{card?.title}</p></div>
    </div>
    <div className="reading-sample-dial">
      <div><h4>At your best</h4><p>{card?.sweetSpot}</p></div>
      <div><h4>Pushed too far</h4><p>{card?.over}</p></div>
    </div>
    <div className="reading-sample-question"><span>Your reflection</span><p>Which end of the dial did the people closest to you get this past month?</p></div>
    <figcaption>Calculated card. Traditional interpretation. Your answer.</figcaption>
  </figure>;
}
