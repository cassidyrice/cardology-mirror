"use client";

import { useState } from "react";

import type { YearBlueprint, YearCard, YearChapter } from "@/lib/year-blueprint";

import s from "./year.module.css";

type ScreenId = "preview" | "card" | "now" | "chapters" | "story";

type Props = {
  data: YearBlueprint;
  /**
   * preview — sales mode: shows the birthday entry + paywall screen, and the
   *           inside screens blurred behind an unlock veil.
   * full    — the purchased product.
   */
  mode: "preview" | "full";
  /** Where the unlock button goes (preview mode). */
  checkoutHref?: string;
  /**
   * Hosted-checkout unlock (preview mode). When set with a birthdate, the unlock
   * button POSTs the birthday to the checkout session route instead of linking.
   * Without a birthdate (sample preview) it focuses the birthday field.
   */
  unlock?: { action: string; source: string; birthdate?: string };
  /** Preview mode: called with the ISO birthday the visitor enters (instead of a GET submit). */
  onBirthdate?: (iso: string) => void;
  /** Price label for the unlock button (preview mode). */
  priceLabel?: string;
  /** Wrap in a phone bezel (sales page) or fill the viewport (product). */
  framed?: boolean;
  /** Whether the preview is showing an example birthday rather than the visitor's. */
  sample?: boolean;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- playing card ---------- */

function Pc({ card, size }: { card: YearCard; size?: "sm" | "xs" }) {
  const cls = cx(s.pc, card.red && s.pcRed, size === "sm" && s.pcSm, size === "xs" && s.pcXs);
  if (size === "xs") {
    return (
      <div className={cls} aria-label={card.name}>
        <div className={s.c}>{card.code}</div>
      </div>
    );
  }
  return (
    <div className={cls} aria-label={card.name}>
      <div className={s.r}>
        {card.rank}
        <small>{card.suit}</small>
      </div>
      <div className={s.c}>{card.suit}</div>
      <div className={cx(s.r, s.rb)}>
        {card.rank}
        <small>{card.suit}</small>
      </div>
    </div>
  );
}

/* ---------- year map (SVG) ---------- */

const RING_R = 92;
const CX = 170;
const CY = 180;

function polar(angleDeg: number, r: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function YearMap({ data }: { data: YearBlueprint }) {
  const totalDays = data.chapters.reduce((n, c) => n + c.lengthDays, 0);
  const cur = data.current;
  const dayInYear =
    data.chapters.slice(0, cur.index).reduce((n, c) => n + c.lengthDays, 0) +
    (cur.dayInChapter ?? cur.lengthDays);
  const angle = (dayInYear / totalDays) * 360;
  const end = polar(angle, RING_R);
  const start = polar(0, RING_R);
  const large = angle > 180 ? 1 : 0;
  const arc = `M${start.x} ${start.y} A${RING_R} ${RING_R} 0 ${large} 1 ${end.x} ${end.y}`;

  const mono = "ui-monospace, Menlo, monospace";
  const disp = "Cormorant Garamond, Georgia, serif";

  const sat = [
    { x: 170, y: 12, card: data.longRange.card, label: "LONG RANGE · 7 YRS", gold: true, ly: 56 },
    { x: 300, y: 284, card: data.pluto.card, label: "PLUTO", gold: true, ly: 332 },
    { x: 40, y: 284, card: data.result.card, label: "RESULT", gold: true, ly: 332 },
    data.karma.environment && { x: 36, y: 52, card: data.karma.environment.card, label: "ENVIRONMENT", gold: false, ly: 100, lx: 40 },
    data.karma.displacement && { x: 304, y: 52, card: data.karma.displacement.card, label: "DISPLACEMENT", gold: false, ly: 100, lx: 298 },
  ].filter(Boolean) as Array<{ x: number; y: number; card: YearCard; label: string; gold: boolean; ly: number; lx?: number }>;

  return (
    <svg
      className={s.diagram}
      viewBox="0 0 340 360"
      role="img"
      aria-label="Year map: birth card in the centre, seven chapter cards on a ring, with Long Range, Pluto, Result, Environment and Displacement around the outside"
    >
      <defs>
        <radialGradient id="ybg" cx="50%" cy="50%">
          <stop offset="0" stopColor="#3a2a12" />
          <stop offset="1" stopColor="#1b1524" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r="150" fill="url(#ybg)" />
      <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="#332842" strokeWidth="1.2" />
      {angle > 1 && <path d={arc} fill="none" stroke="#d9a64c" strokeWidth="3" strokeLinecap="round" />}

      {sat.map((n) => (
        <line key={n.label} x1={CX} y1={CY} x2={n.x} y2={n.y + 17} stroke={n.gold ? "#4a3a5c" : "#6b2b30"} strokeDasharray="3 4" />
      ))}

      <rect x={CX - 20} y={CY - 28} width="40" height="56" rx="5" fill="#f3e9d6" stroke="#8a7455" />
      <text x={CX} y={CY - 4} textAnchor="middle" fontFamily={disp} fontWeight="600" fontSize="15" fill={data.birthCard.red ? "#a83a32" : "#1a1620"}>
        {data.birthCard.code}
      </text>
      <text x={CX} y={CY + 16} textAnchor="middle" fontFamily={mono} fontSize="7" fill="#7f6f91">BIRTH</text>

      {data.chapters.map((c, i) => {
        const mid = ((i + 0.5) / 7) * 360;
        const p = polar(mid, RING_R);
        const lp = polar(mid, RING_R + 28);
        const now = c.state === "now";
        return (
          <g key={c.planet} fontFamily={disp} fontWeight="600" fontSize="13" textAnchor="middle">
            <circle cx={p.x} cy={p.y} r={now ? 18 : 16} fill={now ? "#3a2c14" : "#1b1524"} stroke={now ? "#f1cb7e" : "#7f6f91"} strokeWidth={now ? 2 : 1} />
            <text x={p.x} y={p.y + 5} fill={now ? "#f1cb7e" : c.card.red ? "#e0b9b2" : "#efe4d2"}>{c.card.code}</text>
            <text x={lp.x} y={lp.y + 3} fontFamily={mono} fontSize="7" fill={now ? "#f1cb7e" : "#7f6f91"}>
              {c.planet.toUpperCase()}{now ? " · NOW" : ""}
            </text>
          </g>
        );
      })}

      {sat.map((n) => (
        <g key={n.label} fontFamily={disp} fontWeight="600" fontSize="14" textAnchor="middle">
          <rect x={n.x - 20} y={n.y} width="40" height="34" rx="6" fill={n.gold ? "#251c31" : "#241018"} stroke={n.gold ? "#d9a64c" : "#c0453c"} />
          <text x={n.x} y={n.y + 22} fill={n.card.red ? "#e0b9b2" : "#efe4d2"}>{n.card.code}</text>
          <text x={n.lx ?? n.x} y={n.ly} fontFamily={mono} fontSize="7" fill={n.gold ? "#d9a64c" : "#d98a83"}>{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- unlock button ---------- */

type Unlock = { action: string; source: string; birthdate?: string };

function UnlockButton({
  href, unlock, label,
}: { href: string; unlock?: Unlock; label: string }) {
  if (unlock && unlock.birthdate) {
    return (
      <form action={unlock.action} method="post" data-analytics-checkout>
        <input type="hidden" name="birthdate" value={unlock.birthdate} />
        <input type="hidden" name="source" value={unlock.source} />
        <button type="submit" className={s.btn}>{label}</button>
      </form>
    );
  }
  if (unlock) {
    return (
      <button
        type="button"
        className={s.btn}
        onClick={() => {
          const el = document.getElementById("yb-birthdate") as HTMLInputElement | null;
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
          try { el?.showPicker?.(); } catch { /* not supported */ }
        }}
      >
        Enter your birthday to unlock
      </button>
    );
  }
  return <a className={s.btn} href={href}>{label}</a>;
}

/* ---------- screens ---------- */

function PreviewScreen({
  data, checkoutHref, unlock, onBirthdate, priceLabel, sample, go,
}: { data: YearBlueprint; checkoutHref: string; unlock?: Unlock; onBirthdate?: (iso: string) => void; priceLabel: string; sample: boolean; go: (id: ScreenId) => void }) {
  const cur = data.current;
  return (
    <>
      <div className={s.eyebrow}>52xSeven Blueprint</div>
      <h1 className={s.h1}>Your whole year. One place to look it in the eye.</h1>
      <p className={s.p}>
        Enter your birthday. We show your card and the chapter you&rsquo;re standing in right now — before you pay a cent.
      </p>

      <form
        method={onBirthdate ? undefined : "get"}
        className={s.field}
        onSubmit={(e) => {
          if (!onBirthdate) return;
          e.preventDefault();
          const value = (e.currentTarget.elements.namedItem("birthdate") as HTMLInputElement | null)?.value;
          if (value) onBirthdate(value);
        }}
      >
        <label htmlFor="yb-birthdate">Birthday</label>
        <input
          id="yb-birthdate"
          name="birthdate"
          type="date"
          className={s.input}
          defaultValue={data.birthdate}
          min="1900-01-01"
          max={data.targetDate}
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (!value) return;
            if (onBirthdate) onBirthdate(value);
            else e.currentTarget.form?.requestSubmit();
          }}
        />
      </form>
      {sample && <p className={s.note}>Showing an example birthday. Change it to see your own.</p>}

      <button type="button" className={cx(s.card, s.cardGlow, s.hero)} style={{ textAlign: "left", cursor: "pointer" }} onClick={() => go("card")}>
        <Pc card={data.birthCard} />
        <div className={s.stack}>
          <div className={s.eyebrow}>Your birth card</div>
          <h2 className={s.h2}>{data.birthCard.name}</h2>
          <p className={cx(s.p, s.small)}>{data.birthCopy.light}</p>
          <span className={cx(s.pill, s.pillGold)}>Tap the card ↗</span>
        </div>
      </button>

      <div className={cx(s.card, s.stack)}>
        <div className={cx(s.row, s.between)}>
          <div className={s.eyebrow}>Right now · {cur.planet} chapter</div>
          <span className={cx(s.tag, s.tagNow)}>Day {cur.dayInChapter} of {cur.lengthDays}</span>
        </div>
        <div className={s.row}>
          <Pc card={cur.card} size="sm" />
          <div>
            <h3 className={s.h3}>{cur.card.name}</h3>
            <p className={cx(s.p, s.small)}>{cur.startLabel} – {cur.endLabel}. {cur.copy.light}</p>
          </div>
        </div>
        <div className={s.progress}><i style={{ width: `${cur.progress ?? 0}%` }} /></div>
      </div>

      <div className={s.locked}>
        <div className={cx(s.blur, s.stack)} style={{ gap: 14 }} aria-hidden="true">
          <div className={s.card}>
            <div className={s.eyebrow}>Shadow read</div>
            <h3 className={s.h3}>What the {data.birthCard.name.split(" ")[0]} hides</h3>
            <p className={s.p}>{data.birthCopy.shadow}</p>
          </div>
          <div className={s.card}>
            <div className={s.eyebrow}>Next {data.chapters.filter((c) => c.state === "next").length} chapters</div>
            <h3 className={s.h3}>{data.next?.startLabel ?? cur.startLabel} → {data.yearEndLabel}</h3>
            <p className={s.p}>{data.chapters.filter((c) => c.state === "next").map((c) => c.card.code).join(" · ")} · then Pluto and Result close the year.</p>
          </div>
        </div>
        <div className={s.veil}>
          <div className={s.eyebrow} style={{ color: "var(--yb-bone-2)" }}>Unlock 12 months · one payment · no renewal</div>
          <UnlockButton href={checkoutHref} unlock={unlock} label={`Unlock my full year — ${priceLabel}`} />
          <p className={s.note} style={{ textAlign: "center" }}>Instant access. Sign-in link by email.</p>
        </div>
      </div>
    </>
  );
}

function CardScreen({ data, go }: { data: YearBlueprint; go: (id: ScreenId) => void }) {
  const first = data.birthCard.name.split(" ")[0];
  return (
    <>
      <div className={s.eyebrow}>My card</div>
      <div className={s.hero}>
        <Pc card={data.birthCard} />
        <div className={s.stack}>
          <h1 className={s.h1}>{data.birthCard.name}</h1>
          <div className={s.row} style={{ gap: 6, flexWrap: "wrap" }}>
            {data.birthCard.title && <span className={s.pill}>{data.birthCard.title}</span>}
            <span className={s.pill}>{data.birthdateDisplay.replace(/, \d{4}$/, "")}</span>
            <span className={s.pill}>Age {data.age}</span>
          </div>
        </div>
      </div>
      <div className={cx(s.card, s.stack)}>
        <div className={s.eyebrow}>The light</div>
        <p className={s.p}><strong>{data.birthCopy.light}</strong> {data.birthIdentity}</p>
      </div>
      <div className={cx(s.shadowBox, s.stack)}>
        <div className={s.eyebrow}>The shadow</div>
        <h3 className={s.h3}>What the {first} hides</h3>
        <p className={s.p}>{data.birthCopy.shadow}</p>
        {data.birthShadowLong && <p className={cx(s.p, s.small)}>{data.birthShadowLong}</p>}
        <p className={s.p}>The dare this year: <strong>{data.birthCopy.dare}</strong></p>
      </div>
      <div className={cx(s.card, s.stack)}>
        <div className={s.eyebrow}>Where the year points</div>
        <p className={s.p}>
          The {first} who gets clean this year becomes the <strong>{data.result.card.name}</strong> the Result position is pointing at. {data.result.copy.light}
        </p>
      </div>
      <button type="button" className={cx(s.btn, s.btnGhost)} onClick={() => go("now")}>See where I am right now →</button>
    </>
  );
}

function NowScreen({ data, go }: { data: YearBlueprint; go: (id: ScreenId) => void }) {
  const c = data.current;
  const next = data.next;
  return (
    <>
      <div className={s.eyebrow}>Current chapter · {c.planet}</div>
      <h1 className={s.h1}>{c.card.name}</h1>
      <div className={s.meta}>
        <span>{c.startLabel} – {c.endLabel}</span>
        <b>Day {c.dayInChapter} · {c.daysLeft} left</b>
      </div>
      <div className={s.progress}><i style={{ width: `${c.progress ?? 0}%` }} /></div>

      <div className={cx(s.card, s.cardGlow, s.hero)}>
        <Pc card={c.card} />
        <div className={s.stack}>
          <div className={s.eyebrow}>{c.planet} × {c.card.code}</div>
          <p className={cx(s.p, s.small)}>{c.frame}</p>
        </div>
      </div>

      <div className={cx(s.card, s.stack)}>
        <div className={s.eyebrow}>The light</div>
        <p className={s.p}><strong>{c.copy.light}</strong></p>
      </div>

      <div className={cx(s.shadowBox, s.stack)}>
        <div className={s.eyebrow}>The shadow</div>
        <p className={s.p}>{c.copy.shadow}</p>
        <p className={cx(s.p, s.small)}>{c.pressure}</p>
        <p className={s.p}>
          <strong>{c.daysLeft} {c.daysLeft === 1 ? "day" : "days"} left.</strong>{" "}
          {next ? `Before ${next.planet} walks in on ${next.startLabel}: ` : "Before your next birthday: "}
          {c.copy.dare}
        </p>
      </div>

      {next && (
        <div className={cx(s.card, s.stack)}>
          <div className={s.eyebrow}>Up next · {next.startLabel}</div>
          <div className={s.row} style={{ alignItems: "center" }}>
            <Pc card={next.card} size="xs" />
            <p className={cx(s.p, s.small)}><strong>{next.planet} · {next.card.name}.</strong> {next.copy.light}</p>
          </div>
        </div>
      )}
      <button type="button" className={cx(s.btn, s.btnGhost)} onClick={() => go("chapters")}>All seven chapters →</button>
    </>
  );
}

function ChapterRow({ c }: { c: YearChapter }) {
  return (
    <div className={cx(s.cycle, c.state === "now" && s.cycleNow, c.state === "done" && s.cycleDone)}>
      <Pc card={c.card} size="sm" />
      <div>
        <div className={s.cycleTop}>
          <span className={s.planet}>{c.planet}{c.state === "now" ? " · now" : ""}</span>
          <span className={s.date}>{c.startLabel} – {c.endLabel}</span>
        </div>
        <h3 className={s.h3}>{c.card.name}</h3>
        <p className={cx(s.p, s.small)}>
          {c.copy.light} <span className={s.sh}>Shadow: {c.copy.shadow.split(/(?<=[.!?])\s/)[0]}</span>
        </p>
      </div>
    </div>
  );
}

function ChaptersScreen({ data, go }: { data: YearBlueprint; go: (id: ScreenId) => void }) {
  return (
    <>
      <div className={s.eyebrow}>My year · seven chapters</div>
      <h1 className={s.h1}>{data.yearStartLabel} → {data.yearEndLabel}</h1>
      <p className={s.p}>Each chapter is 52 days. Neptune keeps the extra day{data.chapters[6].lengthDays === 54 ? "s" : ""}. Light first, then the shadow.</p>
      <div className={s.card} style={{ padding: "4px 16px" }}>
        {data.chapters.map((c) => <ChapterRow key={c.planet} c={c} />)}
      </div>
      <button type="button" className={cx(s.btn, s.btnGhost)} onClick={() => go("story")}>Read the whole story arc →</button>
    </>
  );
}

function StoryScreen({ data }: { data: YearBlueprint }) {
  const ch = data.chapters;
  const acts = [
    { k: `Act I · ${ch[0].startLabel} – ${ch[1].endLabel} · ${ch[0].card.code} → ${ch[1].card.code}`, cards: [ch[0], ch[1]] },
    { k: `Act II · ${ch[2].startLabel} – ${ch[3].endLabel} · ${ch[2].card.code} → ${ch[3].card.code}`, cards: [ch[2], ch[3]] },
    { k: `Act III · ${ch[4].startLabel} – ${ch[5].endLabel} · ${ch[4].card.code} → ${ch[5].card.code}`, cards: [ch[4], ch[5]] },
    { k: `Act IV · ${ch[6].startLabel} – ${ch[6].endLabel} · ${ch[6].card.code}`, cards: [ch[6]] },
  ];
  const lr = data.longRange;
  return (
    <>
      <div className={s.eyebrow}>The year as a story</div>
      <h1 className={s.h1}>Age {data.age}: the year of the {data.result.card.name}</h1>

      <div className={cx(s.card, s.stack)} style={{ padding: 14, gap: 12 }}>
        <div className={s.eyebrow}>Your year map</div>
        <YearMap data={data} />
        <div className={s.legend}>
          <div><i style={{ background: "#f1cb7e" }} />Gold arc = where you are</div>
          <div><i style={{ background: "#7f6f91" }} />Ring = seven 52-day chapters</div>
          <div><i style={{ background: "#d9a64c" }} />Gold boxes = year-long cards</div>
          <div><i style={{ background: "#c0453c" }} />Red boxes = karma of the year</div>
        </div>
      </div>

      <div className={cx(s.card, s.stack)}>
        <div className={s.eyebrow}>The setup · Long Range {lr.card.code} (ages {lr.cycleStartAge}–{lr.cycleEndAge})</div>
        <p className={s.p}>
          Year {lr.yearInCycle} of 7 under the <strong>{lr.card.name}</strong>. {lr.copy.light}{" "}
          <span className={s.sh}>Shadow: {lr.copy.shadow}</span>
        </p>
      </div>

      <div className={s.stack} style={{ gap: 0 }}>
        {acts.map((a) => (
          <div key={a.k} className={s.chapter}>
            <div className={s.dot}><i /></div>
            <div className={s.stack} style={{ gap: 6, paddingBottom: 18 }}>
              <span className={s.k}>{a.k}</span>
              <h3 className={s.h3}>{a.cards.map((c) => c.card.name).join(", then the ")}.</h3>
              {a.cards.map((c) => (
                <p key={c.planet} className={cx(s.p, s.small)}>
                  <strong>{c.planet}:</strong> {c.copy.light} <span className={s.sh}>{c.pressure}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <hr className={s.goldRule} />
      <div className={cx(s.card, s.stack)} style={{ gap: 10 }}>
        <div className={s.eyebrow}>The undertow · Pluto {data.pluto.card.code}</div>
        <p className={s.p}><strong>The thing you&rsquo;re being dragged to change:</strong> {data.pluto.copy.shadow} It hurts all year and it&rsquo;s supposed to.</p>
        <div className={s.divider} />
        <div className={s.eyebrow}>The reward · Result {data.result.card.code}</div>
        <p className={s.p}><strong>What you get if you don&rsquo;t flinch:</strong> the {data.result.card.name}. {data.result.copy.light}</p>
      </div>

      <div className={cx(s.shadowBox, s.stack)} style={{ gap: 10 }}>
        <div className={s.eyebrow}>Karma of the year</div>
        {data.karma.fixed ? (
          <p className={s.p}>Your card is one of the three fixed cards. It never moves, so it carries no environment or displacement card — the pressure comes from inside.</p>
        ) : (
          <>
            {data.karma.environment && (
              <div className={s.row}>
                <Pc card={data.karma.environment.card} size="xs" />
                <p className={cx(s.p, s.small)}>
                  <strong>Environment · {data.karma.environment.card.name}.</strong> The room already carries this: {data.karma.environment.copy.light}{" "}
                  <span className={s.sh}>Shadow: {data.karma.environment.copy.shadow}</span>
                </p>
              </div>
            )}
            {data.karma.displacement && (
              <div className={s.row}>
                <Pc card={data.karma.displacement.card} size="xs" />
                <p className={cx(s.p, s.small)}>
                  <strong>Displacement · {data.karma.displacement.card.name}.</strong> What you push onto other people this year:{" "}
                  <span className={s.sh}>{data.karma.displacement.copy.shadow}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <p className={s.note}>
        Period spread {data.spreads.period} · karma spread {data.spreads.karma} · Long Range spread {data.spreads.longRange}. Built from the deterministic Cardology engine and a reviewed copy library. A mirror, not a forecast.
      </p>
    </>
  );
}

/* ---------- tab icons ---------- */

const ICONS: Record<ScreenId, React.ReactNode> = {
  preview: <svg viewBox="0 0 24 24"><path d="M4 20V10l8-6 8 6v10H4z" /></svg>,
  card: <svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M12 9v6M9 12h6" /></svg>,
  now: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  chapters: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" /></svg>,
  story: <svg viewBox="0 0 24 24"><path d="M3 18C7 6 17 6 21 18" /><circle cx="12" cy="9" r="1.5" /></svg>,
};

const LABELS: Record<ScreenId, string> = {
  preview: "Preview", card: "My card", now: "Now", chapters: "Chapters", story: "Story",
};

/* ---------- app ---------- */

export function YearBlueprintApp({
  data, mode, checkoutHref = "#", unlock, onBirthdate, priceLabel = "$19", framed = mode === "preview", sample = false, className,
}: Props) {
  const [screen, setScreen] = useState<ScreenId>(mode === "preview" ? "preview" : "now");
  const tabs: ScreenId[] = mode === "preview"
    ? ["preview", "card", "now", "chapters", "story"]
    : ["card", "now", "chapters", "story"];

  const go = (id: ScreenId) => setScreen(id);
  const locked = mode === "preview" && screen !== "preview";

  const inner = (() => {
    switch (screen) {
      case "preview": return <PreviewScreen data={data} checkoutHref={checkoutHref} unlock={unlock} onBirthdate={onBirthdate} priceLabel={priceLabel} sample={sample} go={go} />;
      case "card": return <CardScreen data={data} go={go} />;
      case "now": return <NowScreen data={data} go={go} />;
      case "chapters": return <ChaptersScreen data={data} go={go} />;
      case "story": return <StoryScreen data={data} />;
    }
  })();

  const today = new Date(data.targetDate + "T00:00:00Z");
  const statusDate = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div className={cx(s.root, className)}>
      <div className={framed ? s.phone : s.full}>
        {framed && <div className={s.notch} />}
        {framed && <div className={s.status}><span>9:41</span><span>{statusDate}</span></div>}

        <section className={cx(s.screen, locked && s.blur)} key={screen} aria-hidden={locked || undefined}>
          {inner}
        </section>
        {locked && (
          <div className={s.lockVeil}>
            <div className={s.eyebrow} style={{ color: "var(--yb-bone-2)" }}>This screen is inside your year</div>
            <UnlockButton href={checkoutHref} unlock={unlock} label={`Unlock my full year — ${priceLabel}`} />
            <button type="button" className={cx(s.btn, s.btnGhost)} onClick={() => go("preview")}>Back to preview</button>
          </div>
        )}

        <nav className={s.tabs} aria-label="Sections">
          {tabs.map((id) => (
            <button key={id} type="button" className={cx(s.tab, screen === id && s.tabOn)} onClick={() => go(id)} aria-current={screen === id ? "page" : undefined}>
              {ICONS[id]}
              {LABELS[id]}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
