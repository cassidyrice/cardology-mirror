"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AppConnection, ConnectionSeat } from "@/lib/card-app-connection";
import type { AppCardNote, AppEvent, AppEventKind, AppIdentityCard, AppPeriod, CardApp } from "@/lib/card-app";
import { Pc } from "@/components/year/YearBlueprintApp";
import y from "@/components/year/year.module.css";

import s from "./app.module.css";

type ScreenId = "today" | "year" | "me" | "days" | "people";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function localIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s/)[0] ?? text;
}

/** The ruling card the app times: the first one that isn't the birth card (lib/card-app.ts). */
function timedRuler(data: CardApp): string {
  return data.identity.ruling.find((r) => r.card.code !== data.identity.birth.card.code)?.card.code ?? "ruling card";
}

/* ---------- shared bits ---------- */

function CardLine({ label, item, blurb, shadow = true }: { label: string; item: AppCardNote; blurb?: string; shadow?: boolean }) {
  return (
    <div className={y.row}>
      <Pc card={item.card} size="sm" />
      <div className={y.stack} style={{ gap: 4 }}>
        <span className={y.planet}>{label}</span>
        <h3 className={y.h3} style={{ fontSize: 19 }}>{item.card.name}</h3>
        {blurb && <p className={cx(y.p, y.small)}>{blurb}</p>}
        <p className={cx(y.p, y.small)}>
          {item.note.light}
          {shadow && <> <span className={y.sh}>Shadow: {firstSentence(item.note.shadow)}</span></>}
        </p>
      </div>
    </div>
  );
}

function Section({ eyebrow, children, shadowBox }: { eyebrow: string; children: React.ReactNode; shadowBox?: boolean }) {
  return (
    <div className={cx(shadowBox ? y.shadowBox : y.card, y.stack)} style={{ gap: 12 }}>
      <div className={y.eyebrow}>{eyebrow}</div>
      {children}
    </div>
  );
}

/* ---------- Today ---------- */

