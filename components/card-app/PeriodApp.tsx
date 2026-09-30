"use client";

import { useEffect, useRef, useState } from "react";
import type { AppCardNote, AppEvent, CardApp } from "@/lib/card-app";
import type { AppConnection } from "@/lib/card-app-connection";
import { PERIOD_FILTERS } from "@/lib/period-meanings";
import { eventsInPeriod, eventPeriod, periodProgress } from "@/lib/period-experience";
import { Pc } from "@/components/year/YearBlueprintApp";
import { CardAppView, LocalDateSync } from "./CardApp";
import { Suspense } from "react";
import y from "@/components/year/year.module.css";
import s from "./period.module.css";

type Screen = "birth" | "year" | "period" | "days";
const TABS: { id: Screen; label: string; symbol: string }[] = [
  { id: "birth", label: "Birth card", symbol: "♧" },
  { id: "year", label: "This year", symbol: "◎" },
  { id: "period", label: "Period", symbol: "◒" },
  { id: "days", label: "Marked days", symbol: "▦" },
];
const STATUS = { done: "Past period", now: "Current period", next: "Ahead" };
const KIND = { good: "Support", watch: "Watch for", turn: "Transition" };

type Props = { data: CardApp; framed?: boolean } & (
  | { token: string; sample?: undefined }
  | { token?: undefined; sample: { connection: AppConnection } }
);

function Note({ label, item }: { label: string; item: AppCardNote }) {
  return <div className={s.noteRow}><Pc card={item.card} size="sm" /><div><p className={s.kicker}>{label}</p><h3 className={s.cardName}>{item.card.name}</h3><p className={s.body}>{item.note.light}</p></div></div>;
}

