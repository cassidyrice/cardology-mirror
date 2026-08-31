import { parseCard } from "@/lib/cards";
import { lifeSpread } from "@/lib/karma-origin";
import { shareFacePathFromCode } from "@/lib/share-cards";

function Face({ code }: { code: string }) {
  const src = shareFacePathFromCode(code);
  if (!src) return null;
  const label = parseCard(code)?.label ?? code;
  return <img src={src} alt={`${label} birth card`} width={80} height={120} />;
}

/** Life spread (spread 1): 3-card crown + 7×7, real faces, no planet labels. */
export function HomepageLifeSpread() {
  const spread = lifeSpread();

  return (
    <div className="home-life-spread mt-8 w-full max-w-[20rem]">
      <div className="home-life-spread-crown">
        <span />
        <span />
        {spread.crown.map((code) => (
          <Face key={`crown-${code}`} code={code} />
        ))}
        <span />
        <span />
      </div>
      <div className="home-life-spread-grid">
        {spread.grid.flatMap((row, r) =>
          row.map((code, c) => <Face key={`${r}-${c}-${code}`} code={code} />),
        )}
      </div>
    </div>
  );
}