function TodayScreen({ data, go }: { data: CardApp; go: (id: ScreenId) => void }) {
  const d = data.day.today;
  const w = data.week.current;
  const p = data.year.current;
  const periodDay = Math.floor((Date.parse(data.today) - Date.parse(p.start)) / 86_400_000) + 1;
  const progress = Math.round((periodDay / p.lengthDays) * 100);
  const nextEvent = data.events.find((e) => e.kind !== "turn" && e.date > data.today) ?? data.events[0];
  return (
    <>
      <div className={y.eyebrow}>Today · {data.todayLabel}</div>
      <div className={cx(y.card, y.cardGlow, y.hero)}>
        <Pc card={d.birth.card} />
        <div className={y.stack}>
          <span className={y.planet}>Your card today</span>
          <h2 className={y.h1} style={{ fontSize: 30 }}>{d.birth.card.name}</h2>
          <p className={cx(y.p, y.small)}>{d.birth.note.light}</p>
        </div>
      </div>
      <div className={cx(y.shadowBox, y.stack)}>
        <div className={y.eyebrow}>Watch for</div>
        <p className={y.p}>{d.birth.note.shadow}</p>
        <p className={y.p}>Today&rsquo;s dare: <strong>{d.birth.note.dare}</strong></p>
      </div>
      {d.ruling && (
        <Section eyebrow="Your ruling card's day">
          <CardLine label={`Today for your ${timedRuler(data)}`} item={d.ruling} />
        </Section>
      )}

      <Section eyebrow="Next six days">
        <div className={s.strip}>
          {data.day.next.map((n) => (
            <div key={n.date} className={s.stripDay}>
              <span>{n.weekday}</span>
              <Pc card={n.birth.card} size="xs" />
              <span>{n.label.replace(/^\w+ /, "")}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={`This week · ${w.startLabel} – ${w.endLabel}`}>
        <CardLine label={`${w.planet} week of your ${p.planet} period`} item={w.birth} blurb={`Focus: ${w.domain}.`} />
        {w.ruling && <CardLine label="Ruling card's week" item={w.ruling} shadow={false} />}
      </Section>

      <Section eyebrow={`52-day period · ${p.planet}`}>
        <div className={y.meta}>
          <span>{p.startLabel} – {p.endLabel}</span>
          <b>Day {periodDay} of {p.lengthDays}</b>
        </div>
        <div className={y.progress}><i style={{ width: `${progress}%` }} /></div>
        <CardLine label={`${p.planet} × ${p.birth.card.code}`} item={p.birth} blurb={p.frame} />
        {p.ruling && <CardLine label="Ruling card's period" item={p.ruling} shadow={false} />}
      </Section>

      {nextEvent && (
        <button type="button" className={cx(y.card, y.stack)} style={{ textAlign: "left", cursor: "pointer", color: "inherit" }} onClick={() => go("days")}>
          <div className={cx(s.kind, s[nextEvent.kind])}>Coming up · {nextEvent.label}</div>
          <p className={y.p}><strong>{nextEvent.title}.</strong> {nextEvent.detail}</p>
          <span className={y.note}>See all good days →</span>
        </button>
      )}
      <p className={y.note}>Tip: add this page to your home screen so your card is one tap away.</p>
    </>
  );
}

/* ---------- Year ---------- */

function PeriodRow({ p }: { p: AppPeriod }) {
  return (
    <div className={cx(y.cycle, p.state === "now" && y.cycleNow, p.state === "done" && y.cycleDone)}>
      <Pc card={p.birth.card} size="sm" />
      <div>
        <div className={y.cycleTop}>
          <span className={y.planet}>{p.planet}{p.state === "now" ? " · now" : ""}</span>
          <span className={y.date}>{p.startLabel} – {p.endLabel}</span>
        </div>
        <h3 className={y.h3}>{p.birth.card.name}</h3>
        <p className={cx(y.p, y.small)}>
          {p.birth.note.light} <span className={y.sh}>Shadow: {firstSentence(p.birth.note.shadow)}</span>
        </p>
        {p.ruling && <p className={y.note}>Ruling card: {p.ruling.card.name}</p>}
      </div>
    </div>
  );
}

function YearScreen({ data }: { data: CardApp }) {
  const yr = data.year;
  const lr = yr.birth.longRange;
  // Ages past 89 read from the canonical age (mod 90), like every other card.
  const [age, setAge] = useState(data.age % data.life.length);
  const row = data.life[age];
  return (
    <>
      <div className={y.eyebrow}>My year · age {data.age}</div>
      <h2 className={y.h1}>{yr.startLabel} → {yr.endLabel}</h2>

      <div className={y.card} style={{ padding: "4px 16px" }}>
        {yr.periods.map((p) => <PeriodRow key={p.planet} p={p} />)}
      </div>

      <Section eyebrow={`Long Range · ages ${lr.cycleStartAge}–${lr.cycleEndAge}, year ${lr.yearInCycle} of ${lr.cycle.length}`}>
        <CardLine label="Theme of the year" item={lr} blurb={data.copy.longRange} />
        {lr.projection && (
          <p className={cx(y.p, y.small)}>Past 89 the cycles start again from age 0, so this is a projection.</p>
        )}
        <div className={s.chips} aria-label="Your seven-year cycle">
          {lr.cycle.map((c, i) => (
            <span key={i} className={cx(y.pill, i === lr.yearInCycle - 1 && y.pillGold)}>{lr.cycleStartAge + i}: {c.code}</span>
          ))}
        </div>
      </Section>

      <Section eyebrow="The work and the payoff">
        <CardLine label="Pluto · the challenge" item={yr.birth.pluto} blurb={data.copy.pluto} />
        <CardLine label="Result · the reward" item={yr.birth.result} blurb={data.copy.result} />
      </Section>

      <Section eyebrow="Year karma" shadowBox>
        {data.identity.fixed || (!yr.environment && !yr.displacement) ? (
          <p className={y.p}>Your card is one of the three fixed cards. It never moves, so it has no Environment or Displacement card.</p>
        ) : (
          <>
            {yr.environment && <CardLine label="Year Environment" item={yr.environment} blurb={data.copy.yearEnvironment} shadow={false} />}
            {yr.displacement && <CardLine label="Year Displacement" item={yr.displacement} blurb={data.copy.yearDisplacement} />}
          </>
        )}
      </Section>

      {yr.ruling && (
        <Section eyebrow={`Your ruling card's year · ${timedRuler(data)}`}>
          <CardLine label="Long Range" item={yr.ruling.longRange} shadow={false} />
          <CardLine label="Pluto" item={yr.ruling.pluto} shadow={false} />
          <CardLine label="Result" item={yr.ruling.result} shadow={false} />
        </Section>
      )}

      {yr.signals.length > 0 && (
        <Section eyebrow="What the year keeps saying">
          {yr.signals.map((sig, i) => (
            <div key={i} className={y.row} style={{ alignItems: "center" }}>
              <Pc card={sig.card} size="xs" />
              <p className={cx(y.p, y.small)}><strong>{sig.title}.</strong> {sig.detail}</p>
            </div>
          ))}
        </Section>
      )}

      <Section eyebrow="Every year of your life">
        <label className={cx(y.row, y.between)}>
          <span className={y.p}>Pick an age</span>
          <select className={s.select} value={age} onChange={(e) => setAge(Number(e.target.value))}>
            {data.life.map((l) => (
              <option key={l.age} value={l.age}>Age {l.age} ({l.calendarYear}–{l.calendarYear + 1})</option>
            ))}
          </select>
        </label>
        {row && (
          <table className={s.table}>
            <thead>
              <tr><th>Seat</th><th>Birth card</th>{row.ruling && <th>Ruling card</th>}</tr>
            </thead>
            <tbody>
              {["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"].map((planet, i) => (
                <tr key={planet}>
                  <td>{planet}</td>
                  <td><Code c={row.birth.periods[i]} /></td>
                  {row.ruling && <td><Code c={row.ruling.periods[i]} /></td>}
                </tr>
              ))}
              <tr><td>Pluto</td><td><Code c={row.birth.pluto} /></td>{row.ruling && <td><Code c={row.ruling.pluto} /></td>}</tr>
              <tr><td>Result</td><td><Code c={row.birth.result} /></td>{row.ruling && <td><Code c={row.ruling.result} /></td>}</tr>
              <tr><td>Long Range</td><td><Code c={row.birth.longRange} /></td>{row.ruling && <td><Code c={row.ruling.longRange} /></td>}</tr>
              <tr><td>Year Environment</td><td><Code c={row.environment} /></td>{row.ruling && <td />}</tr>
              <tr><td>Year Displacement</td><td><Code c={row.displacement} /></td>{row.ruling && <td />}</tr>
            </tbody>
          </table>
        )}
        <p className={y.note}>
          Spreads used for age {row?.age}: periods {row?.spreads.period}, karma {row?.spreads.karma}, Long Range {row?.spreads.longRange}.
        </p>
      </Section>
    </>
  );
}

function Code({ c }: { c: string | null }) {
  if (!c) return <span>—</span>;
  const red = c.endsWith("♥") || c.endsWith("♦");
  return <span className={red ? s.red : undefined}>{c}</span>;
}

/* ---------- Me ---------- */

function IdentityBlock({ item, label }: { item: AppIdentityCard; label: string }) {
  return (
    <>
      <div className={y.hero}>
        <Pc card={item.card} />
        <div className={y.stack}>
          <span className={y.planet}>{label}</span>
          <h2 className={y.h2}>{item.card.name}</h2>
          {item.title && <span className={y.pill}>{item.title}</span>}
        </div>
      </div>
      <Section eyebrow="Who you are">
        <p className={y.p}>{item.coreIdentity}</p>
        {item.gifts.length > 0 && <p className={cx(y.p, y.small)}><strong>Gifts:</strong> {item.gifts.join(" · ")}</p>}
        {item.lens && (
          <>
            <p className={cx(y.p, y.small)}><strong>At your best:</strong> {item.lens.balanced}</p>
            <p className={cx(y.p, y.small)}><strong>Too little:</strong> {item.lens.under}</p>
            <p className={cx(y.p, y.small)}><strong>Too much:</strong> {item.lens.over}</p>
          </>
        )}
      </Section>
      <Section eyebrow="The shadow" shadowBox>
        <p className={y.p}>{item.shadow}</p>
        {item.cost && <p className={cx(y.p, y.small)}><strong>What it costs:</strong> {item.cost}</p>}
        {item.watchFor && <p className={cx(y.p, y.small)}><strong>Watch for:</strong> {item.watchFor}</p>}
      </Section>
    </>
  );
}

function MeScreen({ data }: { data: CardApp }) {
  const k = data.karma;
  return (
    <>
      <div className={y.eyebrow}>Me · born {data.birthdateDisplay}</div>
      <IdentityBlock item={data.identity.birth} label="Birth card" />
      {data.identity.birth.lifeDirection && (
        <Section eyebrow="Life direction">
          <p className={y.p}>{data.identity.birth.lifeDirection}</p>
        </Section>
      )}
      {data.identity.ruling
        .filter((r) => r.card.code !== data.identity.birth.card.code)
        .map((r, i) => (
          <Section key={r.card.code} eyebrow="Ruling card">
            <CardLine label={r.title || "Ruling card"} item={r} blurb={i === 0 ? data.copy.ruling : data.copy.rulingSecond} />
            <p className={cx(y.p, y.small)}>{r.coreIdentity}</p>
          </Section>
        ))}

      <Section eyebrow="Karma cards · for life" shadowBox>
        {k.fixed ? (
          <p className={y.p}>Your card is one of the three fixed cards. It has no karma cards: the pressure comes from inside.</p>
        ) : (
          <>
            {k.challenge && <CardLine label="Karma challenge" item={k.challenge} blurb={data.copy.karmaChallenge} />}
            {k.gift && <CardLine label="Karma gift" item={k.gift} blurb={data.copy.karmaGift} shadow={false} />}
          </>
        )}
      </Section>

      <Section eyebrow="Your Life Spread · cards for life">
        <div className={s.seats}>
          {data.lifeSpread.periods.map((p) => (
            <div key={p.planet} className={s.seat}>
              <Pc card={p.card} size="xs" />
              {p.planet}
            </div>
          ))}
          <div className={s.seat}><Pc card={data.lifeSpread.pluto.card} size="xs" />Pluto</div>
          <div className={s.seat}><Pc card={data.lifeSpread.result.card} size="xs" />Result</div>
        </div>
        <CardLine label="Saturn · life lesson" item={data.lifeSpread.periods[4]} blurb={data.copy.lifeSaturn} />
        <CardLine label="Jupiter · life blessing" item={data.lifeSpread.periods[3]} blurb={data.copy.lifeJupiter} shadow={false} />
      </Section>
    </>
  );
}

/* ---------- Good days ---------- */

const KIND_LABEL: Record<AppEventKind, string> = { good: "Good", watch: "Watch", turn: "Turning point" };

function DaysScreen({ data }: { data: CardApp }) {
  const [filter, setFilter] = useState<AppEventKind | "all">("good");
  const list = data.events.filter((e) => filter === "all" || e.kind === filter);
  const byMonth = useMemo(() => {
    const groups = new Map<string, AppEvent[]>();
    for (const e of list) {
      const key = new Date(e.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    return [...groups];
  }, [list]);
  return (
    <>
      <div className={y.eyebrow}>Good days · next 12 months</div>
      <h2 className={y.h1}>When your cards line up</h2>
      <p className={y.p}>Days your daily card matches one of your key cards, plus your blessing window and every turning point. A mirror, not a forecast.</p>
      <div className={s.chips} role="group" aria-label="Filter">
        {(["good", "watch", "turn", "all"] as const).map((k) => (
          <button key={k} type="button" className={cx(s.chip, filter === k && s.chipOn)} aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {k === "all" ? "All" : KIND_LABEL[k]}
          </button>
        ))}
      </div>
      {byMonth.length === 0 && <p className={y.p}>Nothing in this list for the next 12 months.</p>}
      {byMonth.map(([month, events]) => (
        <div key={month} className={y.stack}>
          <div className={s.month}>{month}</div>
          <div className={y.card} style={{ padding: "2px 16px" }}>
            {events.map((e, i) => (
              <div key={i} className={s.event}>
                {e.card ? <Pc card={e.card} size="xs" /> : <span />}
                <div className={y.stack} style={{ gap: 3 }}>
                  <span className={cx(s.kind, s[e.kind])}>{KIND_LABEL[e.kind]} · {e.label}</span>
                  <p className={cx(y.p, y.small)}><strong>{e.title}.</strong> {e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- People ---------- */

type Person = { id: string; name: string; birthdate: string };
const PEOPLE_KEY = "cardology.app.people";

function loadPeople(): Person[] {
  try {
    const raw = window.localStorage.getItem(PEOPLE_KEY);
    const list = raw ? (JSON.parse(raw) as Person[]) : [];
    return Array.isArray(list) ? list.filter((p) => p && typeof p.birthdate === "string") : [];
  } catch {
    return [];
  }
}

function savePeople(list: Person[]) {
  try {
    window.localStorage.setItem(PEOPLE_KEY, JSON.stringify(list));
  } catch {
    // Private mode or blocked storage: the list lives for this visit only.
  }
}

function SeatList({ title, seats, empty }: { title: string; seats: ConnectionSeat[]; empty: string }) {
  return (
    <div className={y.stack} style={{ gap: 10 }}>
      <div className={y.eyebrow}>{title}</div>
      {seats.length === 0 && <p className={cx(y.p, y.small)}>{empty}</p>}
      {seats.map((seat, i) => (
        <div key={i} className={y.row}>
          <Pc card={seat.card} size="xs" />
          <p className={cx(y.p, y.small)}>
            <strong>{seat.position}</strong> · {seat.board === "yours" ? "their" : "your"} {seat.cardAnchor} ({seat.card.code}) on {seat.board === "yours" ? "your" : "their"} {seat.boardAnchor} board. {seat.reading}
          </p>
        </div>
      ))}
    </div>
  );
}

function ConnectionResult({ result }: { result: AppConnection }) {
  return (
    <>
      <div className={y.hero}>
        <Pc card={result.birthCard} size="sm" />
        <div className={y.stack} style={{ gap: 4 }}>
          <span className={y.planet}>{result.name}</span>
          <h3 className={y.h3}>{result.birthCard.name}</h3>
          {result.ruling[0] && <span className={y.note}>Ruling card: {result.ruling[0].name}</span>}
        </div>
      </div>
      <p className={y.p}>{result.summary}</p>
      <SeatList title={`${result.name} on your boards`} seats={result.theyOnYou} empty="Their cards don't land on your boards." />
      <div className={y.divider} />
      <SeatList title={`You on ${result.name}'s boards`} seats={result.youOnThem} empty="Your cards don't land on their boards." />
    </>
  );
}

/** Product-page sample: one precomputed comparison, no form and no API call. */
function SamplePeopleScreen({ connection }: { connection: AppConnection }) {
  return (
    <>
      <div className={y.eyebrow}>People · compatibility</div>
      <h2 className={y.h1}>How you two connect</h2>
      <p className={y.p}>In your app you add anyone by name and birthday. Here&rsquo;s one example.</p>
      <div className={cx(y.card, y.stack)} style={{ gap: 14 }}>
        <ConnectionResult result={connection} />
      </div>
    </>
  );
}

function PeopleScreen({ token }: { token: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [result, setResult] = useState<AppConnection | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setPeople(loadPeople()), []);

  async function compare(person: Person) {
    setOpenId(person.id);
    setResult(null);
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/card-app/connection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, birthdate: person.birthdate, name: person.name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not compare.");
      setResult(body as AppConnection);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compare.");
    } finally {
      setBusy(false);
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      setError("Pick a full birthday.");
      return;
    }
    const person = { id: `${Date.now()}`, name: name.trim() || "Someone", birthdate };
    const next = [...people, person];
    setPeople(next);
    savePeople(next);
    setName("");
    setBirthdate("");
    void compare(person);
  }

  function remove(id: string) {
    const next = people.filter((p) => p.id !== id);
    setPeople(next);
    savePeople(next);
    if (openId === id) {
      setOpenId(null);
      setResult(null);
    }
  }

  return (
    <>
      <div className={y.eyebrow}>People · compatibility</div>
      <h2 className={y.h1}>How you two connect</h2>
      <p className={y.p}>Add anyone. We compare both birth cards and both ruling cards, in both directions. Your list is saved only on this device; to compare, we send the birthday to our server and don&rsquo;t keep it.</p>
      {/* ph-no-capture: PostHog autocapture must never record the names people add. */}
      <form onSubmit={add} className={cx(y.stack, "ph-no-capture")}>
        <div className={cx(y.field, s.fieldCol)}>
          <label htmlFor="person-name">Name</label>
          <input id="person-name" className={y.input} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Their name" />
        </div>
        <div className={cx(y.field, s.fieldCol)}>
          <label htmlFor="person-bday">Birthday</label>
          <input id="person-bday" type="date" className={y.input} value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required />
        </div>
        <button type="submit" className={y.btn}>Compare</button>
      </form>
      {error && !openId && <p className={s.error} role="alert">{error}</p>}

      {people.length > 0 && (
        <div className={cx(y.card, "ph-no-capture")} style={{ padding: "2px 16px" }}>
          {people.map((p) => (
            <div key={p.id} className={cx(y.row, y.between, s.personRow)}>
              <button type="button" className={s.rowBtn} onClick={() => compare(p)} aria-expanded={openId === p.id}>
                <span className={y.p}><strong>{p.name}</strong></span>
                <span className={y.note}>{openId === p.id ? "open" : "compare →"}</span>
              </button>
              <button type="button" className={s.remove} onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>✕</button>
            </div>
          ))}
        </div>
      )}

      {openId && (
        <div className={cx(y.card, y.stack, "ph-no-capture")} style={{ gap: 14 }} aria-live="polite">
          {busy && <p className={y.p}>Reading both boards…</p>}
          {error && <p className={s.error} role="alert">{error}</p>}
          {result && <ConnectionResult result={result} />}
        </div>
      )}
    </>
  );
}

/* ---------- app ---------- */

const ICONS: Record<ScreenId, React.ReactNode> = {
  today: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></svg>,
  year: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" /></svg>,
  me: <svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M12 9v6M9 12h6" /></svg>,
  days: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M12 13l1 2h2l-1.5 1.5.5 2-2-1-2 1 .5-2L9 15h2z" /></svg>,
  people: <svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3" /><circle cx="16" cy="10" r="2.5" /><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M14 20c0-2 1-4 3-4s4 2 4 4" /></svg>,
};

const LABELS: Record<ScreenId, string> = { today: "Today", year: "Year", me: "Me", days: "Good days", people: "People" };
const TABS: ScreenId[] = ["today", "year", "me", "days", "people"];

/**
 * The server builds "today" in UTC. If the buyer's own calendar date differs
 * (evenings in the Americas, mornings in Asia), rebuild for their date once.
 * Checked again when the app comes back to the screen and at local midnight,
 * so an app left open or resumed from the home screen never shows yesterday.
 */
function LocalDateSync({ today }: { today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === "hidden") return;
      const local = localIso();
      if (local !== today && params.get("date") !== local) {
        const next = new URLSearchParams(params.toString());
        next.set("date", local);
        router.replace(`${pathname}?${next.toString()}`);
      }
    };
    sync();
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const timer = window.setTimeout(sync, midnight.getTime() - now.getTime());
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("focus", sync);
    };
  }, [today, params, pathname, router]);
  return null;
}

type CardAppViewProps =
  | { data: CardApp; token: string; sample?: undefined; framed?: boolean }
  | { data: CardApp; token?: undefined; sample: { connection: AppConnection }; framed?: boolean };

/**
 * The buyer's app (`token`), or a fixed sample for the product page (`sample`):
 * the sample shows one precomputed comparison. Both sync to the viewer's date.
 */
export function CardAppView({ data, token, sample, framed = false }: CardAppViewProps) {
  const [screen, setScreen] = useState<ScreenId>("today");
  const screenRef = useRef<HTMLElement>(null);

  const go = (id: ScreenId) => {
    setScreen(id);
    if (framed) screenRef.current?.scrollTo({ top: 0 });
    else if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  const inner = (() => {
    switch (screen) {
      case "today": return <TodayScreen data={data} go={go} />;
      case "year": return <YearScreen data={data} />;
      case "me": return <MeScreen data={data} />;
      case "days": return <DaysScreen data={data} />;
      case "people": return sample ? <SamplePeopleScreen connection={sample.connection} /> : <PeopleScreen token={token} />;
    }
  })();
  return (
    <div className={y.root}>
      <Suspense fallback={null}>
        <LocalDateSync today={data.today} />
      </Suspense>
      {!sample && <h1 className="sr-only">Your Card Blueprint App</h1>}
      <div className={framed ? y.phone : y.full}>
        {framed && <div className={y.notch} />}
        {framed && <div className={y.status}><span>{data.day.today.weekday}</span><span>{data.day.today.label}</span></div>}
        <section className={y.screen} key={screen} ref={screenRef}>{inner}</section>
        <nav className={cx(y.tabs, s.tabs5)} aria-label="Sections">
          {TABS.map((id) => (
            <button key={id} type="button" className={cx(y.tab, screen === id && y.tabOn)} onClick={() => go(id)} aria-current={screen === id ? "page" : undefined}>
              {ICONS[id]}{LABELS[id]}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
