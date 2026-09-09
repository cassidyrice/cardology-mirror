"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { HourBucket, LivePayload } from "@/lib/live-metrics";

const TOKEN_KEY = "cb.live.token";
const POLL_MS = 30_000;

/* Palette validated with the dataviz skill against the ink surface (#14110d):
   "#b08a33,#4a94d0,#c94b2e" passes all six checks in that order.
   gold = calculator series, slate(blue) = traffic/secondary, ember = money and CTA. */
const C = {
  bg: "#14110d",
  panel: "#1c1712",
  line: "rgba(246,241,232,0.10)",
  ink: "#f6f1e8",
  mist: "#bfb5a8",
  faint: "#7d7368",
  gold: "#b08a33",
  ember: "#c94b2e",
  slate: "#4a94d0",
  good: "#8fc7a1",
  bad: "#c94b2e",
};

const STEP_LABEL: Record<string, string> = {
  organic_landing: "Landings",
  calculator_started: "Calc started",
  calculator_completed: "Calc completed",
  sample_viewed: "Sample viewed",
  offer_cta_clicked: "$19 CTA clicks",
  checkout_started: "Checkouts",
  purchase_completed: "Paid",
  reading_cta_clicked: "Reading CTA",
  checkout_error: "Checkout errors",
  card_shared: "Shares",
};

const FUNNEL: { key: string; label: string }[] = [
  { key: "calculator_completed", label: "Calculator completed" },
  { key: "sample_viewed", label: "Saw page 1 sample" },
  { key: "offer_cta_clicked", label: "Tapped $19" },
  { key: "checkout_started", label: "Reached Stripe" },
  { key: "purchase_completed", label: "Paid" },
];

function useToken(): [string, (t: string) => void] {
  const [token, setToken] = useState("");
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("t");
      if (fromUrl) {
        sessionStorage.setItem(TOKEN_KEY, fromUrl);
        const url = new URL(window.location.href);
        url.searchParams.delete("t");
        window.history.replaceState(null, "", url.toString());
        setToken(fromUrl);
        return;
      }
      setToken(sessionStorage.getItem(TOKEN_KEY) ?? "");
    } catch {
      setToken("");
    }
  }, []);
  const save = useCallback((t: string) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* private mode */
    }
    setToken(t);
  }, []);
  return [token, save];
}

