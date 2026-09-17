"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RulingCardReferenceRow } from "@/lib/ruling-card-reference";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function matchesRulingCardReference(row: RulingCardReferenceRow, query: string) {
  const q = query.trim().toLowerCase().replace(/[\uFE0E\uFE0F]/g, "");
  if (!q) return true;
  const numericDate = q.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
  if (numericDate) return row.month === Number(numericDate[1]) && row.day === Number(numericDate[2]);
  const namedDate = q.match(/^([a-z]+)\s+(\d{1,2})$/);
  if (namedDate && MONTHS.some((m) => m.toLowerCase().startsWith(namedDate[1]))) {
    return MONTHS[row.month - 1].toLowerCase().startsWith(namedDate[1]) && row.day === Number(namedDate[2]);
  }
  const fields = [row.dateLabel, `${row.month}/${row.day}`, ...[row.birthCard, ...row.rulingCards].map((card) => `${card.label} ${card.code}`)];
  const words = q.split(/\s+/);
  return fields.some((field) => words.every((word) => field.toLowerCase().includes(word)));
}

export function PlanetaryRulingCardChart({ rows }: { rows: RulingCardReferenceRow[] }) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [targetId, setTargetId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    function reveal(id: string) {
      if (!rows.some((row) => row.id === id)) return;
      setQuery("");
      setMonth("all");
      setTargetId(id);
      // Also handle a repeated link to the current hash after filtering or
      // manually closing a month. That click does not emit hashchange.
      requestAnimationFrame(() => {
        const target = document.getElementById(id);
        const disclosure = target?.closest("details");
        if (disclosure) disclosure.open = true;
        target?.scrollIntoView({ block: "center" });
      });
    }
    const revealHash = () => reveal(window.location.hash.slice(1));
    function revealLink(event: MouseEvent) {
      const anchor = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
      if (anchor) reveal(anchor.getAttribute("href")!.slice(1));
    }
    revealHash();
    window.addEventListener("hashchange", revealHash);
    document.addEventListener("click", revealLink);
    return () => {
      window.removeEventListener("hashchange", revealHash);
      document.removeEventListener("click", revealLink);
    };
  }, [rows]);

  useEffect(() => {
    if (targetId && !query && month === "all") {
      const target = document.getElementById(targetId);
      const disclosure = target?.closest("details");
      if (disclosure) disclosure.open = true;
      target?.scrollIntoView({ block: "center" });
    }
  }, [targetId, query, month]);

  const filtered = rows.filter((row) => (month === "all" || row.month === Number(month)) && matchesRulingCardReference(row, query));
  const activeFilter = query.trim() !== "" || month !== "all";

  return (
    <div data-ruling-card-chart>
      {ready && (
        <div className="my-5 border border-brand-line bg-brand-ivory p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <div>
              <label htmlFor="ruling-search" className="block text-sm font-semibold">Search a birthday or card</label>
              <input id="ruling-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="January 15, 10/23, Queen of Hearts…" className="mt-2 min-h-12 w-full border border-brand-line-strong bg-white px-3 text-base text-brand-ink focus:outline-2 focus:outline-offset-2 focus:outline-brand-oxblood" aria-controls="ruling-chart-results" autoComplete="off" />
            </div>
            <div>
              <label htmlFor="ruling-month" className="block text-sm font-semibold">Month</label>
              <select id="ruling-month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-2 min-h-12 w-full border border-brand-line-strong bg-white px-3 text-base text-brand-ink focus:outline-2 focus:outline-offset-2 focus:outline-brand-oxblood" aria-controls="ruling-chart-results">
                <option value="all">All months</option>
                {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2 text-sm text-brand-ink-soft">
            <p role="status" aria-live="polite" aria-atomic="true">{filtered.length} of {rows.length} birthdays{query.trim() ? " match your search" : " shown"}.</p>
            {activeFilter && <button type="button" onClick={() => { setQuery(""); setMonth("all"); }} className="min-h-11 px-2 font-semibold text-brand-oxblood underline underline-offset-4">Clear filters</button>}
          </div>
          <p className="text-xs leading-relaxed text-brand-ink-soft">Card searches match both the birth card and ruling cards.</p>
        </div>
      )}
      <div id="ruling-chart-results" className="mt-5 space-y-3">
        {filtered.length === 0 && <p className="border border-brand-line p-5">No birthdays match. Try a date such as 1/15, a card such as 7 of Clubs, or clear the filters.</p>}
        {MONTHS.map((name, index) => {
          const monthRows = filtered.filter((row) => row.month === index + 1);
          if (!monthRows.length) return null;
          return (
            <details key={`${name}-${query}-${month}`} open={activeFilter || monthRows.some((row) => row.id === targetId)} className="border border-brand-line bg-brand-ivory" data-ruling-month={index + 1}>
              <summary className="cursor-pointer px-4 py-4 font-serif text-2xl marker:text-brand-oxblood focus-visible:outline-2 focus-visible:outline-brand-oxblood">
                {name}<span className="ml-3 font-sans text-xs text-brand-ink-soft">{monthRows.length} birthday{monthRows.length === 1 ? "" : "s"}</span>
              </summary>
              <table className="w-full table-fixed border-t border-brand-line text-left text-sm">
                <caption className="sr-only">{name} birth cards and planetary ruling cards</caption>
                <thead className="bg-brand-paper-deep text-xs">
                  <tr><th scope="col" className="w-[22%] px-3 py-3 sm:w-1/4">Birthday</th><th scope="col" className="w-[35%] px-3 py-3">Birth card</th><th scope="col" className="px-3 py-3">Ruling card(s)</th></tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => (
                    <tr key={row.id} id={row.id} data-ruling-date={`${row.month}/${row.day}`} className="scroll-mt-24 border-t border-brand-line align-top target:bg-brand-paper-deep">
                      <th scope="row" className="px-3 py-3 font-normal"><a href={`#${row.id}`} className="underline decoration-brand-line-strong underline-offset-4 hover:decoration-brand-oxblood" aria-label={`Link to ${row.dateLabel}`}>{name.slice(0, 3)} {row.day}</a></th>
                      <td className="break-words px-3 py-3"><Link prefetch={false} href={row.birthCard.href} className="text-brand-oxblood underline underline-offset-4">{row.birthCard.label}</Link></td>
                      <td className="break-words px-3 py-3"><ul className="space-y-2">{row.rulingCards.map((card) => <li key={card.code}><Link prefetch={false} href={card.href} className="text-brand-oxblood underline underline-offset-4">{card.label}</Link></li>)}</ul></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          );
        })}
      </div>
    </div>
  );
}