export function PeriodAppView(props: Props) {
  const { data, framed = false } = props;
  const [screen, setScreen] = useState<Screen>("period");
  const [selected, setSelected] = useState(data.year.current.index);
  const [filter, setFilter] = useState<"all" | AppEvent["kind"]>("all");
  const [more, setMore] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const Heading = props.sample ? "h2" : "h1";
  const Panel = props.sample ? "section" : "main";
  const panel = useRef<HTMLElement>(null);
  // A new birthday-year must not leave the previous year's period selected.
  useEffect(() => setSelected(data.year.current.index), [data.year.start, data.year.current.index]);
  const period = data.year.periods[selected] ?? data.year.current;
  const progress = periodProgress(period, data.today);
  const lens = PERIOD_FILTERS.find((item) => item.planet === period.planet)!;
  const marked = eventsInPeriod(data.year.events, period);
  const upcoming = marked.filter((event) => (event.end ?? event.date) >= data.today);
  const next = data.year.periods[period.index + 1];
  const visibleEvents = data.year.events.filter((event) => filter === "all" || event.kind === filter);
  const months = [...new Set(visibleEvents.map((event) => event.date.slice(0, 7)))];
  const navigate = (id: Screen, index?: number) => {
    if (index !== undefined) setSelected(index);
    setScreen(id);
    if (framed) panel.current?.scrollTo({ top: 0 });
    else window.scrollTo({ top: 0 });
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  };
  const showEvent = (event: AppEvent, i: number) => {
    const index = eventPeriod(data, event);
    return <button key={`${event.date}-${event.title}-${i}`} className={s.event} onClick={() => index !== undefined && navigate("period", index)}>
      <span className={s.eventDate}>{event.label}</span><span><span className={s.kicker}>{KIND[event.kind]}</span><strong>{event.title}</strong><span className={s.body}>{event.detail}</span>{event.card && <span className={s.caption}>{event.card.name}</span>}<span className={s.eventLink}>Open period →</span></span>
    </button>;
  };
  if (more) return <div className={s.legacy}><button className={s.back} onClick={() => setMore(false)}>← Back to your periods</button>{props.sample ? <CardAppView data={data} sample={props.sample} framed={framed} /> : <CardAppView data={data} token={props.token} framed={framed} />}</div>;
  return <div className={`${y.root} ${s.root}`}>
    <Suspense fallback={null}><LocalDateSync today={data.today} /></Suspense>
    <div className={`${s.shell} ${framed ? s.framed : ""}`}>
      <header className={s.header}><span>CB / CARD BLUEPRINTS</span><span>{data.todayLabel}</span></header>
      <Panel ref={panel} className={s.panel}>
        <div className={s.screenLabel}><span>{props.sample ? "Sample · July 14, 1988" : data.identity.birth.card.name}</span><button onClick={() => setMore(true)}>More cards ↗</button></div>
        <Heading ref={heading} tabIndex={-1} className={s.title}>{screen === "period" ? `${period.planet} period` : TABS.find((tab) => tab.id === screen)?.label}</Heading>
        {screen === "period" && <>
          <div className={s.periodMeta}><span className={s.badge}>{STATUS[period.state]}</span><span>{period.startLabel} — {period.endLabel}</span></div>
          <div className={s.hero}><Pc card={period.birth.card} /><div><p className={s.kicker}>Chapter {period.index + 1} of 7</p><h3 className={s.heroName}>{period.birth.card.name}</h3><p className={s.body}>{period.frame}</p></div></div>
          <div className={s.progressMeta}><span>{period.state === "now" ? `Day ${progress.day} of ${progress.total}` : `${progress.total} days`}</span><span>{period.state === "done" ? "Complete" : period.domain}</span></div>
          <div className={s.progress} role="progressbar" aria-label="Period progress" aria-valuenow={progress.day} aria-valuemin={0} aria-valuemax={progress.total}><i style={{ width: `${progress.percent}%` }} /></div>
          <div className={s.controls}><button disabled={selected === 0} onClick={() => navigate("period", selected - 1)}>← Previous</button><button onClick={() => navigate("period", data.year.current.index)}>Current</button><button disabled={selected === 6} onClick={() => navigate("period", selected + 1)}>Next →</button></div>
          <section className={s.section}><p className={s.kicker}>These {period.lengthDays} days</p><p className={s.lead}>{period.birth.note.light}</p><p className={s.body}>{period.pressure}</p><p className={s.caption}>Existing card and planet interpretations, brought together for reflection.</p></section>
          <section className={`${s.section} ${s.shadow}`}><p className={s.kicker}>Watch the pattern</p><p className={s.body}>{period.birth.note.shadow}</p><div className={s.rule} /><p className={s.kicker}>A practice to try</p><p className={s.body}>{period.birth.note.dare}</p><p className={s.prompt}>{lens.prompt}</p></section>
          <section className={s.section}><p className={s.kicker}>Where it sits in your year</p><Note label="Long Range · the year's theme" item={data.year.birth.longRange} /><div className={s.rule} /><Note label="Pluto · the year's challenge" item={data.year.birth.pluto} /><Note label="Result · the year's payoff" item={data.year.birth.result} /><button className={s.textButton} onClick={() => navigate("year")}>See all seven periods →</button></section>
          <section className={s.section}><p className={s.kicker}>Marked days in this period</p><p className={s.caption}>Calculated card matches and period changes. Use them as prompts, never promises.</p>{(period.state === "now" ? upcoming : marked).slice(0, 4).map(showEvent)}{(period.state === "now" ? upcoming : marked).length === 0 && <p className={s.body}>No remaining marked dates in this period.</p>}<button className={s.textButton} onClick={() => navigate("days")}>See the year's marked days →</button></section>
          <button className={s.nextPeriod} onClick={() => next ? navigate("period", next.index) : navigate("year")}><span className={s.kicker}>{next ? "Next chapter" : "Year's closing chapter"}</span><strong>{next ? `${next.planet} · ${next.birth.card.name}` : "A new set begins on your birthday"}</strong><span>{next ? `${next.startLabel} — ${next.endLabel} →` : "See this year's arc →"}</span></button>
        </>}
        {screen === "birth" && <>
          <p className={s.caption}>Born {data.birthdateDisplay} · the same birthday returns the same card.</p><div className={s.hero}><Pc card={data.identity.birth.card} /><div><p className={s.kicker}>{data.identity.birth.title}</p><h3 className={s.heroName}>{data.identity.birth.card.name}</h3></div></div>
          <section className={s.section}><p className={s.kicker}>Your pattern</p><p className={s.lead}>{data.identity.birth.coreIdentity}</p><p className={s.body}>{data.identity.birth.sweetSpot}</p>{data.identity.birth.lens && Object.entries(data.identity.birth.lens).map(([key, value]) => <p key={key} className={s.body}><strong>{key === "balanced" ? "At your best" : key === "under" ? "Too little" : "Too much"}:</strong> {value}</p>)}</section>
          <section className={`${s.section} ${s.shadow}`}><p className={s.kicker}>What to notice</p><p className={s.body}>{data.identity.birth.shadow}</p><p className={s.body}>{data.identity.birth.cost}</p><p className={s.prompt}>{data.identity.birth.watchFor}</p></section>
          {data.identity.birth.lifeDirection && <section className={s.section}><p className={s.kicker}>Life direction</p><p className={s.body}>{data.identity.birth.lifeDirection}</p></section>}
        </>}
        {screen === "year" && <>
          <p className={s.caption}>{data.year.startLabel} — {data.year.endLabel} · Age {data.age}</p><p className={s.lead}>Seven chapters. One birthday year.</p>
          <div className={s.timeline}>{data.year.periods.map((item) => <button key={item.index} className={`${s.timelineRow} ${item.state === "now" ? s.currentRow : ""}`} onClick={() => navigate("period", item.index)}><span className={s.number}>{String(item.index + 1).padStart(2, "0")}</span><span><span className={s.kicker}>{item.planet} · {STATUS[item.state]}</span><strong>{item.birth.card.name}</strong><span className={s.caption}>{item.startLabel} — {item.endLabel}</span></span><span aria-hidden="true">↗</span></button>)}</div>
          <section className={s.section}><Note label="Long Range · the year's theme" item={data.year.birth.longRange} />{data.year.birth.longRange.projection && <p className={s.caption}>After age 89 the card cycles repeat from age 0. This is a projection.</p>}<div className={s.cycle}>{data.year.birth.longRange.cycle.map((card, i) => <span key={i} className={i === data.year.birth.longRange.yearInCycle - 1 ? s.activeCycle : ""}>{data.year.birth.longRange.cycleStartAge + i}<strong>{card.code}</strong></span>)}</div></section>
          <section className={s.section}><Note label="Pluto · the year's challenge" item={data.year.birth.pluto} /><Note label="Result · the year's payoff" item={data.year.birth.result} /></section>
          <section className={s.section}>{data.year.environment && <Note label="Environment · support" item={data.year.environment} />}{data.year.displacement && <Note label="Displacement · your seat" item={data.year.displacement} />}{data.identity.fixed && <p className={s.body}>Your card is fixed. It has no Environment or Displacement card.</p>}{data.year.signals.map((signal, i) => <p key={i} className={s.body}><strong>{signal.title}.</strong> {signal.detail}</p>)}</section>
        </>}
        {screen === "days" && <>
          <p className={s.lead}>Dates to notice.</p><p className={s.body}>Card matches and chapter changes across this birthday year. These are reflection markers, not predictions of events.</p><p className={s.caption}>{data.year.startLabel} — {data.year.endLabel}</p>
          <div className={s.filters} aria-label="Filter marked days">{(["all", "good", "watch", "turn"] as const).map((kind) => <button key={kind} aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{kind === "all" ? "All" : KIND[kind]}</button>)}</div>
          <div className={s.section}>{months.map((month) => <section key={month} aria-label={month}><h3 className={s.kicker}>{new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</h3>{visibleEvents.filter((event) => event.date.startsWith(month)).map(showEvent)}</section>)}{months.length === 0 && <p className={s.body}>No marked dates match this filter.</p>}</div>
        </>}
        <p className={s.footer}>A mirror, not a forecast. Notice what fits. You choose what to do with it.</p>
      </Panel>
      <nav className={s.tabs} aria-label="App sections">{TABS.map((tab) => <button key={tab.id} aria-current={screen === tab.id ? "page" : undefined} onClick={() => navigate(tab.id)}><span aria-hidden="true">{tab.symbol}</span>{tab.label}</button>)}</nav>
    </div>
  </div>;
}