export function LiveDashboard() {
  const [token, saveToken] = useToken();
  const [data, setData] = useState<LivePayload | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/live", { headers: { "x-live-token": token }, cache: "no-store" });
      const json = (await res.json()) as LivePayload & { error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void load();
    timer.current = window.setInterval(() => void load(), POLL_MS);
    const clock = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      window.clearInterval(clock);
    };
  }, [token, load]);

  if (!token) return <TokenGate onSubmit={saveToken} />;

  return (
    <main style={{ background: C.bg, color: C.ink, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <style>{css}</style>
      <header className="lv-head">
        <div>
          <p className="lv-kicker">Card Blueprints · live</p>
          <h1 className="lv-title">Money funnel, right now</h1>
        </div>
        <div className="lv-status">
          <span className={`lv-dot ${error ? "bad" : loading ? "busy" : "ok"}`} aria-hidden />
          <span>
            {error ? `error: ${error}` : data ? `updated ${ago(data.generatedAt, tick)} · ${data.timezone}` : "loading…"}
          </span>
          <button className="lv-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
        </div>
      </header>

      {data ? (
        <>
          <section className="lv-grid tiles">
            <Tile label="Events, last 10 min" value={fmt(data.pulse.events10m)} sub={`${fmt(data.pulse.sessions10m)} sessions`} accent={C.gold}>
              <Sparkline values={data.pulse.perMinute} color={C.gold} />
            </Tile>
            <Tile label="Calculator completed today" value={fmt(w(data, "today", "calculator_completed"))} sub={`yesterday ${fmt(w(data, "yesterday", "calculator_completed"))}`} accent={C.gold} />
            <Tile label="$19 CTA taps today" value={fmt(w(data, "today", "offer_cta_clicked"))} sub={`${pct(w(data, "today", "offer_cta_clicked"), w(data, "today", "calculator_completed"))} of completions`} accent={C.ember} />
            <Tile label="Breakdown paid today" value={fmt(data.stripe.deepDive.today.complete)} sub={`$${(data.stripe.deepDive.today.revenueCents / 100).toFixed(0)} · ${fmt(data.stripe.deepDive.today.open + data.stripe.deepDive.today.expired)} unpaid sessions`} accent={C.ember} money />
            <Tile label="Reading Day CTA taps today" value={fmt(w(data, "today", "reading_cta_clicked"))} sub={`7d ${fmt(w(data, "last7d", "reading_cta_clicked"))}`} accent={C.slate} />
            <Tile label="Reading Day slots paid" value={fmt(data.stripe.reading.paidTotal)} sub={`of 10 · today ${fmt(data.stripe.reading.today.complete)}`} accent={C.slate} money progress={Math.min(1, data.stripe.reading.paidTotal / 10)} />
          </section>

          <section className="lv-grid two">
            <Panel title="Today's funnel" sub="each step as a share of calculator completions">
              <Funnel data={data} />
            </Panel>
            <Panel title="Last 24 hours" sub="calculator completions and $19 taps per hour">
              <Hourly buckets={data.hourly24} showTable={showTable} onToggle={() => setShowTable((s) => !s)} />
            </Panel>
          </section>

          <section className="lv-grid three">
            <Panel title="Where completions happen" sub="last 36 h, by placement">
              <Bars data={data.placements.calculator} color={C.gold} />
            </Panel>
            <Panel title="Where $19 taps happen" sub="last 36 h, by placement">
              <Bars data={data.placements.cta} color={C.ember} />
            </Panel>
            <Panel title="Traffic channel" sub="landings, last 36 h">
              <Bars data={data.channels} color={C.slate} />
            </Panel>
          </section>

          <section className="lv-grid two">
            <Panel title="Top landing pages" sub="last 36 h · landings → completions on that page">
              <table className="lv-table">
                <thead><tr><th>Path</th><th className="num">Landings</th><th className="num">Completions</th></tr></thead>
                <tbody>
                  {data.pages.map((p) => (
                    <tr key={p.path}><td className="mono">{p.path || "/"}</td><td className="num">{fmt(p.landings)}</td><td className="num">{fmt(p.completions)}</td></tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <Panel title="Live feed" sub="last events as they land">
              <ul className="lv-feed">
                {data.recent.slice(0, 25).map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    <span className="lv-feed-time">{ago(e.at, tick)}</span>
                    <span className={`lv-pill ${pillClass(e.event)}`}>{STEP_LABEL[e.event] ?? e.event}</span>
                    <span className="mono lv-feed-path">{e.path}</span>
                    {e.placement ? <span className="lv-feed-meta">{e.placement}</span> : null}
                    {e.channel ? <span className="lv-feed-meta">{e.channel}</span> : null}
                    {e.valueCents ? <span className="lv-feed-money">${(e.valueCents / 100).toFixed(0)}</span> : null}
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <section className="lv-grid one">
            <Panel title="Week over week" sub="last 7 days vs the 7 before">
              <table className="lv-table">
                <thead><tr><th>Step</th><th className="num">Today</th><th className="num">Yesterday</th><th className="num">Last 7d</th><th className="num">Prev 7d</th><th className="num">Δ</th></tr></thead>
                <tbody>
                  {["organic_landing", "calculator_completed", "sample_viewed", "offer_cta_clicked", "checkout_started", "purchase_completed", "reading_cta_clicked", "checkout_error"].map((k) => {
                    const a = w(data, "last7d", k), b = w(data, "prev7d", k);
                    const d = b ? Math.round(((a - b) / b) * 100) : null;
                    return (
                      <tr key={k}>
                        <td>{STEP_LABEL[k] ?? k}</td>
                        <td className="num">{fmt(w(data, "today", k))}</td>
                        <td className="num">{fmt(w(data, "yesterday", k))}</td>
                        <td className="num">{fmt(a)}</td>
                        <td className="num">{fmt(b)}</td>
                        <td className="num" style={{ color: d === null ? C.faint : d >= 0 ? C.good : C.bad }}>{d === null ? "–" : `${d > 0 ? "+" : ""}${d}%`}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td>52xSeven Blueprint paid (Stripe)</td>
                    <td className="num">{fmt(data.stripe.deepDive.today.complete)}</td>
                    <td className="num">–</td>
                    <td className="num">{fmt(data.stripe.deepDive.last7d.complete)}</td>
                    <td className="num">–</td>
                    <td className="num" style={{ color: C.faint }}>${(data.stripe.deepDive.last7d.revenueCents / 100).toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
              {!data.stripe.ok ? <p className="lv-note">Stripe: {data.stripe.error}</p> : null}
              <p className="lv-note">Counts are Cloudflare Analytics Engine sums weighted by sample interval; money is Stripe. Days are {data.timezone}.</p>
            </Panel>
          </section>
        </>
      ) : !error ? (
        <p className="lv-loading">Pulling the funnel…</p>
      ) : (
        <p className="lv-loading">{error}. <button className="lv-btn" onClick={() => saveToken("")}>Change token</button></p>
      )}
    </main>
  );
}

/* ---------- pieces ---------- */

function TokenGate({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <main style={{ background: C.bg, color: C.ink, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif" }}>
      <style>{css}</style>
      <form className="lv-gate" onSubmit={(e) => { e.preventDefault(); if (v.trim().length >= 16) onSubmit(v.trim()); }}>
        <p className="lv-kicker">Card Blueprints · live</p>
        <label htmlFor="lv-token">Dashboard token</label>
        <input id="lv-token" type="password" value={v} onChange={(e) => setV(e.target.value)} autoComplete="off" />
        <button className="lv-btn" type="submit">Open</button>
      </form>
    </main>
  );
}

function Tile({ label, value, sub, accent, money, progress, children }: { label: string; value: string; sub?: string; accent: string; money?: boolean; progress?: number; children?: React.ReactNode }) {
  return (
    <div className="lv-tile" style={{ borderTopColor: accent }}>
      <p className="lv-tile-label">{label}</p>
      <p className="lv-tile-value" style={{ color: money ? accent : C.ink }}>{value}</p>
      {sub ? <p className="lv-tile-sub">{sub}</p> : null}
      {typeof progress === "number" ? (
        <div className="lv-progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progress * 100}%`, background: accent }} />
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="lv-panel">
      <h2 className="lv-panel-title">{title}</h2>
      {sub ? <p className="lv-panel-sub">{sub}</p> : null}
      {children}
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 240, h = 40, max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="lv-spark" aria-label="events per minute, last hour">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Funnel({ data }: { data: LivePayload }) {
  const base = Math.max(1, w(data, "today", "calculator_completed"));
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="lv-funnel">
      {FUNNEL.map((s, i) => {
        const v = s.key === "purchase_completed" ? data.stripe.deepDive.today.complete : w(data, "today", s.key);
        const prev = i === 0 ? null : FUNNEL[i - 1].key === "purchase_completed" ? 0 : w(data, "today", FUNNEL[i - 1].key);
        const share = Math.min(1, v / base);
        return (
          <div key={s.key} className="lv-frow" onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}>
            <span className="lv-flabel">{s.label}</span>
            <div className="lv-fbar">
              <div style={{ width: `${Math.max(share * 100, v ? 1.5 : 0)}%`, background: i >= 2 ? C.ember : C.gold }} />
            </div>
            <span className="lv-fval">{fmt(v)}</span>
            <span className="lv-fpct">{i === 0 ? "100%" : pct(v, base)}{hover === s.key && prev ? ` · ${pct(v, prev)} of previous step` : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

function Hourly({ buckets, showTable, onToggle }: { buckets: HourBucket[]; showTable: boolean; onToggle: () => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const series = [
    { key: "calculator_completed", label: "Calc completed", color: C.gold },
    { key: "offer_cta_clicked", label: "$19 taps", color: C.ember },
  ];
  const W = 560, H = 180, padL = 30, padB = 22, padT = 8;
  const max = Math.max(1, ...buckets.map((b) => b.counts.calculator_completed ?? 0));
  const bw = (W - padL) / buckets.length;
  const tz = "America/Chicago";
  const hourLabel = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric" }).format(new Date(iso)).toLowerCase().replace(" ", "");
  return (
    <div>
      <div className="lv-legend">
        {series.map((s) => (<span key={s.key}><i style={{ background: s.color }} />{s.label}</span>))}
        <button className="lv-btn small" onClick={onToggle}>{showTable ? "Chart" : "Table"}</button>
      </div>
      {showTable ? (
        <table className="lv-table">
          <thead><tr><th>Hour</th>{series.map((s) => <th key={s.key} className="num">{s.label}</th>)}</tr></thead>
          <tbody>{buckets.map((b) => (<tr key={b.hour}><td>{hourLabel(b.hour)}</td>{series.map((s) => <td key={s.key} className="num">{fmt(b.counts[s.key] ?? 0)}</td>)}</tr>))}</tbody>
        </table>
      ) : (
        <div className="lv-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="lv-chart" role="img" aria-label="hourly calculator completions and $19 taps">
            {[0.5, 1].map((g) => (
              <g key={g}>
                <line x1={padL} x2={W} y1={padT + (H - padB - padT) * (1 - g)} y2={padT + (H - padB - padT) * (1 - g)} stroke={C.line} />
                <text x={padL - 6} y={padT + (H - padB - padT) * (1 - g) + 4} fill={C.faint} fontSize={10} textAnchor="end">{Math.round(max * g)}</text>
              </g>
            ))}
            {buckets.map((b, i) => {
              const calc = b.counts.calculator_completed ?? 0, cta = b.counts.offer_cta_clicked ?? 0;
              const x = padL + i * bw + 2, bwi = Math.max(2, bw - 4);
              const hCalc = ((H - padB - padT) * calc) / max, hCta = ((H - padB - padT) * cta) / max;
              return (
                <g key={b.hour} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={x} y={padT} width={bwi} height={H - padB - padT} fill="transparent" />
                  <rect x={x} y={H - padB - hCalc} width={bwi} height={hCalc} rx={2} fill={C.gold} opacity={hover === null || hover === i ? 1 : 0.55} />
                  <rect x={x + bwi * 0.3} y={H - padB - hCta} width={bwi * 0.4} height={hCta} rx={2} fill={C.ember} opacity={hover === null || hover === i ? 1 : 0.55} />
                  {i % 4 === 0 ? <text x={x + bwi / 2} y={H - 6} fill={C.faint} fontSize={10} textAnchor="middle">{hourLabel(b.hour)}</text> : null}
                </g>
              );
            })}
          </svg>
          {hover !== null ? (
            <div className="lv-tip">
              <strong>{hourLabel(buckets[hover].hour)}</strong>
              <span>{fmt(buckets[hover].counts.calculator_completed ?? 0)} completed · {fmt(buckets[hover].counts.offer_cta_clicked ?? 0)} taps · {fmt(buckets[hover].counts.checkout_started ?? 0)} checkouts</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Bars({ data, color }: { data: Record<string, number>; color: string }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  if (!rows.length) return <p className="lv-note">Nothing yet.</p>;
  return (
    <div className="lv-bars">
      {rows.map(([k, v]) => (
        <div key={k} className="lv-brow" title={`${k}: ${v}`}>
          <span className="lv-blabel">{k}</span>
          <div className="lv-bbar"><div style={{ width: `${(v / max) * 100}%`, background: color }} /></div>
          <span className="lv-bval">{fmt(v)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- helpers ---------- */

function w(d: LivePayload, win: keyof LivePayload["windows"], key: string): number {
  return d.windows[win][key] ?? 0;
}
function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
function pct(a: number, b: number): string {
  if (!b) return "–";
  const p = (a / b) * 100;
  return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`;
}
function ago(iso: string, _tick: number): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
}
function pillClass(e: string): string {
  if (e === "purchase_completed") return "money";
  if (e === "checkout_started" || e === "offer_cta_clicked") return "warm";
  if (e === "checkout_error") return "bad";
  return "";
}

const css = `
.lv-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:22px 24px 8px;flex-wrap:wrap}
.lv-kicker{margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.gold}}
.lv-title{margin:4px 0 0;font:600 26px/1.1 ui-serif,Georgia,serif;color:${C.ink}}
.lv-status{display:flex;align-items:center;gap:10px;font-size:12px;color:${C.mist}}
.lv-dot{width:9px;height:9px;border-radius:50%;background:${C.good};box-shadow:0 0 0 0 rgba(143,199,161,.6);animation:lvpulse 2s infinite}
.lv-dot.busy{background:${C.gold};animation:none}.lv-dot.bad{background:${C.bad};animation:none}
@keyframes lvpulse{0%{box-shadow:0 0 0 0 rgba(143,199,161,.55)}70%{box-shadow:0 0 0 8px rgba(143,199,161,0)}100%{box-shadow:0 0 0 0 rgba(143,199,161,0)}}
.lv-btn{background:transparent;border:1px solid ${C.line};color:${C.ink};border-radius:4px;padding:6px 10px;font-size:12px;cursor:pointer}
.lv-btn.small{padding:3px 8px;font-size:11px;margin-left:auto}
.lv-btn:hover{border-color:${C.gold}}
.lv-grid{display:grid;gap:14px;padding:10px 24px}
.lv-grid.tiles{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.lv-grid.two{grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}
.lv-grid.three{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.lv-tile{background:${C.panel};border:1px solid ${C.line};border-top:3px solid;border-radius:8px;padding:14px 16px 12px;min-height:118px}
.lv-tile-label{margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${C.mist}}
.lv-tile-value{margin:6px 0 0;font:600 34px/1 ui-serif,Georgia,serif;font-variant-numeric:tabular-nums}
.lv-tile-sub{margin:6px 0 0;font-size:12px;color:${C.faint}}
.lv-progress{height:6px;background:${C.line};border-radius:3px;margin-top:10px;overflow:hidden}.lv-progress div{height:100%;border-radius:3px}
.lv-spark{width:100%;height:40px;margin-top:8px;display:block}
.lv-panel{background:${C.panel};border:1px solid ${C.line};border-radius:8px;padding:16px 18px}
.lv-panel-title{margin:0;font:600 17px/1.2 ui-serif,Georgia,serif}
.lv-panel-sub{margin:2px 0 12px;font-size:12px;color:${C.faint}}
.lv-funnel{display:grid;gap:8px}
.lv-frow{display:grid;grid-template-columns:150px 1fr 48px 140px;align-items:center;gap:10px;font-size:13px}
.lv-flabel{color:${C.mist}}.lv-fbar{height:14px;background:${C.line};border-radius:3px;overflow:hidden}.lv-fbar div{height:100%;border-radius:3px;transition:width .4s}
.lv-fval{text-align:right;font-variant-numeric:tabular-nums}.lv-fpct{font-size:11px;color:${C.faint}}
.lv-legend{display:flex;gap:14px;align-items:center;font-size:12px;color:${C.mist};margin-bottom:6px}
.lv-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.lv-chart-wrap{position:relative}.lv-chart{width:100%;height:auto;display:block}
.lv-tip{position:absolute;top:6px;right:8px;background:${C.bg};border:1px solid ${C.line};border-radius:6px;padding:6px 10px;font-size:12px;display:grid;gap:2px;color:${C.mist}}
.lv-tip strong{color:${C.ink}}
.lv-bars{display:grid;gap:7px}.lv-brow{display:grid;grid-template-columns:150px 1fr 40px;gap:10px;align-items:center;font-size:12px}
.lv-blabel{color:${C.mist};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lv-bbar{height:10px;background:${C.line};border-radius:3px;overflow:hidden}.lv-bbar div{height:100%;border-radius:3px}
.lv-bval{text-align:right;font-variant-numeric:tabular-nums}
.lv-table{width:100%;border-collapse:collapse;font-size:12.5px}.lv-table th{text-align:left;font-weight:500;color:${C.faint};padding:4px 6px;border-bottom:1px solid ${C.line}}
.lv-table td{padding:5px 6px;border-bottom:1px solid ${C.line}}.lv-table .num{text-align:right;font-variant-numeric:tabular-nums}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.lv-feed{list-style:none;margin:0;padding:0;display:grid;gap:6px;max-height:420px;overflow:auto}
.lv-feed li{display:flex;gap:8px;align-items:center;font-size:12px;flex-wrap:wrap}
.lv-feed-time{color:${C.faint};min-width:54px;font-variant-numeric:tabular-nums}
.lv-feed-path{color:${C.mist};overflow:hidden;text-overflow:ellipsis;max-width:220px;white-space:nowrap}
.lv-feed-meta{color:${C.faint};font-size:11px}.lv-feed-money{color:${C.ember};font-weight:600}
.lv-pill{border:1px solid ${C.line};border-radius:999px;padding:1px 8px;font-size:11px;color:${C.mist}}
.lv-pill.warm{border-color:${C.ember};color:${C.ember}}.lv-pill.money{background:${C.ember};color:${C.bg};border-color:${C.ember}}.lv-pill.bad{border-color:${C.bad};color:${C.bad}}
.lv-note{font-size:11px;color:${C.faint};margin:10px 0 0}
.lv-loading{padding:40px 24px;color:${C.mist}}
.lv-gate{display:grid;gap:10px;min-width:280px;background:${C.panel};border:1px solid ${C.line};border-radius:8px;padding:22px}
.lv-gate label{font-size:12px;color:${C.mist}}.lv-gate input{background:${C.bg};border:1px solid ${C.line};color:${C.ink};border-radius:4px;padding:8px 10px;font-size:14px}
@media (max-width:640px){.lv-frow{grid-template-columns:110px 1fr 40px}.lv-fpct{grid-column:1/-1}.lv-brow{grid-template-columns:110px 1fr 36px}.lv-grid{padding:8px 12px}.lv-head{padding:16px 12px 4px}}
`;
