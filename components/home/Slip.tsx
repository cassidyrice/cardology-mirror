import Link from "next/link";

const STAGES = [
  {
    when: "Free on this site",
    rows: [
      { what: "Calculate your birth card & ruling card", value: "free" },
      { what: "Read all 52 cards, 366 birthdays & 1,378 pairings", value: "free" },
      { what: "Compare your card beside one other person", value: "free" },
    ],
  },
  {
    when: "When you ask a personal question",
    rows: [
      { what: "Type your question & pay inline without leaving the page", value: "$26 or $39" },
      { what: "3 angles drafted from your spread; Cass approves 1", value: "almost all <24h" },
      { what: "Delivered straight to your email or text messages", value: "48h max" },
    ],
  },
] as const;

export function Slip() {
  return (
    <>
      <p className="slip-link" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
        <Link href="/methodology" className="editorial-link">Check the math. We show our work</Link>
      </p>
      <div className="slip-band" data-rise style={{ "--rise-i": 3 } as React.CSSProperties}>
        <div className="slip" role="group" aria-label="How a reading happens">
          {STAGES.map((stage) => (
            <div key={stage.when} className="slip-stage">
              <p className="slip-when">{stage.when}</p>
              <ul className="slip-rows">
                {stage.rows.map((row) => (
                  <li key={row.what} className="slip-row">
                    <span className="slip-what">{row.what}</span>
                    <span className="slip-dots" aria-hidden="true" />
                    <span className="slip-value tnum">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="slip-total">
            <span>No generic PDF. A real answer with exact dates</span>
            <span className="tnum">$26 · $39</span>
          </p>
        </div>
      </div>
      <p className="slip-note" data-rise style={{ "--rise-i": 4 } as React.CSSProperties}>
        An old card system. Your judgment still applies.
      </p>
    </>
  );
}
